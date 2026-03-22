import {
  DEFAULT_BADGE_COLOR,
  DEFAULT_BADGE_TEXT,
  POPUP_DISABLED,
  POPUP_ENABLED,
} from '@/constants/app'
import type {
  BackgroundMessage,
  BackgroundMessageType,
  FetchSubscriptionMessage,
  ProxyConfig,
  SetProxyMessage,
} from '@/interfaces'
import type { AutoProxySubscription, SubscriptionFormat } from '@/interfaces/settings'
import { SettingsReader, SettingsWriter } from '@/services'
import { ChromeService } from '@/services/chrome'
import { browserService } from '@/services/chrome/BrowserService'
import { diagnosticsService } from '@/services/DiagnosticsService'
import { logger } from '@/services/LoggerService'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'
import { SubscriptionParser } from '@/services/SubscriptionParser'
import { parseProxyError } from '@/utils/errorHandling'

/**
 * Flag to track if the background worker is fully initialized
 */
let isInitialized = false

/**
 * Flag to track if event listeners have been registered
 */
let listenersRegistered = false

/**
 * Initialization retry configuration
 */
const INIT_MAX_RETRIES = 3
const INIT_BASE_DELAY = 5000 // 5 seconds
let initRetryCount = 0

/**
 * Message queue for handling messages that arrive during initialization
 */
interface QueuedMessage {
  message: BackgroundMessage
  sender: chrome.runtime.MessageSender
  sendResponse: (response?: unknown) => void
}

const messageQueue: QueuedMessage[] = []

/**
 * Message handler map for processing different types of background messages
 */
// FETCH_SUBSCRIPTION is handled separately in handleRuntimeMessageInternal
const messageHandlers: Partial<
  Record<BackgroundMessageType, (message?: BackgroundMessage) => Promise<void>>
> = {
  QUICK_SWITCH: async () => {
    // Invalidate cache to ensure we read fresh settings
    SettingsReader.invalidateCache()
    await updateQuickAction()
  },
  SET_PROXY: async (message?: BackgroundMessage) => {
    if (!message) return
    const { proxy } = message as SetProxyMessage
    await setProxySettings(proxy)
  },
  CLEAR_PROXY: async () => {
    await clearProxySettings()
  },
  SCRIPT_UPDATE: async () => {
    // Re-setup PAC refresh alarms when scripts are updated
    await setupPacRefreshAlarms()
    await setupSubscriptionRefreshAlarms()
  },
  REFRESH_SUBSCRIPTION: async (message?: BackgroundMessage) => {
    if (!message) return
    const { proxyId, subscriptionId } = message as import('@/interfaces').RefreshSubscriptionMessage
    await refreshSubscription(proxyId, subscriptionId)
  },
}

/**
 * Processes queued messages after initialization completes
 */
async function processMessageQueue(): Promise<void> {
  logger.info(`Processing ${messageQueue.length} queued message(s) after initialization`)

  while (messageQueue.length > 0) {
    const queuedMessage = messageQueue.shift()
    if (queuedMessage) {
      const { message, sender, sendResponse } = queuedMessage
      try {
        await handleRuntimeMessageInternal(message, sender, sendResponse)
      } catch (error) {
        logger.error('Error processing queued message:', error)
        // Send error response but continue processing remaining messages
        try {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        } catch (sendError) {
          logger.error('Failed to send error response:', sendError)
        }
      }
    }
  }

  logger.info('Message queue processing completed')
}

/**
 * Initializes the background worker by setting up listeners and proxy settings
 */
