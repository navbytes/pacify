// src/services/StorageService.ts

import { DEFAULT_SETTINGS } from '@/constants/app'
import { type AppSettings, ERROR_TYPES, type Settings } from '@/interfaces'
import type { AutoProxyRule, ProxyServer } from '@/interfaces/settings'
import { withErrorHandling, withErrorHandlingAndFallback } from '@/utils/errorHandling'
import { CredentialService } from './CredentialService'
import { I18nService } from './i18n/i18nService'
import { logger } from './LoggerService'

// Size limit for storing in sync storage (Chrome limit is 8KB per item)
const SYNC_SIZE_LIMIT = 8000 // 8KB

/**
 * Chrome caps every chrome.storage.sync item — key plus JSON-serialised value —
 * at 8,192 bytes (QUOTA_BYTES_PER_ITEM). Settings that fit are stored under the
 * single `settings` key exactly as before. Settings that don't (e.g. an imported
 * SwitchyOmega profile with dozens of switch rules) are split across
 * `settings_<n>` chunk keys, described by a `settings_meta` manifest so readers
 * know how many chunks to reassemble. `settings_meta` is authoritative whenever
 * present; its absence means the legacy single-key layout.
 */
const SETTINGS_KEY = 'settings'
const SETTINGS_META_KEY = 'settings_meta'
/**
 * Largest estimated single-item payload we still store under `settings`.
 *
 * The margin under 8,192 covers the one thing the estimate can't see: on this
 * path Chrome re-serialises the *object*, and its number formatting differs
 * from `JSON.stringify`. Measured against real Chrome, large doubles come out
 * in exponent form — `1723800000000` → `1.7238e+12` (3 bytes shorter), but a
 * full-precision `9007199254740991` → `9.007199254740991e+15` (5 bytes longer).
 * AppSettings holds only a handful of numbers, so a few hundred bytes is ample.
 * (Chunks store strings, where the estimate is exact — see splitForSync.)
 */
const SYNC_ITEM_BUDGET = 7500
/** Estimated payload per chunk — leaves ~1 KB under the 8,192-byte cap for the key, quotes and estimator slack. */
const SYNC_CHUNK_BUDGET = 7000
/**
 * Point at which we stop trying to keep Auto-Proxy rules in sync storage.
 * Sync's *total* quota (QUOTA_BYTES) is 102,400 bytes across every key; this
 * leaves room for `preferences`, the manifest, and estimator slack.
 */
const SYNC_TOTAL_BUDGET = 95_000

interface SettingsMeta {
  /** Number of `settings_<n>` chunks; 0 means the value lives under `settings`. */
  chunks: number
  /** Length of the reassembled JSON string, used to detect a partially synced write. */
  length?: number
  /**
   * Set when the settings were too large for sync even chunked, so each config's
   * `autoProxy.rules` was left out and lives in local storage instead.
   */
  rulesLocal?: boolean
}

const chunkKey = (index: number): string => `${SETTINGS_KEY}_${index}`
const autoRulesKey = (configId: string): string => `auto_rules_${configId}`

/**
 * Bytes Chrome stores for one UTF-16 code unit of serialised JSON. Verified by
 * measuring `getBytesInUse` in real Chrome: it escapes `<` as `\u003C` (6) but
 * leaves `>` and `&` alone (1); U+2028/U+2029 cost 6; control characters cost 6
 * (2 for the short forms `\n`/`\t`, so 6 merely over-estimates). Non-ASCII is
 * charged as its UTF-8 length — 2 for U+0080–07FF, 3 for the rest of the BMP,
 * 2 per surrogate half — so a flat 3 never falls short.
 */
function jsonCharBytes(c: number): number {
  if (c === 0x3c || c === 0x2028 || c === 0x2029 || c < 0x20) return 6
  return c < 0x80 ? 1 : 3
}

/** Conservative estimate of what Chrome charges for storing `json` under `key`. */
function estimateSyncItemBytes(key: string, json: string): number {
  let bytes = key.length
  for (let i = 0; i < json.length; i++) bytes += jsonCharBytes(json.charCodeAt(i))
  return bytes
}

