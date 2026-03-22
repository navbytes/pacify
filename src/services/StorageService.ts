// src/services/StorageService.ts

import { DEFAULT_SETTINGS } from '@/constants/app'
import { type AppSettings, ERROR_TYPES, type Settings } from '@/interfaces'
import type { ProxyServer } from '@/interfaces/settings'
import { withErrorHandling, withErrorHandlingAndFallback } from '@/utils/errorHandling'
import { CredentialService } from './CredentialService'
import { browserService } from './chrome/BrowserService'

// Size limit for storing in sync storage (Chrome limit is 8KB per item)
const SYNC_SIZE_LIMIT = 8000 // 8KB

// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class StorageService {
  // Cache for settings to reduce storage reads
  private static settingsCache: AppSettings | null = null
  private static lastSettingsUpdate: number = 0
  private static readonly CACHE_TIMEOUT = 30000 // 30 seconds cache timeout

  /**
   * Saves settings to the appropriate storage area based on size
   */
  /**
   * Strip username/password from a ProxyServer for safe sync storage
   */
  private static stripCredentials(server: ProxyServer | undefined): ProxyServer | undefined {
    if (!server) return server
    const { username: _, password: __, ...safe } = server
    return safe as ProxyServer
  }

  /**
   * Extract credentials from all proxy servers in a config
   */
  private static extractCredentials(
    config: AppSettings['proxyConfigs'][0]
  ): Record<string, { username: string; password: string }> {
    const creds: Record<string, { username: string; password: string }> = {}
    const servers: Record<string, ProxyServer | undefined> = {
      singleProxy: config.rules?.singleProxy,
      proxyForHttp: config.rules?.proxyForHttp,
      proxyForHttps: config.rules?.proxyForHttps,
      proxyForFtp: config.rules?.proxyForFtp,
      fallbackProxy: config.rules?.fallbackProxy,
    }
    for (const [key, server] of Object.entries(servers)) {
      if (server?.username || server?.password) {
        creds[key] = { username: server.username || '', password: server.password || '' }
      }
    }
    return creds
  }

  static saveSettings = withErrorHandling(async (settings: AppSettings): Promise<void> => {
    // Clone settings to avoid modifying the original.
    // JSON roundtrip is required — structuredClone throws DOMException
    // on Svelte 5's reactive $state Proxy objects passed from components.
    const settingsCopy: AppSettings = JSON.parse(JSON.stringify(settings))

    // Extract and save credentials separately (encrypted, local-only)
    for (const config of settingsCopy.proxyConfigs) {
      if (config.id) {
        const creds = this.extractCredentials(config)
        if (Object.keys(creds).length > 0) {
          await CredentialService.saveCredentials(config.id, creds)
        }
      }
    }

    // Store base settings in sync storage
    const baseSettings: AppSettings = {
      ...settingsCopy,
      proxyConfigs: settingsCopy.proxyConfigs.map((config) => {
        // Strip credentials from sync storage — they are stored encrypted in local storage
        if (config.rules) {
          config = {
            ...config,
            rules: {
              ...config.rules,
              singleProxy: this.stripCredentials(config.rules.singleProxy),
              proxyForHttp: this.stripCredentials(config.rules.proxyForHttp),
              proxyForHttps: this.stripCredentials(config.rules.proxyForHttps),
              proxyForFtp: this.stripCredentials(config.rules.proxyForFtp),
              fallbackProxy: this.stripCredentials(config.rules.fallbackProxy),
            },
          }
        }

        // If PAC script data is large, we'll store it separately
        if (config.pacScript?.data && config.pacScript.data.length > SYNC_SIZE_LIMIT) {
          const scriptId = config.id || crypto.randomUUID()
          // Store large PAC script in local storage
          this.storeScriptData(scriptId, config.pacScript.data)

          // Replace script data with a reference
          config = {
            ...config,
            pacScript: {
              ...config.pacScript,
              data: `__REF_${scriptId}__`,
            },
          }
        }

        // Strip subscription cachedRules from sync storage (too large) and store in local storage
        if (config.autoProxy?.subscriptions) {
          const configId = config.id || crypto.randomUUID()
          const subsWithRules = config.autoProxy.subscriptions.filter(
            (s) => s.cachedRules && s.cachedRules.length > 0
          )

          if (subsWithRules.length > 0) {
            // Store all cached rules in local storage keyed by config ID
            const cachedRulesMap: Record<string, string[]> = {}
            for (const sub of subsWithRules) {
              if (sub.cachedRules) {
                cachedRulesMap[sub.id] = sub.cachedRules
              }
            }
            this.storeSubscriptionRules(configId, cachedRulesMap)
          }

          // Strip cachedRules from the sync copy
          config = {
            ...config,
            autoProxy: {
              ...config.autoProxy,
              subscriptions: config.autoProxy.subscriptions.map((sub) => {
                const { cachedRules: _, ...subWithoutRules } = sub
                return subWithoutRules
              }),
            },
          }
        }

        return config
      }),
    }

    // Save base settings to sync storage
    await browserService.storage.sync.set({ settings: baseSettings })

    // Update cache
    this.settingsCache = settings
    this.lastSettingsUpdate = Date.now()
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Retrieves settings from storage, resolving any large script references
   */
  static getSettings = withErrorHandlingAndFallback(
    async (): Promise<AppSettings> => {
      const now = Date.now()

      // Use cache if it's still fresh
      if (this.settingsCache && now - this.lastSettingsUpdate < this.CACHE_TIMEOUT) {
        return this.settingsCache
      }

      // Get base settings from sync storage
      const data = await browserService.storage.sync.get('settings')
      const baseSettings: AppSettings =
        (data.settings as AppSettings | undefined) || DEFAULT_SETTINGS

      // Resolve any script references and restore subscription cached rules
      const resolvedSettings: AppSettings = {
        ...baseSettings,
        proxyConfigs: await Promise.all(
          baseSettings.proxyConfigs.map(async (config) => {
            if (config.pacScript?.data?.startsWith('__REF_')) {
              const scriptId = config.pacScript.data.replace('__REF_', '').replace('__', '')
              const scriptData = await this.getScriptData(scriptId)

              config = {
                ...config,
                pacScript: {
                  ...config.pacScript,
                  data: scriptData || '',
                },
              }
            }

            // Restore credentials from encrypted local storage
            if (config.id) {
              const creds = await CredentialService.loadCredentials(config.id)
              if (creds && config.rules) {
                const restoreServer = (
                  server: ProxyServer | undefined,
                  key: string
                ): ProxyServer | undefined => {
                  if (!server || !creds[key]) return server
                  return { ...server, username: creds[key].username, password: creds[key].password }
                }
                config = {
                  ...config,
                  rules: {
                    ...config.rules,
                    singleProxy: restoreServer(config.rules.singleProxy, 'singleProxy'),
                    proxyForHttp: restoreServer(config.rules.proxyForHttp, 'proxyForHttp'),
                    proxyForHttps: restoreServer(config.rules.proxyForHttps, 'proxyForHttps'),
                    proxyForFtp: restoreServer(config.rules.proxyForFtp, 'proxyForFtp'),
                    fallbackProxy: restoreServer(config.rules.fallbackProxy, 'fallbackProxy'),
                  },
                }
              }
            }

            // Restore subscription cachedRules from local storage
            if (config.autoProxy?.subscriptions && config.id) {
              const cachedRulesMap = await this.getSubscriptionRules(config.id)
              if (cachedRulesMap) {
                config = {
                  ...config,
                  autoProxy: {
                    ...config.autoProxy,
                    subscriptions: config.autoProxy.subscriptions.map((sub) => ({
                      ...sub,
                      cachedRules: cachedRulesMap[sub.id] || sub.cachedRules,
                    })),
                  },
                }
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
      await browserService.storage.local.set({ [`script_${scriptId}`]: data })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Stores subscription cached rules in local storage
   */
  private static storeSubscriptionRules = withErrorHandling(
    async (configId: string, rulesMap: Record<string, string[]>): Promise<void> => {
      await browserService.storage.local.set({ [`sub_rules_${configId}`]: rulesMap })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Retrieves subscription cached rules from local storage
   */
  private static getSubscriptionRules = withErrorHandlingAndFallback(
    async (configId: string): Promise<Record<string, string[]> | null> => {
      const data = await browserService.storage.local.get(`sub_rules_${configId}`)
      return (data[`sub_rules_${configId}`] as Record<string, string[]> | undefined) || null
    },
    ERROR_TYPES.FETCH_SETTINGS,
    null
  )

  /**
   * Retrieves script data from local storage
   */
  private static getScriptData = withErrorHandlingAndFallback(
    async (scriptId: string): Promise<string | null> => {
      const data = await browserService.storage.local.get(`script_${scriptId}`)
      return (data[`script_${scriptId}`] as string | undefined) || null
    },
    ERROR_TYPES.FETCH_SETTINGS,
    null
  )

  /**
   * Invalidates the settings cache
   */
  static invalidateCache(): void {
    StorageService.settingsCache = null
    StorageService.lastSettingsUpdate = 0
  }

  /**
   * Migrates old storage format to new hybrid storage
   */
  static migrateStorage = withErrorHandling(async (): Promise<void> => {
    // Get settings from sync storage
    const data = await browserService.storage.sync.get('settings')

    if (data.settings) {
      // Save using the new hybrid approach
      await this.saveSettings(data.settings as AppSettings)
    }
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Save user preferences (separate from AppSettings)
   */
  static savePreferences = withErrorHandling(async (preferences: Settings): Promise<void> => {
    await browserService.storage.sync.set({ preferences })
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Get user preferences with fallback to defaults
   */
  static getPreferences = withErrorHandlingAndFallback(
    async (): Promise<Settings> => {
      const data = await browserService.storage.sync.get('preferences')
      return (data.preferences as Settings | undefined) || { notifications: true }
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { notifications: true }
  )
}