async function initialize(): Promise<void> {
  try {
    logger.info('Background service worker initializing...')

    // CRITICAL: Register listeners only once to prevent duplicates
    if (!listenersRegistered) {
      // Register message listener FIRST, before any async operations
      // This ensures we don't miss messages during initialization
      browserService.runtime.onMessage.addListener((message, sender, sendResponse) =>
        handleRuntimeMessage(
          message as BackgroundMessage,
          sender as unknown as chrome.runtime.MessageSender,
          sendResponse
        )
      )

      // Set up browser action click listeners
      browserService.action.onClicked.addListener(handleActionClick)

      // Listen for browser startup events
      browserService.runtime.onStartup.addListener(async () => {
        logger.info('Browser started - reinitializing proxy settings and badge')
        await initializeProxySettings()
      })

      // Listen for extension installation or update events
      browserService.runtime.onInstalled.addListener(async (details) => {
        logger.info('Extension installed/updated - initializing proxy settings and badge')
        await initializeProxySettings()

        // Set first-run flag for new installations to trigger onboarding
        if (details.reason === 'install') {
          await chrome.storage.local.set({ 'pacify.showOnboarding': true })
          logger.info('First installation detected - onboarding flag set')
        }
      })

      // Listen for alarms (for PAC script auto-refresh)
      chrome.alarms.onAlarm.addListener(handleAlarm)

      listenersRegistered = true
      logger.info('Event listeners registered')
    }

    // Initialize proxy settings
    await initializeProxySettings()

    // Update quick action
    await updateQuickAction()

    // Set up PAC script auto-refresh alarms
    await setupPacRefreshAlarms()

    // Set up subscription auto-refresh alarms
    await setupSubscriptionRefreshAlarms()

    // Mark as fully initialized
    isInitialized = true
    logger.info('Background service worker fully initialized')

    // Process any queued messages that arrived during initialization
    await processMessageQueue()
  } catch (error) {
    logger.error('Initialization error:', error)

    // Use exponential backoff with max retries
    // chrome.alarms is used instead of setTimeout because setTimeout is unreliable
    // in MV3 service workers — timers are lost when the worker is terminated.
    if (initRetryCount < INIT_MAX_RETRIES) {
      initRetryCount++
      const delay = INIT_BASE_DELAY * 2 ** (initRetryCount - 1)
      const delayInMinutes = Math.max(delay / 60000, 0.1) // chrome.alarms minimum is ~6 seconds
      logger.info(
        `Retrying initialization in ${delay}ms (attempt ${initRetryCount}/${INIT_MAX_RETRIES})`
      )
      chrome.alarms.create('init-retry', { delayInMinutes })
    } else {
      logger.error(
        `Failed to initialize after ${INIT_MAX_RETRIES} attempts. Background service may not work correctly.`
      )
      await diagnosticsService.logError(
        'INITIALIZATION_FAILED',
        `Failed to initialize background service after ${INIT_MAX_RETRIES} attempts`,
        {
          details: error instanceof Error ? error.stack : String(error),
        }
      )
    }
  }
}

/**
 * Handles incoming runtime messages with queueing support
 */
function handleRuntimeMessage(
  message: BackgroundMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean {
  // If not yet initialized, queue the message for later processing
  if (!isInitialized) {
    logger.info(
      `Message ${message.type} received during initialization - queuing for later processing`
    )
    messageQueue.push({ message, sender, sendResponse })
    return true // Keep channel open
  }

  // Process message immediately if initialized
  handleRuntimeMessageInternal(message, sender, sendResponse)
  return true // Keep the message channel open for sendResponse
}

/**
 * Internal message handler implementation
 */
async function handleRuntimeMessageInternal(
  message: BackgroundMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  // Defense-in-depth: only accept messages from our own extension
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Unauthorized sender' })
    return
  }

  // FETCH_SUBSCRIPTION needs to return data, handle it separately
  if (message.type === 'FETCH_SUBSCRIPTION') {
    try {
      const { url, format } = message as FetchSubscriptionMessage
      const parsed = await SubscriptionParser.fetchAndParse(url, format as SubscriptionFormat)
      sendResponse({ success: true, data: parsed })
    } catch (error) {
      logger.error('Error fetching subscription:', error)
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
      })
    }
    return
  }

  const handler = messageHandlers[message.type]
  if (handler) {
    try {
      await handler(message)
      sendResponse({ success: true })
    } catch (error) {
      logger.error(`Error handling message type ${message.type}:`, error)
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  } else {
    logger.warn(`Unhandled message type: ${message.type}`)
    sendResponse({ success: false, error: 'Unhandled message type' })
  }
}

/**
 * Handles chrome action click events for quick switching
 */
