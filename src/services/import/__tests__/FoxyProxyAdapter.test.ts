import { describe, expect, test } from 'bun:test'
import { FoxyProxyAdapter } from '../adapters/FoxyProxyAdapter'

describe('FoxyProxyAdapter', () => {
  test('maps a basic 7.x proxy entry to a fixed_servers config', () => {
    const { configs } = FoxyProxyAdapter.map([
      { title: 'Office', type: 'http', address: '10.0.0.1', port: 3128, color: '#112233' },
    ])
    expect(configs).toHaveLength(1)
    expect(configs[0].name).toBe('Office')
    expect(configs[0].color).toBe('#112233')
    expect(configs[0].mode).toBe('fixed_servers')
    expect(configs[0].rules?.singleProxy).toEqual({
      scheme: 'http',
      host: '10.0.0.1',
      port: '3128',
    })
  })

  test('imports credentials and warns', () => {
    const { configs, report } = FoxyProxyAdapter.map([
      { title: 'Auth', type: 'socks5', address: 'h', port: 1080, username: 'u', password: 'p' },
    ])
    expect(configs[0].rules?.singleProxy?.username).toBe('u')
    expect(report.warnings.some((w) => w.message.includes('credentials'))).toBe(true)
  })

  test('converts whitePatterns into an Auto-Proxy config routed to the proxy', () => {
    const { configs, report } = FoxyProxyAdapter.map([
      {
        title: 'Routed',
        type: 'http',
        address: 'p',
        port: 8080,
        whitePatterns: [
          { pattern: '*://*.example.com/*', type: 1, active: true },
          { pattern: '*://disabled.com/*', type: 1, active: false },
        ],
      },
    ])

    const fixed = configs.find((c) => c.mode === 'fixed_servers')
    const auto = configs.find((c) => c.mode === 'pac_script')
    expect(auto?.name).toBe('Routed (rules)')
    expect(auto?.autoProxy?.rules).toHaveLength(1)
    const rule = auto?.autoProxy?.rules[0]
    expect(rule?.pattern).toBe('*.example.com')
    expect(rule?.matchType).toBe('wildcard')
    expect(rule?.proxyType).toBe('existing')
    expect(rule?.proxyId).toBe(fixed?.id)
    expect(report.ruleCount).toBe(1)
  })

  test('maps blackPatterns to the proxy bypass list', () => {
    const { configs } = FoxyProxyAdapter.map([
      {
        title: 'WithBypass',
        type: 'http',
        address: 'p',
        port: 8080,
        blackPatterns: [{ pattern: '*://*.internal.net/*', type: 1, active: true }],
      },
    ])
    const fixed = configs.find((c) => c.mode === 'fixed_servers')
    expect(fixed?.rules?.bypassList).toContain('*.internal.net')
  })

  test('keeps regex patterns as regex match type', () => {
    const { configs } = FoxyProxyAdapter.map([
      {
        title: 'Rx',
        type: 'http',
        address: 'p',
        port: 8080,
        whitePatterns: [{ pattern: '^https?://.*\\.dev/', type: 2, active: true }],
      },
    ])
    const auto = configs.find((c) => c.mode === 'pac_script')
    expect(auto?.autoProxy?.rules[0].matchType).toBe('regex')
  })

  test('maps direct/system type entries to modes', () => {
    const { configs } = FoxyProxyAdapter.map([
      { title: 'Direct', type: 'direct' },
      { title: 'System', type: 'system' },
    ])
    expect(configs.find((c) => c.name === 'Direct')?.mode).toBe('direct')
    expect(configs.find((c) => c.name === 'System')?.mode).toBe('system')
  })

  test('reads the wrapped { proxies: [...] } form', () => {
    const { configs } = FoxyProxyAdapter.map({
      proxies: [{ title: 'P', type: 'https', address: 'h', port: 443 }],
    })
    expect(configs[0].rules?.singleProxy?.scheme).toBe('https')
  })

  test('reads legacy { settings: { proxies: { all: [...] } } }', () => {
    const { configs } = FoxyProxyAdapter.map({
      settings: { proxies: { all: [{ type: 'http', address: 'h', port: 80 }] } },
    })
    expect(configs).toHaveLength(1)
  })

  test('skips entries with no host', () => {
    const { configs, report } = FoxyProxyAdapter.map([{ title: 'Broken', type: 'http' }])
    expect(configs).toHaveLength(0)
    expect(report.warnings.some((w) => w.level === 'skipped')).toBe(true)
  })

  test('handles empty input', () => {
    expect(FoxyProxyAdapter.map([]).configs).toHaveLength(0)
    expect(FoxyProxyAdapter.map(null).configs).toHaveLength(0)
  })
})
