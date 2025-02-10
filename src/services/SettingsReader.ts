import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'
import { ChromeService } from './chrome'

export class SettingsReader {
  // Cache for settings to reduce storage reads
  private static settingsCache: AppSettings | null = null
  private static lastSettingsUpdate: number = 0
  private static readonly CACHE_TIMEOUT = 5000 // 5 seconds cache timeout

  static async getScripts(): Promise<ProxyConfig[]> {
    const settings = await this.getSettings()
    return settings.proxyConfigs
  }

  static async getActiveScript(): Promise<ProxyConfig | null> {
    const settings = await this.getSettings()
    return (
      settings.proxyConfigs.find(
        (script) => script.id === settings.activeScriptId
      ) || null
    )
  }
  static async getPacScriptById(id: string): Promise<ProxyConfig | null> {
    const settings = await this.getSettings()
    return settings.proxyConfigs.find((s) => s.id === id) || null
  }

  /**
   * Gets settings with caching
   */
  public static async getSettings(): Promise<AppSettings> {
    const now = Date.now()
    if (
      !SettingsReader.settingsCache ||
      now - SettingsReader.lastSettingsUpdate > SettingsReader.CACHE_TIMEOUT
    ) {
      SettingsReader.settingsCache = await ChromeService.getSyncSettings()
      SettingsReader.lastSettingsUpdate = now
    }
    return SettingsReader.settingsCache || DEFAULT_SETTINGS
  }

  /**
   * Invalidates the settings cache
   */
  public static invalidateCache(): void {
    SettingsReader.settingsCache = null
    SettingsReader.lastSettingsUpdate = 0
  }
}
