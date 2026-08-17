import { afterAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, AutoProxyRule, ProxyConfig } from '@/interfaces'
import { browserService } from '@/services/chrome/BrowserService'
import { ImportService } from '@/services/import/ImportService'
import { StorageService } from '@/services/StorageService'

/**
 * Chrome's real chrome.storage.sync limits — see
 * https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync
 */
const QUOTA_BYTES_PER_ITEM = 8192
const QUOTA_BYTES = 102_400

/**
 * How Chrome measures a stored item: key length + UTF-8 size of the JSON it
 * writes for the value. Chrome's JSON writer additionally escapes `<`, U+2028
 * and U+2029 as \uXXXX, so a faithful stand-in has to count those as 6 bytes.
 * Calibrated against real Chrome \u2014 see the per-character test below.
 */
function chromeItemBytes(key: string, value: unknown): number {
  const json = JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return key.length + new TextEncoder().encode(json).length
}

/**
 * Per-character byte costs measured against real Chrome by storing
 * `char.repeat(100)` in chrome.storage.sync and reading `getBytesInUse`.
 * Chrome escapes `<` but \u2014 contrary to what its HTML-safe reputation suggests \u2014
 * NOT `>` or `&`. Locking the numbers down here keeps `chromeItemBytes` (which
 * decides whether these tests would have caught issue #75) honest, and documents
 * why StorageService's own estimator charges what it does.
 */
const MEASURED_CHROME_BYTES: ReadonlyArray<[label: string, char: string, bytes: number]> = [
  ['ascii', 'a', 1],
  ['quote', '"', 2],
  ['backslash', '\\', 2],
  ['less-than (escaped)', '<', 6],
  ['greater-than (not escaped)', '>', 1],
  ['ampersand (not escaped)', '&', 1],
  ['newline', '\n', 2],
  ['tab', '\t', 2],
  ['NUL', '\x00', 6],
  ['unit separator', '\x1f', 6],
  ['DEL (not escaped)', '\x7f', 1],
  ['U+00E9 \u00e9', '\u00e9', 2],
  ['U+4E2D \u4e2d', '\u4e2d', 3],
  ['U+2028 line separator', '\u2028', 6],
  ['U+2029 paragraph separator', '\u2029', 6],
  ['U+1F600 emoji (surrogate pair)', '\u{1f600}', 4],
]

/** In-memory chrome.storage area. Quotas are checked for the whole batch before anything is written, like Chrome. */
function createArea(limits: { perItem?: number; total?: number } = {}) {
  const store = new Map<string, unknown>()
  const toList = (keys: string | string[] | null) =>
    keys === null ? [...store.keys()] : Array.isArray(keys) ? keys : [keys]
  return {
    store,
    get: async (keys: string | string[] | null): Promise<Record<string, unknown>> => {
      const out: Record<string, unknown> = {}
      for (const key of toList(keys)) {
        if (store.has(key)) out[key] = structuredClone(store.get(key))
      }
      return out
    },
    set: async (items: Record<string, unknown>): Promise<void> => {
      for (const [key, value] of Object.entries(items)) {
        if (limits.perItem && chromeItemBytes(key, value) > limits.perItem) {
          throw new Error('Resource::kQuotaBytesPerItem quota exceeded')
        }
      }
      if (limits.total) {
        const merged = new Map(store)
        for (const [key, value] of Object.entries(items)) merged.set(key, value)
        let total = 0
        for (const [key, value] of merged) total += chromeItemBytes(key, value)
        if (total > limits.total) throw new Error('Resource::kQuotaBytes quota exceeded')
      }
      for (const [key, value] of Object.entries(items)) store.set(key, structuredClone(value))
    },
  }
}

let sync = createArea({ perItem: QUOTA_BYTES_PER_ITEM, total: QUOTA_BYTES })
let local = createArea()

