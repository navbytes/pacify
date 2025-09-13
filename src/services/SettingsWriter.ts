import type { AppSettings, ProxyConfig } from '@/interfaces'
import { SettingsReader } from './SettingsReader'
import { ChromeService } from '@/services/chrome'

export class SettingsWriter {
  static async saveSettings(settings: AppSettings): Promise<void> {
    await ChromeService.setSyncSettings(settings)
    SettingsReader.invalidateCache()
  }

  static async updateSettings(
    partialSettings: Partial<AppSettings>
  ): Promise<void> {
    const currentSettings = await SettingsReader.getSettings()
    const updatedSettings = { ...currentSettings, ...partialSettings }
    await this.saveSettings(updatedSettings)
  }

  static async addPACScript(script: Omit<ProxyConfig, 'id'>): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const newScript: ProxyConfig = { ...script, id: crypto.randomUUID() }
    settings.proxyConfigs.push(newScript)
    await this.saveSettings(settings)
  }

  static async updatePACScript(script: ProxyConfig): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const index = settings.proxyConfigs.findIndex((s) => s.id === script.id)
    if (index !== -1) {
      settings.proxyConfigs[index] = script
      await this.saveSettings(settings)
    }
  }

  static async deletePACScript(id: string): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.proxyConfigs = settings.proxyConfigs.filter((s) => s.id !== id)
    if (settings.activeScriptId === id) {
      settings.activeScriptId = null
    }
    await this.saveSettings(settings)
  }

  static async toggleQuickSwitch(enabled: boolean): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.quickSwitchEnabled = enabled
    await this.saveSettings(settings)
  }
  public static async updateAllScripts(scripts: ProxyConfig[]): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.proxyConfigs = scripts
    await this.saveSettings(settings)
  }
  public static async updateScriptQuickSwitch(
    id: string,
    enabled: boolean
  ): Promise<void> {
    const script = await SettingsReader.getPacScriptById(id)
    if (script) {
      await this.updatePACScript({ ...script, quickSwitch: enabled })
    }
  }

  static async backupSettings(): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const dataStr = JSON.stringify(settings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create a temporary link for downloading
    const link = document.createElement('a')
    link.href = url
    link.download = 'pacify-settings-backup.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  static async restoreSettings(file: File): Promise<void> {
    try {
      const fileContent = await file.text()
      const settings: AppSettings = JSON.parse(fileContent)

      // Validate the settings structure
      if (
        !settings.proxyConfigs ||
        typeof settings.quickSwitchEnabled !== 'boolean' ||
        (settings.disableProxyOnStartup !== undefined &&
          typeof settings.disableProxyOnStartup !== 'boolean')
      ) {
        throw new Error('Invalid settings file.')
      }

      // Ensure new fields have default values if missing
      settings.disableProxyOnStartup = settings.disableProxyOnStartup ?? false

      // Update the settings in storage
      await this.saveSettings(settings)
    } catch (error) {
      throw new Error(
        'Failed to restore settings. Please check the file format.'
      )
    }
  }
}
