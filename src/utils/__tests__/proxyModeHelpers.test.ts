import { beforeAll, describe, expect, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'

// I18nService.getMessage delegates to chrome.i18n; provide an echo-the-key
// stub on the global chrome mock so these tests stay browser-free and assert
// on branching logic, not translations. We set chrome.i18n directly (rather
// than mock.module) so we don't leak a partial I18nService into other files.
beforeAll(() => {
  globalThis.chrome = {
    ...globalThis.chrome,
    i18n: {
      getMessage: (key: string) => key,
      getUILanguage: () => 'en',
    },
  } as unknown as typeof chrome
})

import {
  buildAutoProxyReferenceMap,
  findAutoProxyReferences,
  getProxyCardLabel,
  getProxyDescription,
  getProxyModeColor,
  getProxyModeIcon,
  getProxyModeLabel,
  isAutoProxy,
  isOrphanedRule,
  isProxyReferencedByAutoProxy,
  resolveSavedProxyId,
} from '../proxyModeHelpers'

type ProxyMode = ProxyConfig['mode']
const ALL_MODES: ProxyMode[] = ['system', 'direct', 'auto_detect', 'pac_script', 'fixed_servers']

function autoRule(overrides: Partial<NonNullable<ProxyConfig['autoProxy']>['rules'][number]> = {}) {
  return {
    id: 'r',
    pattern: '*.example.com',
    matchType: 'wildcard' as const,
    proxyType: 'direct' as const,
    enabled: true,
    priority: 0,
    ...overrides,
  }
}

function autoConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    id: 'auto-1',
    name: 'Smart',
    color: '#000',
    isActive: false,
    mode: 'pac_script',
    autoProxy: { rules: [], fallbackType: 'direct' },
    ...overrides,
  }
}

function settingsWith(configs: ProxyConfig[]): AppSettings {
  return { ...DEFAULT_SETTINGS, proxyConfigs: configs }
}

function config(overrides: Partial<ProxyConfig>): ProxyConfig {
  return {
    id: 'x',
    name: 'P',
    color: '#000',
    isActive: false,
    mode: 'fixed_servers',
    ...overrides,
  }
}

describe('getProxyDescription — fixed_servers', () => {
  test('renders host:port when a single proxy host is set', () => {
    const c = config({
      rules: { singleProxy: { scheme: 'http', host: '10.0.0.1', port: '8080' } },
    })
    expect(getProxyDescription('fixed_servers', c)).toBe('10.0.0.1:8080')
  })

  test('falls back to a label (never a bare ":") when host is empty', () => {
    const c = config({
      rules: { singleProxy: { scheme: 'http', host: '', port: '' } },
    })
    const desc = getProxyDescription('fixed_servers', c)
    expect(desc).not.toBe(':')
    expect(desc).toBe('manualProxyNotConfigured')
  })

  test('falls back to a label when there are no rules at all', () => {
    expect(getProxyDescription('fixed_servers', config({}))).toBe('manualProxyNotConfigured')
  })

  test('uses proxyForHttp when singleProxy is absent', () => {
    const c = config({
      rules: { proxyForHttp: { scheme: 'http', host: 'proxy.corp', port: '3128' } },
    })
    expect(getProxyDescription('fixed_servers', c)).toBe('proxy.corp:3128')
  })
})

describe('getProxyDescription — pac_script', () => {
  test('shows the URL when configured', () => {
    const c = config({ mode: 'pac_script', pacScript: { url: 'https://x/p.pac' } })
    expect(getProxyDescription('pac_script', c)).toBe('https://x/p.pac')
  })

  test('falls back to a label when only inline data (no url)', () => {
    const c = config({ mode: 'pac_script', pacScript: { data: 'function(){}' } })
    expect(getProxyDescription('pac_script', c)).toBe('pacScriptConfigured')
  })
})

describe('resolveSavedProxyId (Save & Turn On activation target)', () => {
  test('returns the editing id directly on edit', () => {
    expect(resolveSavedProxyId('edit-id', settingsWith([]), 'Anything')).toBe('edit-id')
  })

  test('finds the freshly-created config by name on create', () => {
    const s = settingsWith([config({ id: 'new-1', name: 'Work proxy' })])
    expect(resolveSavedProxyId(null, s, 'Work proxy')).toBe('new-1')
  })

  test('returns null when no config matches the name', () => {
    const s = settingsWith([config({ id: 'a', name: 'Other' })])
    expect(resolveSavedProxyId(null, s, 'Missing')).toBeNull()
  })

  test('returns null when settings are missing', () => {
    expect(resolveSavedProxyId(null, null, 'Work proxy')).toBeNull()
    expect(resolveSavedProxyId(null, undefined, 'Work proxy')).toBeNull()
  })
})

