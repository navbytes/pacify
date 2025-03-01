// src/services/StorageService.ts
import { ERROR_TYPES, type AppSettings, type ProxyConfig } from '@/interfaces'
import { DEFAULT_SETTINGS } from '@/constants/app'
import {
  withErrorHandling,
  withErrorHandlingAndFallback,
} from '@/utils/errorHandling'

// Size limit for storing in sync storage (Chrome limit is 8KB per item)
const SYNC_SIZE_LIMIT = 8000 // 8KB

export class StorageService {
  // Cache for settings to reduce storage reads
  private static settingsCache: AppSettings | null = null
  private static lastSettingsUpdate: number = 0
  private static readonly CACHE_TIMEOUT = 5000 // 5 seconds cache timeout

  /**
   * Saves settings to the appropriate storage area based on size
   */
  static saveSettings = withErrorHandling(
    async (settings: AppSettings): Promise<void> => {
      // Clone settings to avoid modifying the original
      const settingsCopy = structuredClone(settings)

      // Store base settings in sync storage
      const baseSettings: AppSettings = {
        ...settingsCopy,
        proxyConfigs: settingsCopy.proxyConfigs.map((config) => {
          // If PAC script data is large, we'll store it separately
          if (
            config.pacScript?.data &&
            config.pacScript.data.length > SYNC_SIZE_LIMIT
          ) {
            const scriptId = config.id || crypto.randomUUID()
            // Store large PAC script in local storage
            this.storeScriptData(scriptId, config.pacScript.data)

            // Replace script data with a reference
            return {
              ...config,
              pacScript: {
                ...config.pacScript,
                data: `__REF_${scriptId}__`,
              },
            }
          }
          return config
        }),
      }

      // Save base settings to sync storage
      await chrome.storage.sync.set({ settings: baseSettings })

      // Update cache
      this.settingsCache = settings
      this.lastSettingsUpdate = Date.now()
    },
    ERROR_TYPES.SAVE_SETTINGS
  )

  /**
   * Retrieves settings from storage, resolving any large script references
   */
  static getSettings = withErrorHandlingAndFallback(
    async (): Promise<AppSettings> => {
      const now = Date.now()

      // Use cache if it's still fresh
      if (
        this.settingsCache &&
        now - this.lastSettingsUpdate < this.CACHE_TIMEOUT
      ) {
        return this.settingsCache
      }

      // Get base settings from sync storage
      const data = await chrome.storage.sync.get('settings')
      const baseSettings: AppSettings = data.settings || DEFAULT_SETTINGS

      // Resolve any script references
      const resolvedSettings: AppSettings = {
        ...baseSettings,
        proxyConfigs: await Promise.all(
          baseSettings.proxyConfigs.map(async (config) => {
            if (config.pacScript?.data?.startsWith('__REF_')) {
              const scriptId = config.pacScript.data
                .replace('__REF_', '')
                .replace('__', '')
              const scriptData = await this.getScriptData(scriptId)

              return {
                ...config,
                pacScript: {
                  ...config.pacScript,
                  data: scriptData || '',
                },
              }
            }
            return config
          })
        ),
      }

      // Update cache
      this.settingsCache = resolvedSettings
      this.lastSettingsUpdate = now

      return resolvedSettings
    },
    ERROR_TYPES.FETCH_SETTINGS,
    DEFAULT_SETTINGS
  )

  /**
   * Stores large script data in local storage
   */
  private static storeScriptData = withErrorHandling(
    async (scriptId: string, data: string): Promise<void> => {
      await chrome.storage.local.set({ [`script_${scriptId}`]: data })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Retrieves script data from local storage
   */
  private static getScriptData = withErrorHandlingAndFallback(
    async (scriptId: string): Promise<string | null> => {
      const data = await chrome.storage.local.get(`script_${scriptId}`)
      return data[`script_${scriptId}`] || null
    },
    ERROR_TYPES.FETCH_SETTINGS,
    null
  )

  /**
   * Invalidates the settings cache
   */
  static invalidateCache(): void {
    this.settingsCache = null
    this.lastSettingsUpdate = 0
  }

  /**
   * Returns storage usage statistics
   */
  static getStorageStats = withErrorHandlingAndFallback(
    async (): Promise<{
      syncUsed: number
      syncQuota: number
      localUsed: number
      localQuota: number
    }> => {
      const [syncInfo, localInfo] = await Promise.all([
        chrome.storage.sync.getBytesInUse(null),
        chrome.storage.local.getBytesInUse(null),
      ])

      return {
        syncUsed: syncInfo,
        syncQuota: chrome.storage.sync.QUOTA_BYTES,
        localUsed: localInfo,
        localQuota: chrome.storage.local.QUOTA_BYTES,
      }
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { syncUsed: 0, syncQuota: 0, localUsed: 0, localQuota: 0 }
  )

  /**
   * Migrates old storage format to new hybrid storage
   */
  static migrateStorage = withErrorHandling(async (): Promise<void> => {
    // Get settings from sync storage
    const data = await chrome.storage.sync.get('settings')

    if (data.settings) {
      // Save using the new hybrid approach
      await this.saveSettings(data.settings)
    }
  }, ERROR_TYPES.SAVE_SETTINGS)
}