/**
 * Split a JSON document into string chunks that each fit in one sync item once
 * Chrome re-serialises them (quotes and backslashes get escaped again). Never
 * splits a surrogate pair, which storage would otherwise mangle.
 */
function splitForSync(json: string): string[] {
  const chunks: string[] = []
  let start = 0
  let bytes = 0
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i)
    const cost = c === 0x22 || c === 0x5c ? 2 : jsonCharBytes(c)
    if (bytes + cost > SYNC_CHUNK_BUDGET) {
      let cut = i
      // Keep a trailing high surrogate with its low surrogate in the next chunk.
      if (cut - 1 > start && (json.charCodeAt(cut - 1) & 0xfc00) === 0xd800) cut--
      chunks.push(json.slice(start, cut))
      start = cut
      bytes = cut < i ? jsonCharBytes(json.charCodeAt(cut)) : 0
    }
    bytes += cost
  }
  chunks.push(json.slice(start))
  return chunks
}

/**
 * Bytes Chrome charges to store the JSON string `chunk` under `key` — the key,
 * the quotes Chrome writes around a string value, and the content with `"` and
 * `\` re-escaped. Verified exact against `getBytesInUse` for ASCII content.
 */
function estimateStringItemBytes(key: string, chunk: string): number {
  let bytes = key.length + 2
  for (let i = 0; i < chunk.length; i++) {
    const c = chunk.charCodeAt(i)
    bytes += c === 0x22 || c === 0x5c ? 2 : jsonCharBytes(c)
  }
  return bytes
}

/** Projected total sync usage of a chunked layout, including per-chunk key overhead. */
function estimateChunkedTotalBytes(chunks: string[]): number {
  let bytes = 0
  chunks.forEach((chunk, i) => {
    bytes += estimateStringItemBytes(chunkKey(i), chunk)
  })
  return bytes
}

/**
 * Drop Auto-Proxy rule lists so they can be read back from local storage.
 * Only configs with an id are touched: the local copy is keyed by id, so an
 * id-less config has nowhere to be restored from and must keep its rules.
 */
function withoutAutoProxyRules(settings: AppSettings): AppSettings {
  return {
    ...settings,
    proxyConfigs: settings.proxyConfigs.map((config) =>
      config.id && config.autoProxy
        ? { ...config, autoProxy: { ...config.autoProxy, rules: [] } }
        : config
    ),
  }
}

