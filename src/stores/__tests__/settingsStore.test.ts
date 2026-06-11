import { afterAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { get } from 'svelte/store'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'
import { ChromeService } from '@/services/chrome'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'
import { StorageService } from '@/services/StorageService'
import { settingsStore } from '../settingsStore'

/**
 * Unit tests for the settingsStore.
 *
 * The store is a singleton that coordinates the in-memory Svelte state with
 * StorageService (persistence) and ChromeService (background messaging). We
 * spy on both so we can assert on (a) the observable store value, (b) what gets
 * persisted, and (c) which background messages are sent — without a browser.
 *
 * NOTE: spyOn (restored in afterAll) is used deliberately instead of
 * mock.module — the latter is process-global in bun and leaks the replacement
 * into every later test file, breaking suites that rely on the real services.
 */

// ---- Backing storage ------------------------------------------------------
let mockStored: AppSettings
let savedSettings: AppSettings | null = null
const sentMessages: Array<{ type: string; [k: string]: unknown }> = []

// Spies on the real services, grouped under the same names the assertions use.
const mockStorageService = {
  getSettings: spyOn(StorageService, 'getSettings').mockImplementation(async () =>
    structuredClone(mockStored)
  ),
  saveSettings: spyOn(StorageService, 'saveSettings').mockImplementation(
    async (settings: AppSettings) => {
      savedSettings = structuredClone(settings)
      mockStored = structuredClone(settings)
    }
  ),
  invalidateCache: spyOn(StorageService, 'invalidateCache').mockImplementation(() => {}),
  migrateStorage: spyOn(StorageService, 'migrateStorage').mockImplementation(async () => {}),
}

const mockChromeService = {
  // Matches ChromeService.sendMessage's signature: (message) => Promise<void>.
  sendMessage: spyOn(ChromeService, 'sendMessage').mockImplementation(async (msg) => {
    sentMessages.push(msg as { type: string; [k: string]: unknown })
  }),
}

const generateSpy = spyOn(PACScriptGenerator, 'generate').mockImplementation(
  () => 'function FindProxyForURL(){return "DIRECT";}'
)

afterAll(() => {
  mockStorageService.getSettings.mockRestore()
  mockStorageService.saveSettings.mockRestore()
  mockStorageService.invalidateCache.mockRestore()
  mockStorageService.migrateStorage.mockRestore()
  mockChromeService.sendMessage.mockRestore()
  generateSpy.mockRestore()
})

// ---- Helpers --------------------------------------------------------------
function makeProxy(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    id: crypto.randomUUID(),
    name: 'Proxy',
    color: '#3b82f6',
    isActive: false,
    mode: 'fixed_servers',
    quickSwitch: false,
    ...overrides,
  }
}

/** Seed the store + backing storage with a known set of configs. */
async function seed(settings: Partial<AppSettings>): Promise<void> {
  mockStored = { ...DEFAULT_SETTINGS, ...settings }
  await settingsStore.load()
}

const flushDebounce = () => new Promise((r) => setTimeout(r, 600))

beforeEach(async () => {
  mockStored = { ...DEFAULT_SETTINGS, proxyConfigs: [] }
  savedSettings = null
  sentMessages.length = 0
  mockStorageService.getSettings.mockClear()
  mockStorageService.saveSettings.mockClear()
  mockStorageService.invalidateCache.mockClear()
  mockStorageService.migrateStorage.mockClear()
  mockChromeService.sendMessage.mockClear()
  // Reset the singleton's in-memory state to defaults before each test.
  await settingsStore.load()
})

describe('settingsStore.load', () => {
  test('loads settings from storage into the store', async () => {
    mockStored = { ...DEFAULT_SETTINGS, quickSwitchEnabled: true, viewMode: 'list' }
    await settingsStore.load()

    const state = get(settingsStore)
    expect(state.quickSwitchEnabled).toBe(true)
    expect(state.viewMode).toBe('list')
  })
})

describe('settingsStore.init', () => {
  test('migrates, invalidates cache, then loads', async () => {
    mockStored = { ...DEFAULT_SETTINGS, proxyConfigs: [makeProxy({ name: 'A' })] }
    await settingsStore.init()

    expect(mockStorageService.migrateStorage).toHaveBeenCalled()
    expect(mockStorageService.invalidateCache).toHaveBeenCalled()
    expect(get(settingsStore).proxyConfigs).toHaveLength(1)
  })
})