async function handleActionClick(): Promise<void> {
  try {
    const settings = await SettingsReader.getSettings()

    // CRITICAL: Check if Quick Switch is actually enabled first
    // If disabled, the popup should open instead (this shouldn't be called)
    if (!settings.quickSwitchEnabled) {
      // This shouldn't happen as popup should be enabled, but handle gracefully
      return
    }

    const { scripts, nextScript } = await getNextQuickScript()
    const quickScripts = scripts.filter((script) => script.quickSwitch)

    // Check if quick switch is enabled but no scripts available
    if (quickScripts.length === 0) {
      logger.warn('Quick Switch enabled but no scripts in rotation')

      // Show warning badge
      await updateBadge('!', '#FFA500') // Orange with exclamation

      // Optionally clear any active proxy
      await clearProxySettings()

      return
    }

    // Atomically update both activeScriptId and isActive flags to prevent desync
    const currentSettings = await SettingsReader.getSettings()
    currentSettings.activeScriptId = nextScript?.id ?? null
    currentSettings.proxyConfigs = currentSettings.proxyConfigs.map((s) => ({
      ...s,
      isActive: s.id === currentSettings.activeScriptId,
    }))
    await SettingsWriter.saveSettings(currentSettings)

    await handleProxyUpdate(nextScript)
  } catch (error) {
    logger.error('Action click error:', error)
    // Show error badge
    await updateBadge('ERR', '#FF0000').catch(() => {
      /* ignore badge update errors */
    })
  }
}

/**
 * Handles proxy updates based on the next script
 */
async function handleProxyUpdate(nextScript: ProxyConfig | null): Promise<void> {
  if (nextScript) {
    await messageHandlers.SET_PROXY?.({
      type: 'SET_PROXY',
      proxy: nextScript,
    })
  } else {
    await messageHandlers.CLEAR_PROXY?.()
  }
}

/**
 * Gets the next quick switch script in rotation
 */
async function getNextQuickScript(): Promise<{
  scripts: ProxyConfig[]
  nextScript: ProxyConfig | null
}> {
  const scripts = await SettingsReader.getScripts()
  const quickScripts = scripts.filter((script) => script.quickSwitch)

  const activeScriptIndex = quickScripts.findIndex((script) => script.isActive)

  return {
    scripts,
    nextScript:
      activeScriptIndex === -1
        ? quickScripts[0] || null
        : quickScripts[activeScriptIndex + 1] || null,
  }
}

async function updateQuickAction(): Promise<void> {
  const settings = await safeGetSettings()
  if (!settings) return

  const popup = settings.quickSwitchEnabled ? POPUP_DISABLED : POPUP_ENABLED
  await safeSetPopup(popup)
}

async function initializeProxySettings(): Promise<void> {
  const settings = await safeGetSettings()
  if (!settings) return

  // Check if proxy should be disabled on startup
  if (settings.disableProxyOnStartup) {
    // Clear any active proxy and reset all scripts to inactive
    await clearProxySettings()

    // Update all scripts to inactive state if any were active
    const hasActiveScript = settings.proxyConfigs.some((script) => script.isActive)
    if (hasActiveScript) {
      const updatedConfigs = settings.proxyConfigs.map((script) => ({
        ...script,
        isActive: false,
      }))

      const updatedSettings = {
        ...settings,
        proxyConfigs: updatedConfigs,
        activeScriptId: null,
      }

      await SettingsWriter.updateSettings(updatedSettings)
    }

    await updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
    return
  }

  // Find active script either by isActive flag or by matching activeScriptId
  const activeScript = settings.proxyConfigs.find(
    (script) =>
      script.isActive || (settings.activeScriptId && script.id === settings.activeScriptId)
  )

  if (activeScript) {
    await setProxySettings(activeScript)
  } else {
    await clearProxySettings()
  }

  // Ensure the badge is updated on Chrome restart by checking the current proxy settings
  const proxyConfig = await ChromeService.getProxy()
  if (proxyConfig.value.mode !== 'direct') {
    // If proxy is active but badge might not be set, update it from the active script
    if (activeScript) {
      await updateBadge(activeScript.badgeLabel || activeScript.name, activeScript.color)
    }
  } else {
    // If no proxy is active, ensure the badge shows the default state
    await updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
  }
}