const isQuotaError = (error: unknown): boolean =>
  error instanceof Error && /quota/i.test(error.message)

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

    // Local-storage writes issued while building the sync copy. Collected and
    // awaited below so a save doesn't resolve before its offloaded data lands.
    const localWrites: Promise<void>[] = []

    // Which Auto-Proxy rule lists this device already holds a local copy of.
    // Read up front, before the mirroring below creates any, because that
    // distinction is what tells "the user cleared these rules" apart from
    // "these rules were spilled on some other device".
    const autoConfigIds = settingsCopy.proxyConfigs
      .filter((c) => c.id && c.autoProxy)
      .map((c) => c.id as string)
    const mirroredRules = autoConfigIds.length
      ? await chrome.storage.local.get(autoConfigIds.map(autoRulesKey))
      : {}
    const ownsRulesOf = (configId: string): boolean => autoRulesKey(configId) in mirroredRules

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

        // Mirror Auto-Proxy rules to local storage on every save, so they are
        // already there if this or a later save has to spill them out of sync.
        // An empty list is mirrored only over a copy this device already owns —
        // that records a real deletion. Creating one from nothing would forge
        // proof that rules spilled on another device are gone.
        if (config.id && config.autoProxy) {
          const rules = config.autoProxy.rules ?? []
          const unchanged =
            JSON.stringify(mirroredRules[autoRulesKey(config.id)]) === JSON.stringify(rules)
          if ((rules.length > 0 || ownsRulesOf(config.id)) && !unchanged) {
            localWrites.push(this.storeAutoProxyRules(config.id, rules))
          }
        }

        // If PAC script data is large, we'll store it separately
        if (config.pacScript?.data && config.pacScript.data.length > SYNC_SIZE_LIMIT) {
          const scriptId = config.id || crypto.randomUUID()
          // Store large PAC script in local storage
          localWrites.push(this.storeScriptData(scriptId, config.pacScript.data))

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
            localWrites.push(this.storeSubscriptionRules(configId, cachedRulesMap))
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

    // Offloaded data must be durable before the sync copy that references it.
    await Promise.all(localWrites)

    // Save base settings to sync storage
    await StorageService.writeSyncSettings(baseSettings)

    // Update cache
    this.settingsCache = settings
    this.lastSettingsUpdate = Date.now()
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Writes base settings to sync storage, as a single `settings` item when it
   * fits Chrome's per-item quota and as `settings_<n>` chunks otherwise.
   *
   * Everything — manifest, payload, and `null` over whatever the other layout
   * left behind — goes into ONE `set` call, so no *local* reader (popup vs.
   * background) can observe a half-applied layout, and a concurrent local save
   * can only replace it wholesale. A separate `remove` of stale keys could race
   * such a writer and delete data it had just written, so retired keys are
   * nulled instead, at a few bytes each. Note this atomicity is local only:
   * Chrome sync propagates *per item*, so a remote device can still see one
   * key of a write before another — which `readSyncSettings` guards against.
   *
   * If even the chunked layout would blow sync's *total* quota, Auto-Proxy rule
   * lists are left out of the sync copy and read back from local storage, which
   * `saveSettings` keeps mirrored. That trades cross-device sync of those rules
   * (only for setups this large) against not being able to save them at all.
   *
   * Once set, `rulesLocal` stays set. Un-spilling would mean some device
   * republishing its own rule lists as the truth for every device — and no
   * device can tell a complete view from a partial one, because a device that
   * never received the spilled rules looks exactly like one whose user deleted
   * them. A second device adding a single rule would then overwrite the
   * hundreds held elsewhere. The cost of staying spilled is that a profile
   * which later shrinks keeps its rules device-local; the cost of the
   * alternative is silent, unrecoverable data loss.
   */
  private static async writeSyncSettings(baseSettings: AppSettings): Promise<void> {
    const sync = chrome.storage.sync
    let json = JSON.stringify(baseSettings)
    const existing = await sync.get(null)
    const previousMeta = existing[SETTINGS_META_KEY] as SettingsMeta | undefined

    // Never publish over a layout this device cannot currently read in full —
    // the write-side mirror of the guards in `readSyncSettings`. Sync delivers
    // per item, so any of these shapes means part of a write is still in
    // flight; saving now would republish this device's partial view and wipe
    // the real settings everywhere. All three are decided from `existing`,
    // which is already in hand.
    const incomplete =
      previousMeta === undefined
        ? // No manifest, yet something proves a chunked layout exists: either a
          // chunk, or the `settings: null` the chunked branch writes (the same
          // proof `readSyncSettings` relies on). Nothing here records that the
          // layout is chunked, nor whether its rules were spilled.
          existing[SETTINGS_KEY] === null ||
          Object.keys(existing).some(
            (key) => /^settings_\d+$/.test(key) && typeof existing[key] === 'string'
          )
        : previousMeta.chunks > 0
          ? // A manifest promising chunks that have not all arrived, or that
            // reassemble to the wrong size — the reader's two checks exactly.
            !StorageService.chunksComplete(existing, previousMeta)
          : // A single-key manifest whose payload has not arrived.
            existing[SETTINGS_KEY] == null
    if (incomplete) {
      throw new Error(I18nService.getMessage('syncStorageIncomplete'))
    }

    const stickySpill = previousMeta?.rulesLocal === true

    const items: Record<string, unknown> = {}
    let liveChunks = 0
    if (!stickySpill && estimateSyncItemBytes(SETTINGS_KEY, json) <= SYNC_ITEM_BUDGET) {
      items[SETTINGS_KEY] = baseSettings
      items[SETTINGS_META_KEY] = { chunks: 0 } satisfies SettingsMeta
    } else {
      let chunks = splitForSync(json)
      let rulesLocal = false
      if (stickySpill || estimateChunkedTotalBytes(chunks) > SYNC_TOTAL_BUDGET) {
        const trimmed = withoutAutoProxyRules(baseSettings)
        const trimmedJson = JSON.stringify(trimmed)
        // Only worth it if dropping the rules actually shrinks the payload.
        if (stickySpill || trimmedJson.length < json.length) {
          rulesLocal = true
          json = trimmedJson
          chunks = splitForSync(json)
          if (!stickySpill) {
            logger.warn('Settings exceed sync storage; Auto-Proxy rules kept in local storage only')
          }
        }
      }
      liveChunks = chunks.length
      chunks.forEach((chunk, i) => {
        items[chunkKey(i)] = chunk
      })
      items[SETTINGS_META_KEY] = {
        chunks: liveChunks,
        length: json.length,
        ...(rulesLocal ? { rulesLocal: true } : {}),
      } satisfies SettingsMeta
      items[SETTINGS_KEY] = null
    }
    // Retire every chunk key this write doesn't use — including any orphaned by
    // a concurrent save that landed after this pre-read — so they stop eating quota.
    for (const key of Object.keys(existing)) {
      const match = /^settings_(\d+)$/.exec(key)
      if (match && Number(match[1]) >= liveChunks && existing[key] !== null) items[key] = null
    }

    try {
      await sync.set(items)
    } catch (error) {
      // Chunking sidesteps the per-item cap; what's left is sync's 100 KB total.
      // Surface that as an actionable message instead of Chrome's raw error.
      if (isQuotaError(error)) throw new Error(I18nService.getMessage('syncStorageQuotaExceeded'))
      throw error
    }
  }

  /**
   * Whether every chunk a manifest promises is present and they reassemble to
   * the length it recorded — the same test `readSyncSettings` applies, so the
   * write guard refuses exactly when a read would find the layout unusable.
   */
  private static chunksComplete(stored: Record<string, unknown>, meta: SettingsMeta): boolean {
    let json = ''
    for (let i = 0; i < meta.chunks; i++) {
      const part = stored[chunkKey(i)]
      if (typeof part !== 'string') return false
      json += part
    }
    return meta.length === undefined || json.length === meta.length
  }

  /**
   * Reads base settings from sync storage, reassembling chunks when the
   * manifest says the value was split. `settings` is null when nothing is
   * stored; `rulesLocal` reports whether Auto-Proxy rules were left out.
   * @throws when a chunked value is incomplete (e.g. only partially synced).
   */
  private static async readSyncSettings(): Promise<{
    settings: AppSettings | null
    rulesLocal: boolean
  }> {
    const sync = chrome.storage.sync
    const stored = await sync.get([SETTINGS_KEY, SETTINGS_META_KEY])
    const meta = stored[SETTINGS_META_KEY] as SettingsMeta | undefined

    if (meta && meta.chunks > 0) {
      const keys = Array.from({ length: meta.chunks }, (_, i) => chunkKey(i))
      const parts = await sync.get(keys)
      const json = keys.map((key) => parts[key] ?? '').join('')
      if (meta.length !== undefined && json.length !== meta.length) {
        // Detail goes to the log; the thrown message may reach the user when a
        // cold service worker has no cached copy to fall back on.
        logger.warn(`Settings chunks incomplete (${json.length}/${meta.length} chars)`)
        throw new Error(I18nService.getMessage('syncStorageIncomplete'))
      }
      return { settings: JSON.parse(json) as AppSettings, rulesLocal: meta.rulesLocal === true }
    }

    // Sync propagates per item, so a device can hold one key of a write and not
    // another. Two shapes prove we are looking at half of one, and both must
    // read as unreadable rather than as "this user has no settings" — the
    // caller serves its cached copy instead.
    //
    // An explicit null under `settings` is written by exactly one code path
    // (the chunked branch below), so it proves a chunked layout exists even
    // when the manifest has not arrived. A profile that never had settings has
    // the key absent instead, which is how the two stay distinguishable.
    if (stored[SETTINGS_KEY] === null) {
      logger.warn('Settings are chunked but the manifest has not arrived')
      throw new Error(I18nService.getMessage('syncStorageIncomplete'))
    }
    // A `chunks: 0` manifest is only ever written together with its `settings`
    // value, so one without the other is the same story in reverse.
    if (meta && stored[SETTINGS_KEY] === undefined) {
      logger.warn('Settings item missing for single-key layout')
      throw new Error(I18nService.getMessage('syncStorageIncomplete'))
    }

    return {
      settings: (stored[SETTINGS_KEY] as AppSettings | undefined) ?? null,
      rulesLocal: false,
    }
  }

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
      let baseSettings: AppSettings
      let rulesLocal = false
      try {
        const read = await StorageService.readSyncSettings()
        baseSettings = read.settings ?? DEFAULT_SETTINGS
        rulesLocal = read.rulesLocal
      } catch (error) {
        // A chunked write from another device may have only partially arrived.
        // Serve the last good copy instead of resetting to defaults; the next
        // read (cache is left stale on purpose) retries storage.
        if (this.settingsCache) {
          logger.warn('Settings unreadable, serving cached copy:', error)
          return this.settingsCache
        }
        throw error
      }

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

            // Restore Auto-Proxy rules that were too large to keep in sync
            if (rulesLocal && config.autoProxy && config.id) {
              const rules = await this.getAutoProxyRules(config.id)
              if (rules) {
                config = { ...config, autoProxy: { ...config.autoProxy, rules } }
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
      await chrome.storage.local.set({ [`script_${scriptId}`]: data })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Stores subscription cached rules in local storage
   */
  private static storeSubscriptionRules = withErrorHandling(
    async (configId: string, rulesMap: Record<string, string[]>): Promise<void> => {
      await chrome.storage.local.set({ [`sub_rules_${configId}`]: rulesMap })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Mirrors a config's Auto-Proxy rules into local storage. Written on every
   * save so the copy is current if the settings ever outgrow sync storage.
   */
  private static storeAutoProxyRules = withErrorHandling(
    async (configId: string, rules: AutoProxyRule[]): Promise<void> => {
      await chrome.storage.local.set({ [autoRulesKey(configId)]: rules })
    },
    ERROR_TYPES.SAVE_SCRIPT
  )

  /**
   * Retrieves a config's Auto-Proxy rules from local storage
   */
  private static getAutoProxyRules = withErrorHandlingAndFallback(
    async (configId: string): Promise<AutoProxyRule[] | null> => {
      const data = await chrome.storage.local.get(autoRulesKey(configId))
      return (data[autoRulesKey(configId)] as AutoProxyRule[] | undefined) ?? null
    },
    ERROR_TYPES.FETCH_SETTINGS,
    null
  )

  /**
   * Retrieves subscription cached rules from local storage
   */
  private static getSubscriptionRules = withErrorHandlingAndFallback(
    async (configId: string): Promise<Record<string, string[]> | null> => {
      const data = await chrome.storage.local.get(`sub_rules_${configId}`)
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
      const data = await chrome.storage.local.get(`script_${scriptId}`)
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
    // Already on the manifest layout — nothing to migrate, and skipping the
    // rewrite avoids burning a sync write on every popup/options open.
    const current = await chrome.storage.sync.get(SETTINGS_META_KEY)
    if (current[SETTINGS_META_KEY]) return

    // Legacy single-key layout: re-save through the current write path.
    const { settings: legacy } = await StorageService.readSyncSettings()
    if (legacy) {
      await this.saveSettings(legacy)
    }
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Save user preferences (separate from AppSettings).
   * Accepts a partial update and merges it with stored values so callers
   * can't accidentally clobber preferences they didn't touch.
   */
  static savePreferences = withErrorHandling(
    async (preferences: Partial<Settings>): Promise<void> => {
      const current = await StorageService.getPreferences()
      await chrome.storage.sync.set({ preferences: { ...current, ...preferences } })
    },
    ERROR_TYPES.SAVE_SETTINGS
  )

  /**
   * Get user preferences with fallback to defaults
   */
  static getPreferences = withErrorHandlingAndFallback(
    async (): Promise<Settings> => {
      const data = await chrome.storage.sync.get('preferences')
      const stored = data.preferences as Partial<Settings> | undefined
      return {
        notifications: stored?.notifications ?? true,
        loggingEnabled: stored?.loggingEnabled ?? false,
      }
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { notifications: true, loggingEnabled: false }
  )
}
