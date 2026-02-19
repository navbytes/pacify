import { describe, expect, mock, test } from 'bun:test'

// Mock chrome.i18n before importing the module
mock.module('@/services/i18n/i18nService', () => ({
  I18nService: {
    getMessage: mock((_key: string) => ''),
  },
}))

import { SwitchyOmegaImporter } from '../SwitchyOmegaImporter'

describe('SwitchyOmegaImporter', () => {
  describe('convertBackup', () => {
    test('converts a FixedProfile with single proxy (fallback only)', () => {
      const backup = {
        schemaVersion: 2,
        '+my-proxy': {
          name: 'my-proxy',
          profileType: 'FixedProfile',
          color: '#99ccee',
          fallbackProxy: {
            scheme: 'socks5',
            host: '127.0.0.1',
            port: 1080,
          },
          bypassList: [
            { conditionType: 'BypassCondition', pattern: '127.0.0.1' },
            { conditionType: 'BypassCondition', pattern: 'localhost' },
          ],
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      expect(result.warnings).toHaveLength(0)

      const config = result.configs[0]
      expect(config.name).toBe('my-proxy')
      expect(config.color).toBe('#99ccee')
      expect(config.mode).toBe('fixed_servers')
      expect(config.isActive).toBe(false)
      expect(config.rules?.singleProxy?.scheme).toBe('socks5')
      expect(config.rules?.singleProxy?.host).toBe('127.0.0.1')
      expect(config.rules?.singleProxy?.port).toBe('1080')
      expect(config.rules?.bypassList).toEqual(['127.0.0.1', 'localhost'])
    })

    test('converts a FixedProfile with per-protocol proxies', () => {
      const backup = {
        schemaVersion: 2,
        '+work-proxy': {
          name: 'work-proxy',
          profileType: 'FixedProfile',
          color: '#ff5500',
          proxyForHttp: { scheme: 'http', host: 'proxy.work.com', port: 8080 },
          proxyForHttps: { scheme: 'http', host: 'proxy.work.com', port: 8443 },
          fallbackProxy: { scheme: 'socks5', host: 'socks.work.com', port: 1080 },
          bypassList: [{ conditionType: 'BypassCondition', pattern: '<local>' }],
          auth: {
            proxyForHttp: { username: 'user', password: 'pass' },
          },
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)

      const config = result.configs[0]
      expect(config.name).toBe('work-proxy')
      expect(config.mode).toBe('fixed_servers')

      // Should NOT have singleProxy since per-protocol proxies are set
      expect(config.rules?.singleProxy).toBeUndefined()

      expect(config.rules?.proxyForHttp?.scheme).toBe('http')
      expect(config.rules?.proxyForHttp?.host).toBe('proxy.work.com')
      expect(config.rules?.proxyForHttp?.port).toBe('8080')
      expect(config.rules?.proxyForHttp?.username).toBe('user')
      expect(config.rules?.proxyForHttp?.password).toBe('pass')

      expect(config.rules?.proxyForHttps?.scheme).toBe('http')
      expect(config.rules?.proxyForHttps?.port).toBe('8443')

      expect(config.rules?.fallbackProxy?.scheme).toBe('socks5')
      expect(config.rules?.bypassList).toEqual(['<local>'])
    })

    test('converts a PacProfile with URL', () => {
      const backup = {
        schemaVersion: 2,
        '+my-pac': {
          name: 'my-pac',
          profileType: 'PacProfile',
          color: '#00cccc',
          pacUrl: 'https://example.com/proxy.pac',
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)

      const config = result.configs[0]
      expect(config.name).toBe('my-pac')
      expect(config.mode).toBe('pac_script')
      expect(config.pacScript?.url).toBe('https://example.com/proxy.pac')
    })

    test('converts a PacProfile with inline script', () => {
      const backup = {
        schemaVersion: 2,
        '+inline-pac': {
          name: 'inline-pac',
          profileType: 'PacProfile',
          pacScript:
            'function FindProxyForURL(url, host) { return "PROXY proxy.example.com:8080"; }',
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)

      const config = result.configs[0]
      expect(config.mode).toBe('pac_script')
      expect(config.pacScript?.data).toContain('FindProxyForURL')
    })

    test('converts a SwitchProfile with rules', () => {
      const backup = {
        schemaVersion: 2,
        '+auto switch': {
          name: 'auto switch',
          profileType: 'SwitchProfile',
          color: '#99dd99',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: {
                conditionType: 'HostWildcardCondition',
                pattern: '*.google.com',
              },
              profileName: 'proxy',
            },
            {
              condition: {
                conditionType: 'UrlRegexCondition',
                pattern: '^https://internal\\.',
              },
              profileName: 'direct',
            },
            {
              condition: {
                conditionType: 'IpCondition',
                ip: '192.168.0.0',
                prefixLength: 16,
              },
              profileName: 'direct',
            },
          ],
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)

      const config = result.configs[0]
      expect(config.name).toBe('auto switch')
      expect(config.autoProxy).toBeDefined()
      expect(config.autoProxy?.rules).toHaveLength(3)

      const rules = config.autoProxy!.rules
      expect(rules[0].pattern).toBe('*.google.com')
      expect(rules[0].matchType).toBe('wildcard')

      expect(rules[1].pattern).toBe('^https://internal\\.')
      expect(rules[1].matchType).toBe('regex')

      expect(rules[2].pattern).toBe('192.168.0.0/16')
      expect(rules[2].matchType).toBe('cidr')
    })

    test('skips __ruleListOf_ profiles', () => {
      const backup = {
        schemaVersion: 2,
        '+__ruleListOf_auto switch': {
          name: '__ruleListOf_auto switch',
          profileType: 'RuleListProfile',
          defaultProfileName: 'direct',
          matchProfileName: 'proxy',
          format: 'AutoProxy',
          sourceUrl: 'https://example.com/rules.txt',
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)
      expect(result.configs).toHaveLength(0)
    })

    test('skips FalseCondition rules (disabled)', () => {
      const backup = {
        schemaVersion: 2,
        '+switch': {
          name: 'switch',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: {
                conditionType: 'FalseCondition',
              },
              profileName: 'proxy',
            },
            {
              condition: {
                conditionType: 'HostWildcardCondition',
                pattern: '*.example.com',
              },
              profileName: 'proxy',
            },
          ],
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      // Only the non-False rule should be converted
      expect(result.configs[0].autoProxy?.rules).toHaveLength(1)
      expect(result.configs[0].autoProxy?.rules[0].pattern).toBe('*.example.com')
    })

    test('converts KeywordCondition to wildcard pattern', () => {
      const backup = {
        schemaVersion: 2,
        '+keyword-switch': {
          name: 'keyword-switch',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: {
                conditionType: 'KeywordCondition',
                pattern: 'blocked',
              },
              profileName: 'proxy',
            },
          ],
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      const rule = result.configs[0].autoProxy?.rules[0]
      expect(rule?.pattern).toBe('*blocked*')
      expect(rule?.matchType).toBe('wildcard')
    })

    test('handles multiple profiles in one backup', () => {
      const backup = {
        schemaVersion: 2,
        '-enableQuickSwitch': true,
        '+proxy-a': {
          name: 'proxy-a',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'a.com', port: 8080 },
        },
        '+proxy-b': {
          name: 'proxy-b',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'socks5', host: 'b.com', port: 1080 },
        },
        '+pac': {
          name: 'pac',
          profileType: 'PacProfile',
          pacUrl: 'https://example.com/proxy.pac',
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(3)
      const names = result.configs.map((c) => c.name).sort()
      expect(names).toEqual(['pac', 'proxy-a', 'proxy-b'])
    })

    test('returns warning when no profiles found', () => {
      const backup = {
        schemaVersion: 2,
        '-enableQuickSwitch': false,
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('generates unique IDs for each imported config', () => {
      const backup = {
        schemaVersion: 2,
        '+a': {
          name: 'a',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'a.com', port: 80 },
        },
        '+b': {
          name: 'b',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'b.com', port: 80 },
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(2)
      expect(result.configs[0].id).toBeDefined()
      expect(result.configs[1].id).toBeDefined()
      expect(result.configs[0].id).not.toBe(result.configs[1].id)
    })

    test('assigns random color when profile has no color', () => {
      const backup = {
        schemaVersion: 2,
        '+nocolor': {
          name: 'nocolor',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'x.com', port: 80 },
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      expect(result.configs[0].color).toBeDefined()
      expect(result.configs[0].color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    test('maps unknown proxy scheme to http', () => {
      const backup = {
        schemaVersion: 2,
        '+weird': {
          name: 'weird',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'quic', host: 'x.com', port: 443 },
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      expect(result.configs[0].rules?.singleProxy?.scheme).toBe('http')
    })

    test('handles TrueCondition as catch-all wildcard', () => {
      const backup = {
        schemaVersion: 2,
        '+catch-all': {
          name: 'catch-all',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'TrueCondition' },
              profileName: 'proxy',
            },
          ],
        },
      }

      const result = SwitchyOmegaImporter.convertBackup(backup)

      expect(result.configs).toHaveLength(1)
      const rule = result.configs[0].autoProxy?.rules[0]
      expect(rule?.pattern).toBe('*')
      expect(rule?.matchType).toBe('wildcard')
    })
  })
})
