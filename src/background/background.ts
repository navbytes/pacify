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

/**
 * Message handler map for processing different types of background messages
 */
const messageHandlers: Record<
  BackgroundMessageType,
  (message?: BackgroundMessage) => Promise<void>
> = {
  QUICK_SWITCH: async () => await updateQuickAction(),
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
 * Initializes the background worker by setting up listeners and proxy settings
 */
async function initialize(): Promise<void> {
  try {
    // Set up chrome action click listeners
    chrome.action.onClicked.addListener(handleActionClick)

    // Set up runtime message listeners
    chrome.runtime.onMessage.addListener(handleRuntimeMessage)

    // Initialize proxy settings
    await initializeProxySettings()

    // Update quick action
    await updateQuickAction()
  } catch (error) {
    console.error('Initialization error:', error)
    // Use a safer error handling approach for service workers
    setTimeout(initialize, 5000)
  }
}

/**
 * Handles incoming runtime messages
 */
async function handleRuntimeMessage(
  message: BackgroundMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<boolean> {
  const handler = messageHandlers[message.type]
  if (handler) {
    handler(message)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error(`Error handling message type ${message.type}:`, error)
        sendResponse({ success: false, error: error.message })
      })
  } else {
    console.warn(`Unhandled message type: ${message.type}`)
    sendResponse({ success: false, error: 'Unhandled message type' })
  }
  return true // Keep the message channel open for sendResponse
}

/**
 * Handles chrome action click events for quick switching
 */
async function handleActionClick(): Promise<void> {
  try {
    const { scripts, nextScript } = await getNextQuickScript()

    const updatedScripts = updateScriptsActiveStatus(scripts, nextScript)
    await SettingsWriter.updateAllScripts(updatedScripts)

    await handleProxyUpdate(nextScript)
  } catch (error) {
    console.error('Action click error:', error)
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
async function handleProxyUpdate(
  nextScript: ProxyConfig | null
): Promise<void> {
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

  const activeScript = settings.proxyConfigs.find((script) => script.isActive)
  await (activeScript ? setProxySettings(activeScript) : clearProxySettings())
}

async function setProxySettings(proxy: ProxyConfig): Promise<void> {
  try {
    await ChromeService.setProxy(proxy)
    const { name, color } = proxy
    await updateBadge(name, color)
  } catch (error) {
    console.error('Error setting proxy:', error)
  }
}

async function clearProxySettings(): Promise<void> {
  try {
    await ChromeService.clearProxy()
    await updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
  } catch (error) {
    console.error('Error clearing proxy:', error)
  }
}

async function updateBadge(
  text = 'N/A',
  color = DEFAULT_BADGE_COLOR
): Promise<void> {
  try {
    await chrome.action.setBadgeBackgroundColor({ color })
    await chrome.action.setBadgeText({ text: text.slice(0, 3).toUpperCase() })
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
    await chrome.action.setPopup({ popup })
  } catch (error) {
    console.error('Error setting popup:', error)
  }
}

// Initialize the background service
initialize()