describe('settingsStore.updateSettings', () => {
  test('merges partial settings into store state immediately', async () => {
    await settingsStore.updateSettings({ viewMode: 'list', showQuickSettings: false })

    const state = get(settingsStore)
    expect(state.viewMode).toBe('list')
    expect(state.showQuickSettings).toBe(false)
    // unrelated keys preserved
    expect(state.autoReloadOnProxySwitch).toBe(DEFAULT_SETTINGS.autoReloadOnProxySwitch)
  })

  test('persists via a debounced save', async () => {
    await settingsStore.updateSettings({ disableProxyOnStartup: true })
    // Not necessarily saved yet (debounced)…
    await flushDebounce()
    expect(savedSettings?.disableProxyOnStartup).toBe(true)
  })
})

describe('settingsStore.updatePACScript', () => {
  test('adds a new proxy config when scriptId is null', async () => {
    await settingsStore.updatePACScript(
      { name: 'New', color: '#000', isActive: false, mode: 'direct' },
      null
    )

    const configs = get(settingsStore).proxyConfigs
    expect(configs).toHaveLength(1)
    expect(configs[0].name).toBe('New')
    expect(configs[0].id).toBeTruthy()
    // immediate (non-debounced) save for critical proxy ops
    expect(savedSettings?.proxyConfigs).toHaveLength(1)
    expect(sentMessages.some((m) => m.type === 'SCRIPT_UPDATE')).toBe(true)
  })

  test('updates an existing proxy config when scriptId is provided', async () => {
    const existing = makeProxy({ name: 'Old', mode: 'direct' })
    await seed({ proxyConfigs: [existing] })

    await settingsStore.updatePACScript(
      { name: 'Renamed', color: existing.color, isActive: false, mode: 'direct' },
      existing.id as string
    )

    const configs = get(settingsStore).proxyConfigs
    expect(configs).toHaveLength(1)
    expect(configs[0].id).toBe(existing.id as string)
    expect(configs[0].name).toBe('Renamed')
  })

  test('re-applies PAC when editing a proxy referenced by the active Auto-Proxy', async () => {
    const upstream = makeProxy({ name: 'Upstream', mode: 'fixed_servers' })
    const auto = makeProxy({
      name: 'Auto',
      mode: 'pac_script',
      isActive: true,
      autoProxy: {
        rules: [
          {
            id: 'r1',
            pattern: '*.example.com',
            matchType: 'wildcard',
            proxyType: 'existing',
            proxyId: upstream.id,
            enabled: true,
            priority: 0,
          },
        ],
        fallbackType: 'direct',
      },
    })
    await seed({ proxyConfigs: [upstream, auto], activeScriptId: auto.id as string })

    await settingsStore.updatePACScript(
      { name: 'Upstream', color: upstream.color, isActive: false, mode: 'fixed_servers' },
      upstream.id as string
    )

    // Should regenerate + push SET_PROXY for the active Auto-Proxy
    expect(sentMessages.some((m) => m.type === 'SET_PROXY')).toBe(true)
  })
})

