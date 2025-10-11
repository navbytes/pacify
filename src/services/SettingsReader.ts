import type { AppSettings, ProxyConfig } from '@/interfaces'
import { StorageService } from './StorageService'

/**
 * SettingsReader provides read-only access to application settings
 * It delegates to StorageService for the actual storage operations and caching
 */
export class SettingsReader {
  static async getScripts(): Promise<ProxyConfig[]> {
    const settings = await this.getSettings()
    return settings.proxyConfigs
  }

  static async getActiveScript(): Promise<ProxyConfig | null> {
    const settings = await this.getSettings()
    return settings.proxyConfigs.find((script) => script.id === settings.activeScriptId) || null
  }

  static async getPacScriptById(id: string): Promise<ProxyConfig | null> {
    const settings = await this.getSettings()
    return settings.proxyConfigs.find((s) => s.id === id) || null
  }

  /**
   * Gets settings - delegates to StorageService for centralized caching
   */
  public static async getSettings(): Promise<AppSettings> {
    return await StorageService.getSettings()
  }

  /**
   * Invalidates the settings cache - delegates to StorageService
   */
  public static invalidateCache(): void {
    StorageService.invalidateCache()
  }
}