// spyOn (restored in afterAll) rather than mock.module, which is process-global
// in bun and would leak into other test files.
const spies = {
  syncGet: spyOn(browserService.storage.sync, 'get').mockImplementation((k) => sync.get(k)),
  syncSet: spyOn(browserService.storage.sync, 'set').mockImplementation((i) => sync.set(i)),
  localGet: spyOn(browserService.storage.local, 'get').mockImplementation((k) => local.get(k)),
  localSet: spyOn(browserService.storage.local, 'set').mockImplementation((i) => local.set(i)),
}

afterAll(() => {
  for (const spy of Object.values(spies)) spy.mockRestore()
  StorageService.invalidateCache()
})

/** Chunk keys that hold content. Retired chunk keys are overwritten with null, not removed. */
const liveChunkKeys = () =>
  [...sync.store.keys()]
    .filter((k) => /^settings_\d+$/.test(k) && typeof sync.store.get(k) === 'string')
    .sort()
const plainSettings = () => sync.store.get('settings') ?? null

function makeRule(
  index: number,
  targetId: string,
  pattern = `*.example${index}.com`
): AutoProxyRule {
  return {
    id: crypto.randomUUID(),
    pattern,
    matchType: 'wildcard',
    proxyType: 'existing',
    proxyId: targetId,
    enabled: true,
    priority: index,
  }
}

/** A fixed proxy plus an Auto-Proxy config with `ruleCount` inline rules — the shape a SwitchyOmega import produces. */
function makeSettings(ruleCount: number, patternFor?: (i: number) => string): AppSettings {
  const proxyId = crypto.randomUUID()
  const proxy: ProxyConfig = {
    id: proxyId,
    name: 'proxy',
    color: '#99ccee',
    isActive: false,
    mode: 'fixed_servers',
    rules: {
      singleProxy: { scheme: 'http', host: '127.0.0.1', port: '7890' },
      bypassList: ['<local>', '127.0.0.1'],
    },
  }
  const auto: ProxyConfig = {
    id: crypto.randomUUID(),
    name: 'auto switch',
    color: '#99dd99',
    isActive: false,
    mode: 'pac_script',
    autoProxy: {
      rules: Array.from({ length: ruleCount }, (_, i) => makeRule(i, proxyId, patternFor?.(i))),
      fallbackType: 'direct',
    },
  }
  return { ...DEFAULT_SETTINGS, proxyConfigs: [proxy, auto] }
}

async function readBack(): Promise<AppSettings> {
  StorageService.invalidateCache()
  return StorageService.getSettings()
}

describe('chrome byte accounting (calibration)', () => {
  test.each(
    MEASURED_CHROME_BYTES
  )('the test double charges %s what real Chrome charges', (_label, char, bytes) => {
    const baseline = chromeItemBytes('k', '')
    expect(chromeItemBytes('k', char.repeat(100)) - baseline).toBe(bytes * 100)
  })

  test('a lone surrogate cannot survive storage, so chunks must never split a pair', () => {
    // Real Chrome round-trips 'a\ud83da' as 'a�a' — the lone half is
    // replaced, which would silently corrupt any emoji cut across a boundary.
    const loneHigh = '\ud83d'
    expect(loneHigh.isWellFormed()).toBe(false)
    expect(`a${loneHigh}a`.toWellFormed()).toBe('a�a')
  })
})

