import type { AppSettings, PACScript } from '@/interfaces'
import { SettingsReader } from './SettingsReader'
import { ChromeService } from './ChromeService'

export class SettingsWriter {
  static async saveSettings(settings: AppSettings): Promise<void> {
    ChromeService.setSyncSettings(settings)
  }

  static async addPACScript(script: Omit<PACScript, 'id'>): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const newScript: PACScript = { ...script, id: crypto.randomUUID() }
    settings.pacScripts.push(newScript)
    await this.saveSettings(settings)
  }

  static async updatePACScript(script: PACScript): Promise<void> {
    const settings = await SettingsReader.getSettings()
    const index = settings.pacScripts.findIndex((s) => s.id === script.id)
    if (index !== -1) {
      settings.pacScripts[index] = script
      await this.saveSettings(settings)
    }
  }

  static async deletePACScript(id: string): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.pacScripts = settings.pacScripts.filter((s) => s.id !== id)
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
  public static async updateAllScripts(scripts: PACScript[]): Promise<void> {
    const settings = await SettingsReader.getSettings()
    settings.pacScripts = scripts
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
        !settings.pacScripts ||
        typeof settings.quickSwitchEnabled !== 'boolean'
      ) {
        throw new Error('Invalid settings file.')
      }

      // Update the settings in storage
      await this.saveSettings(settings)
    } catch (error) {
      throw new Error(
        'Failed to restore settings. Please check the file format.'
      )
    }
  }
}