describe('settingsStore.deletePACScript', () => {
  test('removes the proxy config', async () => {
    const a = makeProxy({ name: 'A' })
    const b = makeProxy({ name: 'B' })
    await seed({ proxyConfigs: [a, b] })

    await settingsStore.deletePACScript(a.id as string)

    const configs = get(settingsStore).proxyConfigs
    expect(configs).toHaveLength(1)
    expect(configs[0].id).toBe(b.id as string)
  })

  test('clears activeScriptId and Chrome proxy when deleting the active proxy', async () => {
    const active = makeProxy({ name: 'Active', isActive: true })
    await seed({ proxyConfigs: [active], activeScriptId: active.id as string })

    await settingsStore.deletePACScript(active.id as string)

    expect(get(settingsStore).activeScriptId).toBeNull()
    expect(sentMessages.some((m) => m.type === 'CLEAR_PROXY')).toBe(true)
  })

  test('does not send CLEAR_PROXY when deleting a non-active proxy', async () => {
    const active = makeProxy({ name: 'Active', isActive: true })
    const other = makeProxy({ name: 'Other' })
    await seed({ proxyConfigs: [active, other], activeScriptId: active.id as string })

    await settingsStore.deletePACScript(other.id as string)

    expect(sentMessages.some((m) => m.type === 'CLEAR_PROXY')).toBe(false)
  })

  test('cascades cleanup of Auto-Proxy rules referencing the deleted proxy', async () => {
    const upstream = makeProxy({ name: 'Upstream' })
    const auto = makeProxy({
      name: 'Auto',
      mode: 'pac_script',
      autoProxy: {
        rules: [
          {
            id: 'r1',
            pattern: '*.a.com',
            matchType: 'wildcard',
            proxyType: 'existing',
            proxyId: upstream.id,
            enabled: true,
            priority: 0,
          },
          {
            id: 'r2',
            pattern: '*.b.com',
            matchType: 'wildcard',
            proxyType: 'direct',
            enabled: true,
            priority: 1,
          },
        ],
        fallbackType: 'existing',
        fallbackProxyId: upstream.id,
      },
    })
    await seed({ proxyConfigs: [upstream, auto] })

    await settingsStore.deletePACScript(upstream.id as string)

    const remaining = get(settingsStore).proxyConfigs.find((c) => c.name === 'Auto')
    expect(remaining?.autoProxy?.rules).toHaveLength(1)
    expect(remaining?.autoProxy?.rules[0].id).toBe('r2')
    // priorities recalculated to be contiguous from 0
    expect(remaining?.autoProxy?.rules[0].priority).toBe(0)
    // dangling fallback reset to direct
    expect(remaining?.autoProxy?.fallbackType).toBe('direct')
    expect(remaining?.autoProxy?.fallbackProxyId).toBeUndefined()
  })
})

describe('settingsStore.setProxy', () => {
  test('activating a proxy deactivates all others and sets activeScriptId', async () => {
    const a = makeProxy({ name: 'A', isActive: true })
    const b = makeProxy({ name: 'B' })
    await seed({ proxyConfigs: [a, b], activeScriptId: a.id as string })

    await settingsStore.setProxy(b.id as string, true)

    const state = get(settingsStore)
    expect(state.activeScriptId).toBe(b.id as string)
    expect(state.proxyConfigs.find((p) => p.id === a.id)?.isActive).toBe(false)
    expect(state.proxyConfigs.find((p) => p.id === b.id)?.isActive).toBe(true)
    expect(sentMessages.some((m) => m.type === 'SET_PROXY')).toBe(true)
  })

  test('deactivating a proxy clears activeScriptId and sends CLEAR_PROXY', async () => {
    const a = makeProxy({ name: 'A', isActive: true })
    await seed({ proxyConfigs: [a], activeScriptId: a.id as string })

    await settingsStore.setProxy(a.id as string, false)

    const state = get(settingsStore)
    expect(state.activeScriptId).toBeNull()
    expect(state.proxyConfigs[0].isActive).toBe(false)
    expect(sentMessages.some((m) => m.type === 'CLEAR_PROXY')).toBe(true)
  })

  test('only one proxy is ever active at a time', async () => {
    const a = makeProxy({ name: 'A' })
    const b = makeProxy({ name: 'B' })
    const c = makeProxy({ name: 'C' })
    await seed({ proxyConfigs: [a, b, c] })

    await settingsStore.setProxy(a.id as string, true)
    await settingsStore.setProxy(c.id as string, true)

    const active = get(settingsStore).proxyConfigs.filter((p) => p.isActive)
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe(c.id as string)
  })

  test('serializes concurrent proxy changes (mutex) — last write wins', async () => {
    const a = makeProxy({ name: 'A' })
    const b = makeProxy({ name: 'B' })
    await seed({ proxyConfigs: [a, b] })

    await Promise.all([
      settingsStore.setProxy(a.id as string, true),
      settingsStore.setProxy(b.id as string, true),
    ])

    const active = get(settingsStore).proxyConfigs.filter((p) => p.isActive)
    expect(active).toHaveLength(1)
  })

  test('generates a PAC script when activating an Auto-Proxy config', async () => {
    const auto = makeProxy({
      name: 'Auto',
      mode: 'pac_script',
      autoProxy: { rules: [], fallbackType: 'direct' },
    })
    await seed({ proxyConfigs: [auto] })

    await settingsStore.setProxy(auto.id as string, true)

    const setProxyMsg = sentMessages.find((m) => m.type === 'SET_PROXY') as
      | { proxy: ProxyConfig }
      | undefined
    expect(setProxyMsg?.proxy.mode).toBe('pac_script')
    expect(setProxyMsg?.proxy.pacScript?.data).toContain('FindProxyForURL')
  })
})