async function setProxySettings(proxy: ProxyConfig): Promise<void> {
  try {
    // Get the auto-reload setting
    const settings = await safeGetSettings()
    const autoReload = settings?.autoReloadOnProxySwitch ?? true

    // Check if this is an Auto-Proxy config and generate PAC script if needed
    let proxyToApply = proxy
    if (proxy.autoProxy && settings) {
      const generatedPAC = PACScriptGenerator.generate(proxy.autoProxy, settings.proxyConfigs)
      // Create a copy with the generated PAC script
      proxyToApply = {
        ...proxy,
        pacScript: { data: generatedPAC },
        mode: 'pac_script',
      }
      logger.info('Generated PAC script for Auto-Proxy config:', proxy.name)
    }

    await ChromeService.setProxy(proxyToApply, autoReload)
    const { name, color, badgeLabel } = proxy
    await updateBadge(badgeLabel || name, color)

    // Log successful proxy activation
    await diagnosticsService.logInfo(
      'PROXY_ACTIVATED',
      `Proxy "${proxy.name}" activated successfully`,
      {
        proxyName: proxy.name,
        proxyId: proxy.id,
        details: `Mode: ${proxy.mode}${proxy.autoProxy ? ' (Auto-Proxy)' : ''}`,
      }
    )
  } catch (error) {
    logger.error('Error setting proxy:', error)

    // Parse error for user-friendly message
    const { fallback } = parseProxyError(error)

    await diagnosticsService.logError('PROXY_SET_FAILED', fallback, {
      proxyName: proxy.name,
      proxyId: proxy.id,
      details: error instanceof Error ? error.stack : String(error),
    })

    // Re-throw to propagate to caller
    throw error
  }
}

async function clearProxySettings(): Promise<void> {
  try {
    // Get the auto-reload setting
    const settings = await safeGetSettings()
    const autoReload = settings?.autoReloadOnProxySwitch ?? true

    await ChromeService.clearProxy(autoReload)
    await updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)

    // Log successful proxy deactivation
    await diagnosticsService.logInfo(
      'PROXY_DEACTIVATED',
      'Proxy deactivated - using direct connection',
      {}
    )
  } catch (error) {
    logger.error('Error clearing proxy:', error)

    // Parse error for user-friendly message
    const { fallback } = parseProxyError(error)

    await diagnosticsService.logError('PROXY_CLEAR_FAILED', fallback, {
      details: error instanceof Error ? error.stack : String(error),
    })
  }
}

async function updateBadge(text = 'N/A', color = DEFAULT_BADGE_COLOR): Promise<void> {
  try {
    await browserService.action.setBadgeBackgroundColor({ color })
    await browserService.action.setBadgeText({
      text: text.slice(0, 4).toUpperCase(),
    })
  } catch (error) {
    logger.error('Error updating badge:', error)
  }
}

async function safeGetSettings() {
  try {
    return await SettingsReader.getSettings()
  } catch (error) {
    logger.error('Error fetching settings:', error)
    return null
  }
}

async function safeSetPopup(popup: string): Promise<void> {
  try {
    await browserService.action.setPopup({ popup })
  } catch (error) {
    logger.error('Error setting popup:', error)
  }
}

/**
 * Sets up alarms for auto-refreshing PAC scripts
 */
async function setupPacRefreshAlarms(): Promise<void> {
  try {
    const settings = await safeGetSettings()
    if (!settings) return

    // Clear all existing PAC refresh alarms
    const alarms = await chrome.alarms.getAll()
    for (const alarm of alarms) {
      if (alarm.name.startsWith('pac-refresh-')) {
        await chrome.alarms.clear(alarm.name)
      }
    }

    // Set up new alarms for each PAC script with auto-refresh enabled
    for (const config of settings.proxyConfigs) {
      if (
        config.mode === 'pac_script' &&
        config.pacScript?.url &&
        config.pacScript.updateInterval &&
        config.pacScript.updateInterval > 0
      ) {
        const alarmName = `pac-refresh-${config.id}`
        await chrome.alarms.create(alarmName, {
          periodInMinutes: config.pacScript.updateInterval,
        })
      }
    }
  } catch (error) {
    logger.error('Error setting up PAC refresh alarms:', error)
  }
}

