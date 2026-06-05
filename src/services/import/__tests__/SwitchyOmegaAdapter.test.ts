import { describe, expect, test } from 'bun:test'
import { SwitchyOmegaAdapter } from '../adapters/SwitchyOmegaAdapter'

describe('SwitchyOmegaAdapter', () => {
  test('maps a FixedProfile with a single fallback proxy', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      schemaVersion: 2,
      '+work': {
        profileType: 'FixedProfile',
        name: 'work',
        color: '#99ccee',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 },
        bypassList: [
          { conditionType: 'BypassCondition', pattern: '127.0.0.1' },
          { conditionType: 'BypassCondition', pattern: '<local>' },
        ],
      },
    })

    expect(configs).toHaveLength(1)
    const config = configs[0]
    expect(config.name).toBe('work')
    expect(config.color).toBe('#99ccee')
    expect(config.mode).toBe('fixed_servers')
    expect(config.rules?.singleProxy).toEqual({ scheme: 'http', host: '127.0.0.1', port: '8080' })
    expect(config.rules?.bypassList).toContain('127.0.0.1')
  })

  test('maps per-protocol proxies separately', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+multi': {
        profileType: 'FixedProfile',
        proxyForHttp: { scheme: 'http', host: 'h1', port: 80 },
        proxyForHttps: { scheme: 'https', host: 'h2', port: 443 },
        fallbackProxy: { scheme: 'socks5', host: 'h3', port: 1080 },
      },
    })

    const rules = configs[0].rules
    expect(rules?.proxyForHttp?.host).toBe('h1')
    expect(rules?.proxyForHttps?.host).toBe('h2')
    expect(rules?.fallbackProxy?.scheme).toBe('socks5')
    expect(rules?.singleProxy).toBeUndefined()
  })

  test('maps a PacProfile with a URL', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+pac': { profileType: 'PacProfile', pacUrl: 'https://example.com/proxy.pac' },
    })
    expect(configs[0].mode).toBe('pac_script')
    expect(configs[0].pacScript?.url).toBe('https://example.com/proxy.pac')
  })

  test('maps a PacProfile with inline script', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+pac': {
        profileType: 'PacProfile',
        pacScript: 'function FindProxyForURL(u,h){return "DIRECT";}',
      },
    })
    expect(configs[0].pacScript?.data).toContain('FindProxyForURL')
  })

  test('maps a SwitchProfile and resolves rule references to fixed profiles', () => {
    const { configs, report } = SwitchyOmegaAdapter.map({
      '+proxy': {
        profileType: 'FixedProfile',
        fallbackProxy: { scheme: 'http', host: 'p', port: 8080 },
      },
      '+auto': {
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [
          {
            condition: { conditionType: 'HostWildcardCondition', pattern: '*.example.com' },
            profileName: 'proxy',
          },
          {
            condition: { conditionType: 'HostRegexCondition', pattern: '.*\\.test\\.com' },
            profileName: 'direct',
          },
        ],
      },
    })

    const proxyConfig = configs.find((c) => c.name === 'proxy')
    const switchConfig = configs.find((c) => c.name === 'auto')
    expect(switchConfig?.autoProxy?.rules).toHaveLength(2)

    const [wildcardRule, regexRule] = switchConfig?.autoProxy?.rules ?? []
    expect(wildcardRule.matchType).toBe('wildcard')
    expect(wildcardRule.pattern).toBe('*.example.com')
    expect(wildcardRule.proxyType).toBe('existing')
    expect(wildcardRule.proxyId).toBe(proxyConfig?.id)

    expect(regexRule.matchType).toBe('regex')
    expect(regexRule.proxyType).toBe('direct')

    expect(switchConfig?.autoProxy?.fallbackType).toBe('direct')
    expect(report.ruleCount).toBe(2)
  })

  test('maps IpCondition to a CIDR rule', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+auto': {
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [
          {
            condition: { conditionType: 'IpCondition', ip: '192.168.0.0', prefixLength: 16 },
            profileName: 'direct',
          },
        ],
      },
    })
    const rule = configs[0].autoProxy?.rules[0]
    expect(rule?.matchType).toBe('cidr')
    expect(rule?.pattern).toBe('192.168.0.0/16')
  })

  test('approximates KeywordCondition as a wildcard and resolves system to direct with warning', () => {
    const { configs, report } = SwitchyOmegaAdapter.map({
      '+auto': {
        profileType: 'SwitchProfile',
        defaultProfileName: 'system',
        rules: [
          {
            condition: { conditionType: 'KeywordCondition', pattern: 'ads' },
            profileName: 'direct',
          },
        ],
      },
    })
    const rule = configs[0].autoProxy?.rules[0]
    expect(rule?.pattern).toBe('*ads*')
    expect(rule?.matchType).toBe('wildcard')
    // system fallback has no equivalent → warned
    expect(report.warnings.some((w) => w.message.includes('system'))).toBe(true)
  })

  test('maps a RuleListProfile into a subscription with cached rules', () => {
    const ruleList = `[AutoProxy 0.2.9]
||blocked.com
||also-blocked.org`
    const { configs } = SwitchyOmegaAdapter.map({
      '+gfw': {
        profileType: 'RuleListProfile',
        format: 'AutoProxy',
        ruleList,
        sourceUrl: 'https://example.com/list.txt',
        matchProfileName: 'direct',
        defaultProfileName: 'direct',
      },
    })

    const sub = configs[0].autoProxy?.subscriptions?.[0]
    expect(sub?.url).toBe('https://example.com/list.txt')
    expect(sub?.cachedRules).toContain('*.blocked.com')
    expect(sub?.cachedRules).toContain('*.also-blocked.org')
    expect(sub?.format).toBe('abp')
  })

  test('maps built-in Direct and System profiles to modes', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+d': { profileType: 'DirectProfile', name: 'd' },
      '+s': { profileType: 'SystemProfile', name: 's' },
    })
    expect(configs.find((c) => c.name === 'd')?.mode).toBe('direct')
    expect(configs.find((c) => c.name === 's')?.mode).toBe('system')
  })

  test('skips unsupported profile types with a report entry', () => {
    const { configs, report } = SwitchyOmegaAdapter.map({
      '+v': { profileType: 'VirtualProfile', name: 'v' },
    })
    expect(configs).toHaveLength(0)
    expect(report.warnings.some((w) => w.level === 'skipped')).toBe(true)
  })

  test('rejects patterns containing injection characters', () => {
    const { configs } = SwitchyOmegaAdapter.map({
      '+auto': {
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [
          {
            condition: { conditionType: 'HostWildcardCondition', pattern: '"];evil' },
            profileName: 'direct',
          },
        ],
      },
    })
    expect(configs[0].autoProxy?.rules).toHaveLength(0)
  })

  test('handles empty / invalid input gracefully', () => {
    expect(SwitchyOmegaAdapter.map(null).configs).toHaveLength(0)
    expect(SwitchyOmegaAdapter.map({}).configs).toHaveLength(0)
    expect(SwitchyOmegaAdapter.map([]).configs).toHaveLength(0)
  })
})
