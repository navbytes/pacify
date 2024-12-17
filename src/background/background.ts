import { SettingsReader, SettingsWriter } from '@/services'
import {
  type BackgroundMessage,
  type BackgroundMessageType,
  type SetProxyMessage,
} from '@/interfaces'
import {
  DEFAULT_BADGE_TEXT,
  DEFAULT_BADGE_COLOR,
  POPUP_DISABLED,
  POPUP_ENABLED,
} from '@/constants/app'
import { ChromeService } from '@/services/ChromeService'

class BackgroundManager {
  private static instance: BackgroundManager

  private constructor() {
    this.initialize()
  }

  // Singleton pattern
  public static getInstance(): BackgroundManager {
    if (!BackgroundManager.instance) {
      BackgroundManager.instance = new BackgroundManager()
    }
    return BackgroundManager.instance
  }

  // Message handler map for better maintainability
  private readonly messageHandlers: Record<
    BackgroundMessageType,
    (message?: BackgroundMessage) => Promise<void>
  > = {
    QUICK_SWITCH: async () => await this.updateQuickAction(),
    SET_PROXY: async (message?: BackgroundMessage) => {
      if (!message) return
      const { script, name, color } = message as SetProxyMessage
      await this.setProxySettings(script, name, color)
    },
    CLEAR_PROXY: async () => {
      await this.clearProxySettings()
    },
    SCRIPT_UPDATE: async () => {
      // script updated
    },
  }

  private async initialize() {
    try {
      await Promise.all([
        this.setupActionListeners(),
        this.setupMessageListeners(),
        this.initializeProxySettings(),
        this.updateQuickAction(),
      ])
    } catch (error) {
      console.error('Initialization failed:', error)
    }
  }

  private setupActionListeners(): void {
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this))
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this))
  }

  private async handleRuntimeMessage(
    message: BackgroundMessage
  ): Promise<boolean> {
    const handler = this.messageHandlers[message.type]
    if (handler) {
      await handler(message)
    } else {
      console.warn('Unhandled message type:', message.type)
    }
    return true
  }

  private async handleActionClick(): Promise<void> {
    const { scripts, nextScript } = await this.getNextQuickScript()

    const updatedScripts = scripts.map((script) => ({
      ...script,
      isActive: nextScript && script.id === nextScript.id,
    }))
    await SettingsWriter.updateAllScripts(updatedScripts)

    if (nextScript) {
      await this.messageHandlers.SET_PROXY({
        type: 'SET_PROXY',
        name: nextScript.name,
        script: nextScript.script,
        color: nextScript.color,
      })
    } else {
      await this.messageHandlers.CLEAR_PROXY()
    }
  }

  /**
   * @description Get the next quick switch script
   * - after the current index of active script
   * - if no active script, then return the script as null
   */
  private async getNextQuickScript() {
    const scripts = await SettingsReader.getScripts()
    const quickScripts = scripts.filter((script) => script.quickSwitch)

    const activeScriptIndex = quickScripts.findIndex(
      (script) => script.isActive
    )

    if (activeScriptIndex === -1) {
      return { scripts, nextScript: quickScripts[0] }
    }
    return {
      scripts,
      nextScript: quickScripts[activeScriptIndex + 1] ?? null,
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

    const activeScript = settings.pacScripts.find((script) => script.isActive)
    await (activeScript
      ? this.setProxySettings(
          activeScript.script,
          activeScript.name,
          activeScript.color
        )
      : this.clearProxySettings())
  }

  private async setProxySettings(
    pacScript: string,
    name: string,
    color: string
  ): Promise<void> {
    try {
      await ChromeService.setProxy(pacScript)
      await this.updateBadge(name, color)
    } catch (error) {
      console.error('Error setting proxy:', error)
    }
  }

  private async clearProxySettings(): Promise<void> {
    try {
      await ChromeService.clearProxy()
      await this.updateBadge(DEFAULT_BADGE_TEXT, DEFAULT_BADGE_COLOR)
    } catch (error) {
      console.error('Error clearing proxy:', error)
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
      console.error('Error updating badge:', error)
    }
  }

  private async safeGetSettings() {
    try {
      return await SettingsReader.getSettings()
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      return null
    }
  }

  private async safeSetPopup(popup: string): Promise<void> {
    try {
      await chrome.action.setPopup({ popup })
    } catch (error) {
      console.error('Failed to set popup:', error)
    }
  }
}

// Initialize singleton instance
BackgroundManager.getInstance()