/**
 * Handles alarm events for PAC script auto-refresh
 */
async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === 'init-retry') {
    await initialize()
    return
  }

  if (alarm.name.startsWith('sub-refresh-')) {
    await handleSubscriptionAlarm(alarm)
    return
  }

  if (!alarm.name.startsWith('pac-refresh-')) return

  const configId = alarm.name.replace('pac-refresh-', '')

  try {
    const settings = await safeGetSettings()
    if (!settings) return

    const config = settings.proxyConfigs.find((c) => c.id === configId)
    if (!config || !config.pacScript?.url) {
      logger.warn(`Config ${configId} not found or has no URL, clearing alarm`)
      await chrome.alarms.clear(alarm.name)
      return
    }

    // Check if enough time has passed since last fetch
    const now = Date.now()
    const lastFetched = config.pacScript.lastFetched || 0
    const intervalMs = (config.pacScript.updateInterval || 0) * 60 * 1000
    const timeSinceLastFetch = now - lastFetched

    if (timeSinceLastFetch < intervalMs * 0.9) {
      // Less than 90% of interval has passed, skip this refresh
      return
    }

    // Fetch the PAC script (15s timeout to prevent service worker hang)
    const response = await fetch(config.pacScript.url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'PACify/1.31' },
    })

    if (!response.ok) {
      logger.error(`Failed to fetch PAC script: HTTP ${response.status}`)
      await diagnosticsService.logError(
        'PAC_SCRIPT_FETCH_FAILED',
        `Failed to fetch PAC script: HTTP ${response.status}`,
        {
          proxyName: config.name,
          proxyId: config.id,
          url: config.pacScript.url,
          details: `HTTP ${response.status} ${response.statusText}`,
        }
      )
      return
    }

    const data = await response.text()

    // Update the config with new data and timestamp
    const updatedConfig: ProxyConfig = {
      ...config,
      pacScript: {
        ...config.pacScript,
        data,
        lastFetched: now,
      },
    }

    // Update settings
    await SettingsWriter.updatePACScript(updatedConfig)

    // If this is the active script, re-apply it
    if (config.isActive) {
      await setProxySettings(updatedConfig)
    }

    // Log successful PAC script refresh
    await diagnosticsService.logInfo(
      'PAC_SCRIPT_REFRESHED',
      `PAC script "${config.name}" refreshed successfully`,
      {
        proxyName: config.name,
        proxyId: config.id,
        url: config.pacScript.url,
      }
    )
  } catch (error) {
    logger.error(`Error refreshing PAC script for config ${configId}:`, error)

    // Get config name for diagnostic log
    const settings = await safeGetSettings()
    const configForLog = settings?.proxyConfigs.find((c) => c.id === configId)
    await diagnosticsService.logError(
      'PAC_SCRIPT_REFRESH_FAILED',
      error instanceof Error ? error.message : 'Failed to refresh PAC script',
      {
        proxyName: configForLog?.name,
        proxyId: configId,
        url: configForLog?.pacScript?.url,
        details: error instanceof Error ? error.stack : String(error),
      }
    )
  }
}

/**
 * Sets up alarms for auto-refreshing subscription rule lists
 */
async function setupSubscriptionRefreshAlarms(): Promise<void> {
  try {
    const settings = await safeGetSettings()
    if (!settings) return

    // Clear all existing subscription refresh alarms
    const alarms = await chrome.alarms.getAll()
    for (const alarm of alarms) {
      if (alarm.name.startsWith('sub-refresh-')) {
        await chrome.alarms.clear(alarm.name)
      }
    }

    // Set up alarms for each subscription with auto-refresh enabled
    for (const config of settings.proxyConfigs) {
      if (!config.autoProxy?.subscriptions) continue

      for (const sub of config.autoProxy.subscriptions) {
        if (sub.enabled && sub.updateInterval > 0) {
          const alarmName = `sub-refresh-${config.id}__${sub.id}`
          await chrome.alarms.create(alarmName, {
            periodInMinutes: sub.updateInterval,
          })
        }
      }
    }
  } catch (error) {
    logger.error('Error setting up subscription refresh alarms:', error)
  }
}

