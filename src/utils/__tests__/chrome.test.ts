import { describe, expect, test } from 'bun:test'
import type { ProxyConfig } from '@/interfaces'
import { convertAppSettingsToChromeConfig } from '../chrome'

function cfg(overrides: Partial<ProxyConfig>): ProxyConfig {
  return {
    id: 'x',
    name: 'P',
    color: '#000',
    isActive: true,
    mode: 'fixed_servers',
    ...overrides,
  }
}

describe('convertAppSettingsToChromeConfig', () => {
  test('direct mode produces a bare direct config', () => {
    expect(convertAppSettingsToChromeConfig(cfg({ mode: 'direct' }))).toEqual({ mode: 'direct' })
  })

  test('system / auto_detect modes carry no extra rules', () => {
    expect(convertAppSettingsToChromeConfig(cfg({ mode: 'system' }))).toEqual({ mode: 'system' })
    expect(convertAppSettingsToChromeConfig(cfg({ mode: 'auto_detect' }))).toEqual({
      mode: 'auto_detect',
    })
  })

  test('pac_script mode includes url/data/mandatory', () => {
    const result = convertAppSettingsToChromeConfig(
      cfg({ mode: 'pac_script', pacScript: { url: 'https://x/p.pac', mandatory: true } })
    )
    expect(result.mode).toBe('pac_script')
    expect(result.pacScript).toEqual({ url: 'https://x/p.pac', data: '', mandatory: true })
  })

  test('fixed_servers with a single shared proxy maps host/port/scheme', () => {
    const result = convertAppSettingsToChromeConfig(
      cfg({ rules: { singleProxy: { scheme: 'socks5', host: '10.0.0.1', port: '1080' } } })
    )
    expect(result.rules?.singleProxy).toEqual({ scheme: 'socks5', host: '10.0.0.1', port: '1080' })
  })

  // Regression: bypassList used to be applied only in the per-protocol branch,
  // so a single shared proxy silently ignored it (bypass never took effect).
  test('bypassList is preserved alongside a single shared proxy', () => {
    const result = convertAppSettingsToChromeConfig(
      cfg({
        rules: {
          singleProxy: { scheme: 'http', host: '127.0.0.1', port: '8080' },
          bypassList: ['example.com', '<local>'],
        },
      })
    )
    expect(result.rules?.singleProxy).toBeDefined()
    expect(result.rules?.bypassList).toEqual(['example.com', '<local>'])
  })

  test('bypassList is preserved with per-protocol proxies', () => {
    const result = convertAppSettingsToChromeConfig(
      cfg({
        rules: {
          proxyForHttp: { scheme: 'http', host: 'p1', port: '80' },
          proxyForHttps: { scheme: 'http', host: 'p2', port: '443' },
          bypassList: ['intranet'],
        },
      })
    )
    expect(result.rules?.proxyForHttp).toEqual({ scheme: 'http', host: 'p1', port: '80' })
    expect(result.rules?.bypassList).toEqual(['intranet'])
  })

  test('an empty bypassList is omitted (no empty key sent to Chrome)', () => {
    const result = convertAppSettingsToChromeConfig(
      cfg({ rules: { singleProxy: { scheme: 'http', host: 'h', port: '1' }, bypassList: [] } })
    )
    expect(result.rules?.bypassList).toBeUndefined()
  })
})
