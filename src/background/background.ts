import { SettingsReader, SettingsWriter } from '@/services'
import {
  ERROR_TYPES,
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
import { NotifyService } from '@/services/NotifyService'

/**
 * BackgroundManager class handles all background operations for the Chrome extension
 * Implements Singleton pattern to ensure only one instance is running
 */
class BackgroundManager {
  private static instance: BackgroundManager

  private constructor() {
    this.initialize()
  }

  /**
   * Returns singleton instance of BackgroundManager
   */
  public static getInstance(): BackgroundManager {
    if (!BackgroundManager.instance) {
      BackgroundManager.instance = new BackgroundManager()
    }
    return BackgroundManager.instance
  }

  /**
   * Message handler map for processing different types of background messages
   */
  private readonly messageHandlers: Record<
    BackgroundMessageType,
    (message?: BackgroundMessage) => Promise<void>
  > = {
    QUICK_SWITCH: async () => await this.updateQuickAction(),
    SET_PROXY: async (message?: BackgroundMessage) => {
      if (!message) return
      const { type, proxy } = message as SetProxyMessage
      await this.setProxySettings(proxy)
    },
    CLEAR_PROXY: async () => {
      await this.clearProxySettings()
    },
    SCRIPT_UPDATE: async () => {
      // script updated
    },
  }

  /**
   * Initializes the background manager by setting up listeners and proxy settings
   */
  private async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.setupActionListeners(),
        this.setupMessageListeners(),
        this.initializeProxySettings(),
        this.updateQuickAction(),
      ])
    } catch (error) {
      NotifyService.error(ERROR_TYPES.INITIALIZATION, error)
      // TODO: implement retry logic here
    }
  }

  /**
   * Sets up chrome action click listeners
   */
  private setupActionListeners(): void {
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this))
  }

  /**
   * Sets up runtime message listeners
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this))
  }

  /**
   * Handles incoming runtime messages
   */
  private async handleRuntimeMessage(
    message: BackgroundMessage
  ): Promise<boolean> {
    const handler = this.messageHandlers[message.type]
    if (handler) {
      await handler(message)
    } else {
      console.warn(`Unhandled message type: ${message.type}`)
    }
    return true
  }

  /**
   * Handles chrome action click events for quick switching
   */
  private async handleActionClick(): Promise<void> {
    try {
      const { scripts, nextScript } = await this.getNextQuickScript()

      const updatedScripts = this.updateScriptsActiveStatus(scripts, nextScript)
      await SettingsWriter.updateAllScripts(updatedScripts)

      await this.handleProxyUpdate(nextScript)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.ACTION_CLICK, error)
    }
  }

  /**
   * Updates scripts' active status based on the next script
   */
  private updateScriptsActiveStatus(
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
  private async handleProxyUpdate(
    nextScript: ProxyConfig | null
  ): Promise<void> {
    if (nextScript) {
      await this.messageHandlers.SET_PROXY({
        type: 'SET_PROXY',
        proxy: nextScript,
      })
    } else {
      await this.messageHandlers.CLEAR_PROXY()
    }
  }

  /**
   * Gets the next quick switch script in rotation
   */
  private async getNextQuickScript(): Promise<{
    scripts: ProxyConfig[]
    nextScript: ProxyConfig | null
  }> {
    const scripts = await SettingsReader.getScripts()
    const quickScripts = scripts.filter((script) => script.quickSwitch)

    const activeScriptIndex = quickScripts.findIndex(
      (script) => script.isActive
    )

    return {
      scripts,
      nextScript:
        activeScriptIndex === -1
          ? quickScripts[0] || null
          : quickScripts[activeScriptIndex + 1] || null,
    }
  }

  private async updateQuickAction(): Promise<void> {
    const settings = await this.safeGetSettings()
    if (!settings) return

    const popup = settings.quickSwitchEnabled ? POPUP_DISABLED : POPUP_ENABLED
    await this.safeSetPopup(popup)
  }

  private async initializeProxySettings(): Promise<void> {
    const settings = await this.safeGetSettings()
    if (!settings) return

    const activeScript = settings.proxyConfigs.find((script) => script.isActive)
    await (activeScript
      ? this.setProxySettings(activeScript)
      : this.clearProxySettings())
  }

  private async setProxySettings(proxy: ProxyConfig): Promise<void> {
    try {
      await ChromeService.setProxy(proxy)
      const { name, color } = proxy
      await this.updateBadge(name, color)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.SET_PROXY, error)
    }
  }

  private async clearProxySettings(): Promise<void> {
    try {
      await ChromeService.clearProxy()
      await this.updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.CLEAR_PROXY, error)
    }
  }

  private async updateBadge(
    text = 'N/A',
    color = DEFAULT_BADGE_COLOR
  ): Promise<void> {
    try {
      await chrome.action.setBadgeBackgroundColor({ color })
      await chrome.action.setBadgeText({ text: text.slice(0, 3).toUpperCase() })
    } catch (error) {
      NotifyService.error(ERROR_TYPES.UPDATE_BADGE, error)
    }
  }

  private async safeGetSettings() {
    try {
      return await SettingsReader.getSettings()
    } catch (error) {
      NotifyService.error(ERROR_TYPES.FETCH_SETTINGS, error)
      return null
    }
  }

  private async safeSetPopup(popup: string): Promise<void> {
    try {
      await chrome.action.setPopup({ popup })
    } catch (error) {
      NotifyService.error(ERROR_TYPES.SET_POPUP, error)
    }
  }
}

// Initialize singleton instance
BackgroundManager.getInstance()