/**
 * Handles alarm events for subscription auto-refresh
 */
async function handleSubscriptionAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  // Alarm name format: sub-refresh-{proxyId}__{subscriptionId}
  const payload = alarm.name.replace('sub-refresh-', '')
  const separatorIndex = payload.indexOf('__')
  if (separatorIndex < 0) return

  const proxyId = payload.slice(0, separatorIndex)
  const subscriptionId = payload.slice(separatorIndex + 2)

  await refreshSubscription(proxyId, subscriptionId)
}

/**
 * Refresh a single subscription by fetching its URL and updating cached rules
 */
async function refreshSubscription(proxyId: string, subscriptionId: string): Promise<void> {
  try {
    const settings = await safeGetSettings()
    if (!settings) return

    const config = settings.proxyConfigs.find((c) => c.id === proxyId)
    if (!config?.autoProxy?.subscriptions) {
      logger.warn(`Config ${proxyId} not found or has no subscriptions`)
      return
    }

    const sub = config.autoProxy.subscriptions.find((s) => s.id === subscriptionId)
    if (!sub) {
      logger.warn(`Subscription ${subscriptionId} not found in config ${proxyId}`)
      return
    }

    // Check if enough time has passed since last update
    if (sub.lastUpdated && sub.updateInterval > 0) {
      const intervalMs = sub.updateInterval * 60 * 1000
      if (Date.now() - sub.lastUpdated < intervalMs * 0.9) {
        return
      }
    }

    logger.info(`Refreshing subscription "${sub.name}" from ${sub.url}`)

    const parsed = await SubscriptionParser.fetchAndParse(sub.url, sub.format)

    // Update the subscription with new cached rules
    const updatedSub: AutoProxySubscription = {
      ...sub,
      cachedRules: parsed.domains,
      ruleCount: parsed.domains.length,
      lastUpdated: Date.now(),
      lastError: undefined,
    }

    const updatedSubscriptions = config.autoProxy.subscriptions.map((s) =>
      s.id === subscriptionId ? updatedSub : s
    )

    const updatedConfig: ProxyConfig = {
      ...config,
      autoProxy: {
        ...config.autoProxy,
        subscriptions: updatedSubscriptions,
      },
    }

    await SettingsWriter.updatePACScript(updatedConfig)

    // If this is the active proxy, regenerate and re-apply PAC script
    // Use the updatedConfig directly instead of re-reading from storage
    if (config.isActive && updatedConfig.autoProxy) {
      await setProxySettings(updatedConfig)
    }

    await diagnosticsService.logInfo(
      'SUBSCRIPTION_REFRESHED',
      `Subscription "${sub.name}" refreshed: ${parsed.domains.length} rules`,
      {
        proxyName: config.name,
        proxyId,
        details: `subscriptionId: ${subscriptionId}`,
        url: sub.url,
      }
    )
  } catch (error) {
    logger.error(`Error refreshing subscription ${subscriptionId}:`, error)

    // Update subscription with error
    try {
      const settings = await safeGetSettings()
      if (!settings) return

      const config = settings.proxyConfigs.find((c) => c.id === proxyId)
      if (!config?.autoProxy?.subscriptions) return

      const updatedSubscriptions = config.autoProxy.subscriptions.map((s) =>
        s.id === subscriptionId
          ? { ...s, lastError: error instanceof Error ? error.message : 'Failed to refresh' }
          : s
      )

      const updatedConfig: ProxyConfig = {
        ...config,
        autoProxy: {
          ...config.autoProxy,
          subscriptions: updatedSubscriptions,
        },
      }

      await SettingsWriter.updatePACScript(updatedConfig)
    } catch {
      // Ignore errors when updating error state
    }

    await diagnosticsService.logError(
      'SUBSCRIPTION_REFRESH_FAILED',
      error instanceof Error ? error.message : 'Failed to refresh subscription',
      { proxyId, details: `subscriptionId: ${subscriptionId}` }
    )
  }
}

// Initialize the background service
initialize()