describe('isAutoProxy', () => {
  test('true when an autoProxy block is present', () => {
    expect(isAutoProxy(autoConfig())).toBe(true)
  })

  test('false for a plain config without autoProxy', () => {
    expect(isAutoProxy(config({}))).toBe(false)
  })
})

describe('getProxyModeLabel', () => {
  test('returns the auto-proxy label for an auto-proxy config (ignores mode)', () => {
    expect(getProxyModeLabel('fixed_servers', autoConfig())).toBe('autoProxyMode')
  })

  test('maps each mode to its i18n key when not an auto-proxy', () => {
    expect(getProxyModeLabel('system')).toBe('systemMode')
    expect(getProxyModeLabel('direct')).toBe('directMode')
    expect(getProxyModeLabel('auto_detect')).toBe('autoDetectMode')
    expect(getProxyModeLabel('pac_script')).toBe('pacScriptMode')
    expect(getProxyModeLabel('fixed_servers')).toBe('manualMode')
  })

  test('falls back to the raw mode for an unknown mode', () => {
    expect(getProxyModeLabel('mystery' as ProxyMode)).toBe('mystery')
  })

  test('uses mode labels when a non-auto config is passed', () => {
    expect(getProxyModeLabel('direct', config({ mode: 'direct' }))).toBe('directMode')
  })
})

describe('getProxyCardLabel', () => {
  test('returns the routing label for an auto-proxy config', () => {
    expect(getProxyCardLabel('fixed_servers', autoConfig())).toBe('cardModeRouting')
  })

  test('maps each mode to its (card-friendly) i18n key', () => {
    expect(getProxyCardLabel('system')).toBe('systemMode')
    expect(getProxyCardLabel('direct')).toBe('directMode')
    expect(getProxyCardLabel('auto_detect')).toBe('cardModeAutoDetect')
    expect(getProxyCardLabel('pac_script')).toBe('pacScriptMode')
    expect(getProxyCardLabel('fixed_servers')).toBe('cardModeManual')
  })

  test('falls back to the raw mode for an unknown mode', () => {
    expect(getProxyCardLabel('weird' as ProxyMode)).toBe('weird')
  })
})

describe('getProxyModeIcon', () => {
  test('returns a defined component for every known mode', () => {
    for (const mode of ALL_MODES) {
      expect(getProxyModeIcon(mode)).toBeDefined()
    }
  })

  test('returns a defined component for an unknown mode (fallback)', () => {
    expect(getProxyModeIcon('???' as ProxyMode)).toBeDefined()
  })

  test('auto-proxy icon differs from a regular mode icon', () => {
    const auto = getProxyModeIcon('pac_script', autoConfig())
    const plain = getProxyModeIcon('pac_script')
    expect(auto).toBeDefined()
    expect(auto).not.toBe(plain)
  })
})

describe('getProxyModeColor', () => {
  test('returns the distinct auto-proxy palette for an auto-proxy config', () => {
    const c = getProxyModeColor('fixed_servers', autoConfig())
    expect(c.bg).toContain('orange')
    expect(c.text).toContain('orange')
    expect(c.border).toContain('orange')
  })

  test('returns a {bg,text,border} triple for every known mode', () => {
    for (const mode of ALL_MODES) {
      const c = getProxyModeColor(mode)
      expect(typeof c.bg).toBe('string')
      expect(typeof c.text).toBe('string')
      expect(typeof c.border).toBe('string')
      expect(c.bg.length).toBeGreaterThan(0)
    }
  })

  test('falls back to the slate palette for an unknown mode', () => {
    const c = getProxyModeColor('unknown' as ProxyMode)
    expect(c.bg).toContain('slate')
  })
})

