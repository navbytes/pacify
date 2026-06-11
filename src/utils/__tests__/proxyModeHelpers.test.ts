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

import { getProxyDescription, resolveSavedProxyId } from '../proxyModeHelpers'

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