describe('settingsStore.quickSwitchToggle', () => {
  test('updates quickSwitchEnabled and notifies background', async () => {
    await settingsStore.quickSwitchToggle(true)

    expect(get(settingsStore).quickSwitchEnabled).toBe(true)
    expect(sentMessages.some((m) => m.type === 'QUICK_SWITCH' && m.enabled === true)).toBe(true)
  })
})

describe('settingsStore.updateScriptQuickSwitch', () => {
  test('flips a single config quickSwitch flag', async () => {
    const a = makeProxy({ name: 'A', quickSwitch: false })
    await seed({ proxyConfigs: [a] })

    await settingsStore.updateScriptQuickSwitch(a.id as string, true)

    expect(get(settingsStore).proxyConfigs[0].quickSwitch).toBe(true)
    expect(sentMessages.some((m) => m.type === 'SCRIPT_UPDATE')).toBe(true)
  })

  test('is a no-op when scriptId is empty', async () => {
    const a = makeProxy({ name: 'A' })
    await seed({ proxyConfigs: [a] })
    sentMessages.length = 0

    await settingsStore.updateScriptQuickSwitch('', true)

    expect(sentMessages).toHaveLength(0)
  })
})

describe('derived stores', () => {
  test('quickSwitchScripts reflects only configs with quickSwitch=true', async () => {
    const a = makeProxy({ name: 'A', quickSwitch: true })
    const b = makeProxy({ name: 'B', quickSwitch: false })
    const c = makeProxy({ name: 'C', quickSwitch: true })
    await seed({ proxyConfigs: [a, b, c] })

    const quick = get(settingsStore.quickSwitchScripts)
    expect(quick.map((p) => p.name).sort()).toEqual(['A', 'C'])
  })

  test('activeScript reflects the currently active config and updates on change', async () => {
    const a = makeProxy({ name: 'A' })
    const b = makeProxy({ name: 'B' })
    await seed({ proxyConfigs: [a, b] })

    expect(get(settingsStore.activeScript)).toBeNull()

    await settingsStore.setProxy(b.id as string, true)
    expect(get(settingsStore.activeScript)?.id).toBe(b.id as string)

    await settingsStore.setProxy(b.id as string, false)
    expect(get(settingsStore.activeScript)).toBeNull()
  })
})

describe('settingsStore.reconcileActiveProxy', () => {
  test('sends SET_PROXY for the persisted active proxy', async () => {
    const active = makeProxy({ name: 'Active', isActive: true })
    await seed({ proxyConfigs: [active], activeScriptId: active.id as string })
    sentMessages.length = 0

    await settingsStore.reconcileActiveProxy()

    expect(sentMessages.some((m) => m.type === 'SET_PROXY')).toBe(true)
  })

  test('sends CLEAR_PROXY when no proxy is active', async () => {
    await seed({ proxyConfigs: [makeProxy({ name: 'Idle' })] })
    sentMessages.length = 0

    await settingsStore.reconcileActiveProxy()

    expect(sentMessages.some((m) => m.type === 'CLEAR_PROXY')).toBe(true)
  })
})

describe('settingsStore.reloadSettings', () => {
  test('invalidates cache and re-reads storage', async () => {
    mockStored = { ...DEFAULT_SETTINGS, proxyConfigs: [makeProxy({ name: 'Fresh' })] }

    await settingsStore.reloadSettings()

    expect(mockStorageService.invalidateCache).toHaveBeenCalled()
    expect(get(settingsStore).proxyConfigs[0].name).toBe('Fresh')
  })
})
