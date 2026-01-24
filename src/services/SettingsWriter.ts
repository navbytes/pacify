import type { AppSettings, ProxyConfig } from '@/interfaces'
import { SettingsReader } from './SettingsReader'
import { StorageService } from './StorageService'

// Maximum allowed file size for settings restore (1MB)
const MAX_SETTINGS_FILE_SIZE = 1024 * 1024

// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class SettingsWriter {
  static async saveSettings(settings: AppSettings): Promise<void> {
    await StorageService.saveSettings(settings)
    // No need to invalidate cache - StorageService handles this internally
  }

  static async updateSettings(partialSettings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await SettingsReader.getSettings()
    const updatedSettings = { ...currentSettings, ...partialSettings }
    await SettingsWriter.saveSettings(updatedSettings)
  }

  static async addPACScript(script: Omit<ProxyConfig, 'id'>): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const newScript: ProxyConfig = { ...script, id: crypto.randomUUID() }
    settings.proxyConfigs.push(newScript)
    await SettingsWriter.saveSettings(settings)
  }

  static async updatePACScript(script: ProxyConfig): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const index = settings.proxyConfigs.findIndex((s) => s.id === script.id)
    if (index !== -1) {
      settings.proxyConfigs[index] = script
      await SettingsWriter.saveSettings(settings)
    }
  }

  static async deletePACScript(id: string): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.proxyConfigs = settings.proxyConfigs.filter((s) => s.id !== id)
    if (settings.activeScriptId === id) {
      settings.activeScriptId = null
    }
    await SettingsWriter.saveSettings(settings)
  }

  static async toggleQuickSwitch(enabled: boolean): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.quickSwitchEnabled = enabled
    await SettingsWriter.saveSettings(settings)
  }
  public static async updateAllScripts(scripts: ProxyConfig[]): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.proxyConfigs = scripts
    await SettingsWriter.saveSettings(settings)
  }
  public static async updateScriptQuickSwitch(id: string, enabled: boolean): Promise<void> {
    const script = await SettingsReader.getPacScriptById(id)
    if (script) {
      await SettingsWriter.updatePACScript({ ...script, quickSwitch: enabled })
    }
  }

  static async backupSettings(): Promise<void> {
    let url: string | null = null
    let link: HTMLAnchorElement | null = null

    try {
      const settings = await SettingsReader.getSettings()
      const dataStr = JSON.stringify(settings, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      url = URL.createObjectURL(blob)

      // Create a temporary link for downloading
      link = document.createElement('a')
      link.href = url
      link.download = 'pacify-settings-backup.json'
      document.body.appendChild(link)
      link.click()
    } finally {
      // Clean up DOM and revoke URL even if an error occurs
      if (link && document.body.contains(link)) {
        document.body.removeChild(link)
      }
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }

  static async restoreSettings(file: File): Promise<void> {
    // Validate file size to prevent DoS
    if (file.size > MAX_SETTINGS_FILE_SIZE) {
      throw new Error(
        `Settings file too large. Maximum size is ${MAX_SETTINGS_FILE_SIZE / 1024}KB.`
      )
    }

    // Validate file type
    if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) {
      throw new Error('Invalid file type. Please select a JSON file.')
    }

    try {
      const fileContent = await file.text()

      // Parse JSON with error handling
      let settings: AppSettings
      try {
        settings = JSON.parse(fileContent)
      } catch {
        throw new Error('Invalid JSON format.')
      }

      // Comprehensive validation of settings structure
      if (!settings || typeof settings !== 'object') {
        throw new Error('Settings must be a valid object.')
      }

      if (!Array.isArray(settings.proxyConfigs)) {
        throw new Error('Invalid settings: proxyConfigs must be an array.')
      }

      if (typeof settings.quickSwitchEnabled !== 'boolean') {
        throw new Error('Invalid settings: quickSwitchEnabled must be a boolean.')
      }

      if (
        settings.disableProxyOnStartup !== undefined &&
        typeof settings.disableProxyOnStartup !== 'boolean'
      ) {
        throw new Error('Invalid settings: disableProxyOnStartup must be a boolean.')
      }

      if (
        settings.autoReloadOnProxySwitch !== undefined &&
        typeof settings.autoReloadOnProxySwitch !== 'boolean'
      ) {
        throw new Error('Invalid settings: autoReloadOnProxySwitch must be a boolean.')
      }

      if (
        settings.activeScriptId !== undefined &&
        settings.activeScriptId !== null &&
        typeof settings.activeScriptId !== 'string'
      ) {
        throw new Error('Invalid settings: activeScriptId must be a string or null.')
      }

      // Validate each proxy config
      for (const config of settings.proxyConfigs) {
        if (!config || typeof config !== 'object') {
          throw new Error('Invalid proxy configuration.')
        }
        if (typeof config.name !== 'string' || !config.name.trim()) {
          throw new Error('Each proxy must have a valid name.')
        }
        if (typeof config.mode !== 'string') {
          throw new Error('Each proxy must have a valid mode.')
        }
      }

      // Ensure new fields have default values if missing
      settings.disableProxyOnStartup = settings.disableProxyOnStartup ?? false
      settings.autoReloadOnProxySwitch = settings.autoReloadOnProxySwitch ?? false

      // Update the settings in storage
      await SettingsWriter.saveSettings(settings)
    } catch (error) {
      // Re-throw with original message if it's already an Error with a message
      if (error instanceof Error && error.message) {
        throw error
      }
      throw new Error('Failed to restore settings. Please check the file format.')
    }
  }
}