describe('findAutoProxyReferences', () => {
  const target = config({ id: 'target', name: 'Target' })

  test('counts rules that reference the proxy id', () => {
    const auto = autoConfig({
      name: 'Router',
      autoProxy: {
        rules: [
          autoRule({ id: 'a', proxyType: 'existing', proxyId: 'target' }),
          autoRule({ id: 'b', proxyType: 'existing', proxyId: 'target' }),
          autoRule({ id: 'c', proxyType: 'existing', proxyId: 'other' }),
          autoRule({ id: 'd', proxyType: 'direct' }),
        ],
        fallbackType: 'direct',
      },
    })
    const refs = findAutoProxyReferences('target', [target, auto])
    expect(refs).toHaveLength(1)
    expect(refs[0].configName).toBe('Router')
    expect(refs[0].ruleCount).toBe(2)
  })

  test('counts a fallback reference to the proxy id', () => {
    const auto = autoConfig({
      name: 'FallbackRouter',
      autoProxy: { rules: [], fallbackType: 'existing', fallbackProxyId: 'target' },
    })
    const refs = findAutoProxyReferences('target', [auto])
    expect(refs).toHaveLength(1)
    expect(refs[0].ruleCount).toBe(1)
  })

  test('combines rule and fallback references', () => {
    const auto = autoConfig({
      autoProxy: {
        rules: [autoRule({ id: 'a', proxyType: 'existing', proxyId: 'target' })],
        fallbackType: 'existing',
        fallbackProxyId: 'target',
      },
    })
    expect(findAutoProxyReferences('target', [auto])[0].ruleCount).toBe(2)
  })

  test('ignores non-auto configs and auto configs without references', () => {
    const plain = config({ id: 'p' })
    const emptyAuto = autoConfig({ autoProxy: { rules: [], fallbackType: 'direct' } })
    expect(findAutoProxyReferences('target', [plain, emptyAuto])).toHaveLength(0)
  })
})

describe('buildAutoProxyReferenceMap', () => {
  test('aggregates references per proxy id across configs', () => {
    const a = autoConfig({
      id: 'auto-a',
      name: 'A',
      autoProxy: {
        rules: [
          autoRule({ id: '1', proxyType: 'existing', proxyId: 'p1' }),
          autoRule({ id: '2', proxyType: 'existing', proxyId: 'p1' }),
          autoRule({ id: '3', proxyType: 'existing', proxyId: 'p2' }),
        ],
        fallbackType: 'existing',
        fallbackProxyId: 'p2',
      },
    })
    const b = autoConfig({
      id: 'auto-b',
      name: 'B',
      autoProxy: {
        rules: [autoRule({ id: '4', proxyType: 'existing', proxyId: 'p1' })],
        fallbackType: 'direct',
      },
    })
    const plain = config({ id: 'p1' })
    const map = buildAutoProxyReferenceMap([a, b, plain])

    const p1 = map.get('p1')
    expect(p1).toBeDefined()
    // A contributes 2 (rules), B contributes 1 (rule) => two entries.
    expect(p1).toHaveLength(2)
    expect(p1?.find((r) => r.configName === 'A')?.ruleCount).toBe(2)
    expect(p1?.find((r) => r.configName === 'B')?.ruleCount).toBe(1)

    const p2 = map.get('p2')
    // A references p2 once via rule + once via fallback => 2.
    expect(p2?.[0].ruleCount).toBe(2)
  })

  test('skips rules without a proxyId and non-auto configs', () => {
    const a = autoConfig({
      autoProxy: {
        rules: [
          autoRule({ id: '1', proxyType: 'existing' }), // no proxyId
          autoRule({ id: '2', proxyType: 'direct' }),
        ],
        fallbackType: 'direct',
      },
    })
    const map = buildAutoProxyReferenceMap([a, config({ id: 'plain' })])
    expect(map.size).toBe(0)
  })

  test('returns an empty map when there are no auto configs', () => {
    expect(buildAutoProxyReferenceMap([config({}), config({})]).size).toBe(0)
  })
})

describe('isProxyReferencedByAutoProxy', () => {
  test('true when at least one auto config references the proxy', () => {
    const auto = autoConfig({
      autoProxy: {
        rules: [autoRule({ id: '1', proxyType: 'existing', proxyId: 'target' })],
        fallbackType: 'direct',
      },
    })
    expect(isProxyReferencedByAutoProxy('target', [auto])).toBe(true)
  })

  test('false when no auto config references the proxy', () => {
    expect(isProxyReferencedByAutoProxy('target', [autoConfig(), config({})])).toBe(false)
  })
})

describe('isOrphanedRule', () => {
  const configs = [config({ id: 'exists' })]

  test('false for non-existing proxyType rules', () => {
    expect(isOrphanedRule({ proxyType: 'direct' }, configs)).toBe(false)
    expect(isOrphanedRule({ proxyType: 'inline' }, configs)).toBe(false)
  })

  test('false when proxyType is existing but proxyId is missing', () => {
    expect(isOrphanedRule({ proxyType: 'existing' }, configs)).toBe(false)
  })

  test('false when the referenced proxy still exists', () => {
    expect(isOrphanedRule({ proxyType: 'existing', proxyId: 'exists' }, configs)).toBe(false)
  })

  test('true when the referenced proxy no longer exists', () => {
    expect(isOrphanedRule({ proxyType: 'existing', proxyId: 'gone' }, configs)).toBe(true)
  })
})