describe('StorageService sync layout', () => {
  beforeEach(() => {
    sync = createArea({ perItem: QUOTA_BYTES_PER_ITEM, total: QUOTA_BYTES })
    local = createArea()
    for (const spy of Object.values(spies)) spy.mockClear()
    StorageService.invalidateCache()
  })

  test('settings that fit stay under the single `settings` key', async () => {
    const settings = makeSettings(5)
    await StorageService.saveSettings(settings)

    expect(plainSettings()).toEqual(settings)
    expect(sync.store.get('settings_meta')).toEqual({ chunks: 0 })
    expect(liveChunkKeys()).toEqual([])
    expect(spies.syncSet).toHaveBeenCalledTimes(1) // one write op per save, as before
    expect(await readBack()).toEqual(settings)
  })

  test('settings over the 8 KB per-item cap are chunked and round-trip', async () => {
    // ~60 inline rules ≈ 12 KB — the size a SwitchyOmega auto-switch import produces.
    const settings = makeSettings(60)
    expect(chromeItemBytes('settings', settings)).toBeGreaterThan(QUOTA_BYTES_PER_ITEM)

    await StorageService.saveSettings(settings)

    const meta = sync.store.get('settings_meta') as { chunks: number; length: number }
    expect(meta.chunks).toBeGreaterThan(1)
    expect(liveChunkKeys()).toHaveLength(meta.chunks)
    expect(plainSettings()).toBeNull()
    // The fake `set` throws on any oversized item, so reaching here already
    // proves every chunk fits; assert it explicitly for the reader's benefit.
    for (const [key, value] of sync.store) {
      expect(chromeItemBytes(key, value)).toBeLessThanOrEqual(QUOTA_BYTES_PER_ITEM)
    }
    expect(await readBack()).toEqual(settings)
  })

  test('shrinking back under the cap restores the single key and retires the chunks', async () => {
    await StorageService.saveSettings(makeSettings(60))
    const retired = liveChunkKeys()
    expect(retired.length).toBeGreaterThan(0)

    const small = makeSettings(3)
    await StorageService.saveSettings(small)

    expect(sync.store.get('settings_meta')).toEqual({ chunks: 0 })
    expect(liveChunkKeys()).toEqual([])
    for (const key of retired) expect(sync.store.get(key)).toBeNull()
    expect(await readBack()).toEqual(small)
  })

  test('shrinking to fewer chunks retires the surplus chunk keys', async () => {
    await StorageService.saveSettings(makeSettings(200))
    const before = liveChunkKeys()
    expect(before.length).toBeGreaterThan(2)

    const smaller = makeSettings(60)
    await StorageService.saveSettings(smaller)

    const meta = sync.store.get('settings_meta') as { chunks: number }
    expect(meta.chunks).toBeLessThan(before.length)
    expect(liveChunkKeys()).toHaveLength(meta.chunks)
    for (const key of before.slice(meta.chunks)) expect(sync.store.get(key)).toBeNull()
    expect(await readBack()).toEqual(smaller)
  })

  test('orphaned chunk keys left by an interrupted or concurrent save are retired on the next save', async () => {
    // Manifest says single-key layout, but a stray chunk with content lingers.
    sync.store.set('settings', structuredClone(makeSettings(2)))
    sync.store.set('settings_meta', { chunks: 0 })
    sync.store.set('settings_7', 'x'.repeat(5000))

    await StorageService.saveSettings(makeSettings(3))

    expect(sync.store.get('settings_7')).toBeNull()
    expect(liveChunkKeys()).toEqual([])
  })

  test('every save is a single atomic set, so concurrent writers cannot leave a mixed layout', async () => {
    // Two contexts (popup + background) saving at once, flipping layouts in
    // opposite directions. Whichever lands last must win outright: the
    // manifest, its payload and the neutralised other layout all arrive together.
    const big = makeSettings(60)
    const small = makeSettings(2)
    for (const order of [
      [small, big],
      [big, small],
    ]) {
      await StorageService.saveSettings(big)
      await Promise.all(order.map((s) => StorageService.saveSettings(s)))

      const stored = await readBack()
      expect([big, small]).toContainEqual(stored)
      const meta = sync.store.get('settings_meta') as { chunks: number }
      if (meta.chunks === 0) {
        expect(plainSettings()).toEqual(stored)
      } else {
        expect(plainSettings()).toBeNull()
        expect(liveChunkKeys().length).toBeGreaterThanOrEqual(meta.chunks)
      }
      // Whatever the loser left behind is swept by the next ordinary save.
      await StorageService.saveSettings(small)
      expect(liveChunkKeys()).toEqual([])
      expect(await readBack()).toEqual(small)
    }
  })

  test('non-ASCII names, `<` and emoji survive chunking (Chrome escapes these when measuring)', async () => {
    // Patterns dense in the characters Chrome charges extra for.
    const settings = makeSettings(80, (i) => `*.示例${i}.测试<${'😀'.repeat(3)}>.com`)
    await StorageService.saveSettings(settings)

    expect(liveChunkKeys().length).toBeGreaterThan(1)
    for (const key of liveChunkKeys()) {
      const chunk = sync.store.get(key) as string
      // Storage mangles lone surrogates, so no chunk boundary may split an emoji.
      expect(chunk.isWellFormed()).toBe(true)
    }
    expect(await readBack()).toEqual(settings)
  })

  test('large PAC scripts still live in local storage behind a reference', async () => {
    const pac = `function FindProxyForURL(url, host) { ${'// pad\n'.repeat(2000)} return "DIRECT"; }`
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      proxyConfigs: [
        {
          id: 'pac-1',
          name: 'big pac',
          color: '#000',
          isActive: false,
          mode: 'pac_script',
          pacScript: { data: pac },
        },
      ],
    }
    await StorageService.saveSettings(settings)

    expect(local.store.get('script_pac-1')).toBe(pac)
    expect(JSON.stringify([...sync.store.values()])).not.toContain('// pad')
    expect(await readBack()).toEqual(settings)
  })

  test('reads the legacy single-key layout written before chunking existed', async () => {
    const legacy = makeSettings(4)
    sync.store.set('settings', structuredClone(legacy)) // no settings_meta

    expect(await readBack()).toEqual(legacy)
  })

  test('migrateStorage upgrades the legacy layout once and is a no-op afterwards', async () => {
    const legacy = makeSettings(4)
    sync.store.set('settings', structuredClone(legacy))

    await StorageService.migrateStorage()
    expect(sync.store.get('settings_meta')).toEqual({ chunks: 0 })
    expect(await readBack()).toEqual(legacy)

    spies.syncSet.mockClear()
    await StorageService.migrateStorage()
    expect(spies.syncSet).not.toHaveBeenCalled()
  })

  test('a half-delivered shrink to the single-key layout falls back to the cache', async () => {
    // Chrome sync propagates per item, so another device can see the new
    // `settings_meta {chunks: 0}` while `settings` still holds the null the
    // previous chunked write left behind. That must not read as "no settings".
    const settings = makeSettings(60)
    await StorageService.saveSettings(settings) // chunked, warms the cache
    sync.store.set('settings_meta', { chunks: 0 })
    sync.store.set('settings', null)

    ;(StorageService as unknown as { lastSettingsUpdate: number }).lastSettingsUpdate = 0
    expect(await StorageService.getSettings()).toEqual(settings)

    StorageService.invalidateCache()
    expect(await StorageService.getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  test('a partially synced chunk set falls back to the last good copy, not defaults', async () => {
    const settings = makeSettings(60)
    await StorageService.saveSettings(settings) // warms the cache
    sync.store.delete('settings_1') // simulate a chunk that has not arrived yet

    // Expire (but keep) the cache so the next read hits storage.
    ;(StorageService as unknown as { lastSettingsUpdate: number }).lastSettingsUpdate = 0
    expect(await StorageService.getSettings()).toEqual(settings)

    // With no cached copy at all, the read degrades to defaults as before.
    StorageService.invalidateCache()
    expect(await StorageService.getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  test('rules that would blow the total sync quota spill to local storage and still round-trip', async () => {
    // ~600 rules ≈ 120 KB — over sync's 100 KB total even chunked.
    const settings = makeSettings(600)
    await StorageService.saveSettings(settings)

    const meta = sync.store.get('settings_meta') as { chunks: number; rulesLocal?: boolean }
    expect(meta.rulesLocal).toBe(true)

    // Sync carries the configs but not the rules; local carries the rules.
    const syncedJson = liveChunkKeys()
      .sort((a, b) => Number(a.slice(9)) - Number(b.slice(9)))
      .map((k) => sync.store.get(k) as string)
      .join('')
    const synced = JSON.parse(syncedJson) as AppSettings
    expect(synced.proxyConfigs[1].autoProxy?.rules).toEqual([])
    const autoId = settings.proxyConfigs[1].id as string
    expect(local.store.get(`auto_rules_${autoId}`)).toHaveLength(600)

    // The caller still sees the complete settings.
    expect(await readBack()).toEqual(settings)
  })

  test('rules of a config with no id are never spilled — they have nowhere to come back from', async () => {
    // Local copies are keyed by config id, so an id-less config must keep its
    // rules in sync even when the payload is over budget. Spilling the big
    // (id'd) config is enough to get under it; the small orphan rides along.
    const big = makeSettings(600)
    const orphan = { ...makeSettings(10).proxyConfigs[1], id: undefined, name: 'no id' }
    await StorageService.saveSettings({ ...big, proxyConfigs: [...big.proxyConfigs, orphan] })

    const meta = sync.store.get('settings_meta') as { chunks: number; rulesLocal?: boolean }
    expect(meta.rulesLocal).toBe(true)

    const synced = JSON.parse(
      liveChunkKeys()
        .sort((a, b) => Number(a.slice(9)) - Number(b.slice(9)))
        .map((k) => sync.store.get(k) as string)
        .join('')
    ) as AppSettings
    expect(synced.proxyConfigs.find((c) => c.name === 'no id')?.autoProxy?.rules).toHaveLength(10)
    // ...while the config that can be restored from local was spilled.
    expect(synced.proxyConfigs.find((c) => c.name === 'auto switch')?.autoProxy?.rules).toEqual([])
  })

  test('a second device cannot publish an empty rule list over spilled rules', async () => {
    // Device A spills 600 rules; only A's local storage has them.
    const settings = makeSettings(600)
    await StorageService.saveSettings(settings)
    const autoId = settings.proxyConfigs[1].id as string

    // Device B: same synced settings, but its local storage never had the rules.
    local.store.clear()
    const asSeenByDeviceB = await readBack()
    expect(asSeenByDeviceB.proxyConfigs[1].autoProxy?.rules).toEqual([])

    // B saves for an unrelated reason. That must not turn "B can't see them"
    // into "they are gone" for device A.
    await StorageService.saveSettings({ ...asSeenByDeviceB, quickSwitchEnabled: true })

    const meta = sync.store.get('settings_meta') as { rulesLocal?: boolean }
    expect(meta.rulesLocal).toBe(true) // still points readers at local storage

    // Device A, whose local copy is intact, still sees all 600 rules.
    local.store.set(`auto_rules_${autoId}`, settings.proxyConfigs[1].autoProxy?.rules)
    const asSeenByDeviceA = await readBack()
    expect(asSeenByDeviceA.proxyConfigs[1].autoProxy?.rules).toHaveLength(600)
    expect(asSeenByDeviceA.quickSwitchEnabled).toBe(true) // B's actual edit still synced
  })

  test('a second device that ADDS a rule cannot overwrite the spilled set', async () => {
    // The dangerous variant of the case above: device B's view is empty, so any
    // edit it makes is based on a false premise. It must still not become the
    // authority for a list it never saw.
    const settings = makeSettings(600)
    await StorageService.saveSettings(settings)
    const autoId = settings.proxyConfigs[1].id as string
    const realRules = settings.proxyConfigs[1].autoProxy?.rules

    local.store.clear() // device B
    const seenByB = await readBack()
    expect(seenByB.proxyConfigs[1].autoProxy?.rules).toEqual([])

    // The user on B, seeing "no rules", adds one.
    await StorageService.saveSettings({
      ...seenByB,
      proxyConfigs: seenByB.proxyConfigs.map((c) =>
        c.id === autoId && c.autoProxy
          ? { ...c, autoProxy: { ...c.autoProxy, rules: [makeRule(0, autoId, '*.added.example')] } }
          : c
      ),
    })

    // Device A still has all 600.
    local.store.set(`auto_rules_${autoId}`, realRules)
    const seenByA = await readBack()
    expect(seenByA.proxyConfigs[1].autoProxy?.rules).toHaveLength(600)
  })

  test('emptying a spilled rule list on the owning device sticks', async () => {
    // The mirror records the empty list, so the restore does not resurrect the
    // old rules — the opposite failure to the cross-device case above.
    const settings = makeSettings(600)
    await StorageService.saveSettings(settings)

    const cleared: AppSettings = {
      ...settings,
      proxyConfigs: settings.proxyConfigs.map((c) =>
        c.autoProxy ? { ...c, autoProxy: { ...c.autoProxy, rules: [] } } : c
      ),
    }
    await StorageService.saveSettings(cleared)

    expect(await readBack()).toEqual(cleared)
  })

  test('rules are mirrored to local even when they comfortably fit in sync', async () => {
    // Guarantees a later spill can never lose rules that were only ever in sync.
    const settings = makeSettings(5)
    await StorageService.saveSettings(settings)

    const autoId = settings.proxyConfigs[1].id as string
    expect(local.store.get(`auto_rules_${autoId}`)).toHaveLength(5)
    expect(sync.store.get('settings_meta')).toEqual({ chunks: 0 })
  })

  test('once spilled, rules stay spilled even after the settings shrink', async () => {
    // Un-spilling would mean one device republishing its own rule lists as the
    // truth, and no device can prove its view is the complete one. Staying
    // spilled costs cross-device sync of these rules; un-spilling would cost
    // the rules themselves. The data still round-trips for its owner.
    await StorageService.saveSettings(makeSettings(600))
    expect((sync.store.get('settings_meta') as { rulesLocal?: boolean }).rulesLocal).toBe(true)

    const smaller = makeSettings(60)
    await StorageService.saveSettings(smaller)

    const meta = sync.store.get('settings_meta') as { rulesLocal?: boolean }
    expect(meta.rulesLocal).toBe(true)
    expect(await readBack()).toEqual(smaller)
  })

  test("what sync still can't hold fails with a localized message and keeps the old settings", async () => {
    const previous = makeSettings(10)
    await StorageService.saveSettings(previous)

    // Bypass lists have nowhere to spill to, so a huge one still exceeds the
    // total. (chrome.i18n is stubbed to '' in tests, so getMessage returns the key.)
    const huge: AppSettings = {
      ...DEFAULT_SETTINGS,
      proxyConfigs: [
        {
          id: crypto.randomUUID(),
          name: 'huge bypass',
          color: '#000',
          isActive: false,
          mode: 'fixed_servers',
          rules: {
            singleProxy: { scheme: 'http', host: '127.0.0.1', port: '8080' },
            bypassList: Array.from({ length: 4000 }, (_, i) => `*.bypass-host-${i}.example`),
          },
        },
      ],
    }
    await expect(StorageService.saveSettings(huge)).rejects.toThrow('syncStorageQuotaExceeded')
    expect(await readBack()).toEqual(previous)
  })

  test('issue #75: importing a SwitchyOmega backup with many switch rules succeeds', async () => {
    const bak = {
      schemaVersion: 2,
      '+proxy': {
        profileType: 'FixedProfile',
        name: 'proxy',
        color: '#99ccee',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
        bypassList: [{ conditionType: 'BypassCondition', pattern: '<local>' }],
      },
      '+auto switch': {
        profileType: 'SwitchProfile',
        name: 'auto switch',
        color: '#99dd99',
        defaultProfileName: 'direct',
        rules: Array.from({ length: 120 }, (_, i) => ({
          condition: { conditionType: 'HostWildcardCondition', pattern: `*.site${i}.example` },
          profileName: 'proxy',
        })),
      },
    }

    const parsed = ImportService.parse(JSON.stringify(bak))
    expect(parsed.report.ruleCount).toBe(120)

    const committed = await ImportService.commit(parsed, 'merge')
    expect(committed).toHaveLength(2)

    const stored = await readBack()
    expect(stored.proxyConfigs.map((c) => c.name)).toEqual(['proxy', 'auto switch'])
    expect(stored.proxyConfigs[1].autoProxy?.rules).toHaveLength(120)
    expect(liveChunkKeys().length).toBeGreaterThan(1)
  })
})
