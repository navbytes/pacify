import { describe, expect, test } from 'bun:test'
import type { AutoProxyRule, AutoProxySubscription, ProxyConfig } from '@/interfaces'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'

const proxy: ProxyConfig = {
  id: 'p1',
  name: 'Proxy',
  color: '#000',
  isActive: false,
  mode: 'fixed_servers',
  rules: { singleProxy: { scheme: 'http', host: 'gw', port: '8080' } },
}

const rule: AutoProxyRule = {
  id: 'r1',
  pattern: '*.example.com',
  matchType: 'wildcard',
  proxyType: 'existing',
  proxyId: 'p1',
  enabled: true,
  priority: 0,
}

describe('PACScriptGenerator.testUrl with subscriptions + fallback', () => {
  test('matches an inline rule (source: rule)', () => {
    const r = PACScriptGenerator.testUrl('https://www.example.com', [rule], [proxy])
    expect(r.matched).toBe(true)
    expect(r.source).toBe('rule')
  })

  test('matches a subscription cached rule when no inline rule matches', () => {
    const sub: AutoProxySubscription = {
      id: 's1',
      name: 'List',
      url: '',
      format: 'abp',
      enabled: true,
      proxyType: 'existing',
      proxyId: 'p1',
      updateInterval: 0,
      cachedRules: ['*.blocked.com'],
    }
    const r = PACScriptGenerator.testUrl('https://x.blocked.com', [rule], [proxy], {
      subscriptions: [sub],
      fallbackType: 'direct',
    })
    expect(r.matched).toBe(true)
    expect(r.source).toBe('subscription')
    expect(r.proxyResult).toContain('gw:8080')
  })

  test('ignores disabled subscriptions', () => {
    const sub: AutoProxySubscription = {
      id: 's1',
      name: 'List',
      url: '',
      format: 'abp',
      enabled: false,
      proxyType: 'direct',
      updateInterval: 0,
      cachedRules: ['*.blocked.com'],
    }
    const r = PACScriptGenerator.testUrl('https://x.blocked.com', [], [proxy], {
      subscriptions: [sub],
      fallbackType: 'direct',
    })
    expect(r.matched).toBe(false)
    expect(r.source).toBe('fallback')
  })

  test('reports the configured fallback proxy when nothing matches', () => {
    const r = PACScriptGenerator.testUrl('https://nomatch.test', [rule], [proxy], {
      fallbackType: 'existing',
      fallbackProxyId: 'p1',
    })
    expect(r.matched).toBe(false)
    expect(r.source).toBe('fallback')
    expect(r.proxyResult).toContain('gw:8080')
  })

  test('defaults fallback to DIRECT with no options', () => {
    const r = PACScriptGenerator.testUrl('https://nomatch.test', [rule], [proxy])
    expect(r.matched).toBe(false)
    expect(r.proxyResult).toBe('DIRECT')
  })
})
