import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, PACScript } from '@/interfaces'
import { ChromeService } from './ChromeService'

export class SettingsReader {
  static async getSettings(): Promise<AppSettings> {
    return ChromeService.getSyncSettings()
  }

  static async getScripts(): Promise<PACScript[]> {
    const settings = await this.getSettings()
    return settings.pacScripts
  }

  static async getActiveScript(): Promise<PACScript | null> {
    const settings = await this.getSettings()
    return (
      settings.pacScripts.find(
        (script) => script.id === settings.activeScriptId
      ) || null
    )
  }
  static async getPacScriptById(id: string): Promise<PACScript | null> {
    const settings = await this.getSettings()
    return settings.pacScripts.find((s) => s.id === id) || null
  }
}
