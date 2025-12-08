import { SettingsReader, SettingsWriter } from '@/services'
import {
  type BackgroundMessage,
  type BackgroundMessageType,
  type ProxyConfig,
  type SetProxyMessage,
} from '@/interfaces'
import {
  DEFAULT_BADGE_TEXT,
  DEFAULT_BADGE_COLOR,
  POPUP_DISABLED,
  POPUP_ENABLED,
} from '@/constants/app'
import { ChromeService } from '@/services/chrome'
import { browserService } from '@/services/chrome/BrowserService'
import { ProxyStatsService } from '@/services/ProxyStatsService'

/**
 * Flag to track if the background worker is fully initialized
 */
let isInitialized = false

/**
 * Flag to track if event listeners have been registered
 */
let listenersRegistered = false

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
const messageHandlers: Record<
  BackgroundMessageType,
  (message?: BackgroundMessage) => Promise<void>
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
    // script updated
  },
}

/**
 * Processes queued messages after initialization completes
 */
async function processMessageQueue(): Promise<void> {
  console.log(`Processing ${messageQueue.length} queued message(s) after initialization`)

  while (messageQueue.length > 0) {
    const queuedMessage = messageQueue.shift()
    if (queuedMessage) {
      const { message, sender, sendResponse } = queuedMessage
      try {
        await handleRuntimeMessageInternal(message, sender, sendResponse)
      } catch (error) {
        console.error('Error processing queued message:', error)
        // Send error response but continue processing remaining messages
        try {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        } catch (sendError) {
          console.error('Failed to send error response:', sendError)
        }
      }
    }
  }

  console.log('Message queue processing completed')
}

/**
 * Initializes the background worker by setting up listeners and proxy settings
 */
async function initialize(): Promise<void> {
  try {
    console.log('Background service worker initializing...')

    // CRITICAL: Register listeners only once to prevent duplicates
    if (!listenersRegistered) {
      // Register message listener FIRST, before any async operations
      // This ensures we don't miss messages during initialization
      browserService.runtime.onMessage.addListener(handleRuntimeMessage)

      // Set up browser action click listeners
      browserService.action.onClicked.addListener(handleActionClick)

      // Listen for browser startup events
      browserService.runtime.onStartup.addListener(async () => {
        console.log('Browser started - reinitializing proxy settings and badge')
        await initializeProxySettings()
      })

      // Listen for extension installation or update events
      browserService.runtime.onInstalled.addListener(async () => {
        console.log('Extension installed/updated - initializing proxy settings and badge')
        await initializeProxySettings()
      })

      listenersRegistered = true
      console.log('Event listeners registered')
    }

    // Initialize proxy settings
    await initializeProxySettings()

    // Phase 2: Initialize stats tracking
    await ProxyStatsService.initialize()

    // Update quick action
    await updateQuickAction()

    // Mark as fully initialized
    isInitialized = true
    console.log('Background service worker fully initialized')

    // Process any queued messages that arrived during initialization
    await processMessageQueue()
  } catch (error) {
    console.error('Initialization error:', error)
    // Use a safer error handling approach for service workers
    setTimeout(initialize, 5000)
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
    console.log(
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
  console.log(`Processing message: ${message.type}`)

  const handler = messageHandlers[message.type]
  if (handler) {
    try {
      await handler(message)
      sendResponse({ success: true })
    } catch (error) {
      console.error(`Error handling message type ${message.type}:`, error)
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  } else {
    console.warn(`Unhandled message type: ${message.type}`)
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
      console.log('Quick Switch is disabled - popup should open instead of switching')
      // This shouldn't happen as popup should be enabled, but handle gracefully
      return
    }

    const { scripts, nextScript } = await getNextQuickScript()
    const quickScripts = scripts.filter((script) => script.quickSwitch)

    // Check if quick switch is enabled but no scripts available
    if (quickScripts.length === 0) {
      console.warn('Quick Switch enabled but no scripts in rotation')

      // Show warning badge
      await updateBadge('!', '#FFA500') // Orange with exclamation

      // Optionally clear any active proxy
      await clearProxySettings()

      return
    }

    const updatedScripts = updateScriptsActiveStatus(scripts, nextScript)
    await SettingsWriter.updateAllScripts(updatedScripts)

    await handleProxyUpdate(nextScript)
  } catch (error) {
    console.error('Action click error:', error)
    // Show error badge
    await updateBadge('ERR', '#FF0000').catch(() => {
      /* ignore badge update errors */
    })
  }
}

/**
 * Updates scripts' active status based on the next script
 */
function updateScriptsActiveStatus(
  scripts: ProxyConfig[],
  nextScript: ProxyConfig | null
): ProxyConfig[] {
  return scripts.map((script) => ({
    ...script,
    isActive: nextScript?.id === script.id,
  }))
}

/**
 * Handles proxy updates based on the next script
 */
async function handleProxyUpdate(nextScript: ProxyConfig | null): Promise<void> {
  if (nextScript) {
    await messageHandlers.SET_PROXY({
      type: 'SET_PROXY',
      proxy: nextScript,
    })
  } else {
    await messageHandlers.CLEAR_PROXY()
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
      await updateBadge(activeScript.name, activeScript.color)
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

    await ChromeService.setProxy(proxy, autoReload)
    const { name, color } = proxy
    await updateBadge(name, color)
  } catch (error) {
    console.error('Error setting proxy:', error)
  }
}

async function clearProxySettings(): Promise<void> {
  try {
    // Get the auto-reload setting
    const settings = await safeGetSettings()
    const autoReload = settings?.autoReloadOnProxySwitch ?? true

    await ChromeService.clearProxy(autoReload)
    await updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
  } catch (error) {
    console.error('Error clearing proxy:', error)
  }
}

async function updateBadge(text = 'N/A', color = DEFAULT_BADGE_COLOR): Promise<void> {
  try {
    await browserService.action.setBadgeBackgroundColor({ color })
    await browserService.action.setBadgeText({
      text: text.slice(0, 3).toUpperCase(),
    })
  } catch (error) {
    console.error('Error updating badge:', error)
  }
}

async function safeGetSettings() {
  try {
    return await SettingsReader.getSettings()
  } catch (error) {
    console.error('Error fetching settings:', error)
    return null
  }
}

async function safeSetPopup(popup: string): Promise<void> {
  try {
    await browserService.action.setPopup({ popup })
  } catch (error) {
    console.error('Error setting popup:', error)
  }
}

// Initialize the background service
initialize()
