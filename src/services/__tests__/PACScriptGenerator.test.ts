import { describe, expect, test } from 'bun:test'
import type { AutoProxyConfig, AutoProxyRule, ProxyConfig } from '@/interfaces/settings'
import { PACScriptGenerator } from '../PACScriptGenerator'

// Helper to create a mock rule
function createRule(overrides: Partial<AutoProxyRule> & { pattern: string }): AutoProxyRule {
  return {
    id: `rule-${Math.random().toString(36).slice(2)}`,
    enabled: true,
    priority: 0,
    matchType: 'wildcard',
    proxyType: 'direct',
    ...overrides,
  }
}

// Helper to create a mock proxy config
function createProxyConfig(overrides: Partial<ProxyConfig>): ProxyConfig {
  return {
    id: `proxy-${Math.random().toString(36).slice(2)}`,
    name: 'Test Proxy',
    color: '#000000',
    isActive: false,
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host: '127.0.0.1',
        port: '8080',
      },
    },
    ...overrides,
  }
}

describe('PACScriptGenerator', () => {
  describe('generate', () => {
    test('generates basic PAC script with no rules', () => {
      const config: AutoProxyConfig = {
        rules: [],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('function FindProxyForURL(url, host)')
      expect(result).toContain('return "DIRECT"')
    })

    test('generates PAC script with wildcard rule', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '*.google.com', proxyType: 'direct' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('shExpMatch(host, "*.google.com")')
      expect(result).toContain('return "DIRECT"')
    })

    test('generates PAC script with exact match rule', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: 'example.com', matchType: 'exact', proxyType: 'direct' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('host === "example.com"')
    })

    test('generates PAC script with regex rule', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({ pattern: '^.*\\.google\\.com$', matchType: 'regex', proxyType: 'direct' }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('new RegExp')
      expect(result).toContain('.test(host)')
    })

    test('generates PAC script with CIDR rule', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '192.168.0.0/16', matchType: 'cidr', proxyType: 'direct' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('isInNet(host, "192.168.0.0", "255.255.0.0")')
    })

    test('generates PAC script with inline proxy', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'inline',
            inlineProxy: { scheme: 'http', host: 'proxy.local', port: '3128' },
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('PROXY proxy.local:3128')
    })

    test('generates PAC script with existing proxy reference', () => {
      const proxy = createProxyConfig({
        id: 'my-proxy',
        name: 'My Proxy',
        rules: { singleProxy: { scheme: 'http', host: 'myproxy.com', port: '8080' } },
      })

      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'existing',
            proxyId: 'my-proxy',
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [proxy])

      expect(result).toContain('PROXY myproxy.com:8080')
    })

    test('filters out disabled rules', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({ pattern: '*.enabled.com', enabled: true }),
          createRule({ pattern: '*.disabled.com', enabled: false }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('*.enabled.com')
      expect(result).not.toContain('*.disabled.com')
    })

    test('sorts rules by priority', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({ pattern: '*.low.com', priority: 10 }),
          createRule({ pattern: '*.high.com', priority: 1 }),
          createRule({ pattern: '*.medium.com', priority: 5 }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      const highIndex = result.indexOf('*.high.com')
      const mediumIndex = result.indexOf('*.medium.com')
      const lowIndex = result.indexOf('*.low.com')

      expect(highIndex).toBeLessThan(mediumIndex)
      expect(mediumIndex).toBeLessThan(lowIndex)
    })

    test('generates correct fallback with existing proxy', () => {
      const proxy = createProxyConfig({
        id: 'fallback-proxy',
        rules: { singleProxy: { scheme: 'socks5', host: 'socks.local', port: '1080' } },
      })

      const config: AutoProxyConfig = {
        rules: [],
        fallbackType: 'existing',
        fallbackProxyId: 'fallback-proxy',
      }

      const result = PACScriptGenerator.generate(config, [proxy])

      expect(result).toContain('SOCKS5 socks.local:1080')
    })

    test('generates correct fallback with inline proxy', () => {
      const config: AutoProxyConfig = {
        rules: [],
        fallbackType: 'inline',
        fallbackInlineProxy: { scheme: 'https', host: 'secure.local', port: '443' },
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('HTTPS secure.local:443')
    })

    test('handles SOCKS4 proxy scheme', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'inline',
            inlineProxy: { scheme: 'socks4', host: 'socks.local', port: '1080' },
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('SOCKS socks.local:1080')
    })

    test('embeds PAC scripts from referenced proxies', () => {
      const pacProxy = createProxyConfig({
        id: 'pac-proxy',
        name: 'PAC Proxy',
        mode: 'pac_script',
        pacScript: {
          data: `function FindProxyForURL(url, host) {
  if (host === "test.com") return "DIRECT";
  return "PROXY fallback:8080";
}`,
        },
      })

      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'existing',
            proxyId: 'pac-proxy',
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [pacProxy])

      expect(result).toContain('_embeddedPAC_0')
      expect(result).toContain('return _embeddedPAC_0(url, host)')
    })
  })

  describe('validatePattern', () => {
    test('validates empty pattern', () => {
      const result = PACScriptGenerator.validatePattern('', 'wildcard')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    test('validates whitespace-only pattern', () => {
      const result = PACScriptGenerator.validatePattern('   ', 'wildcard')
      expect(result.valid).toBe(false)
    })

    describe('wildcard patterns', () => {
      test('accepts valid wildcard pattern', () => {
        const result = PACScriptGenerator.validatePattern('*.google.com', 'wildcard')
        expect(result.valid).toBe(true)
      })

      test('accepts pattern with question mark', () => {
        const result = PACScriptGenerator.validatePattern('test?.com', 'wildcard')
        expect(result.valid).toBe(true)
      })

      test('rejects invalid characters in wildcard', () => {
        const result = PACScriptGenerator.validatePattern('test<>.com', 'wildcard')
        expect(result.valid).toBe(false)
      })
    })

    describe('exact patterns', () => {
      test('accepts valid hostname', () => {
        const result = PACScriptGenerator.validatePattern('www.example.com', 'exact')
        expect(result.valid).toBe(true)
      })

      test('rejects wildcards in exact pattern', () => {
        const result = PACScriptGenerator.validatePattern('*.example.com', 'exact')
        expect(result.valid).toBe(false)
      })
    })

    describe('regex patterns', () => {
      test('accepts valid regex', () => {
        const result = PACScriptGenerator.validatePattern('^.*\\.google\\.com$', 'regex')
        expect(result.valid).toBe(true)
      })

      test('rejects invalid regex', () => {
        const result = PACScriptGenerator.validatePattern('[invalid', 'regex')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid regular expression')
      })
    })

    describe('CIDR patterns', () => {
      test('accepts valid CIDR notation', () => {
        const result = PACScriptGenerator.validatePattern('192.168.0.0/16', 'cidr')
        expect(result.valid).toBe(true)
      })

      test('rejects invalid CIDR format', () => {
        const result = PACScriptGenerator.validatePattern('192.168.0.0', 'cidr')
        expect(result.valid).toBe(false)
      })

      test('rejects prefix out of range', () => {
        const result = PACScriptGenerator.validatePattern('192.168.0.0/33', 'cidr')
        expect(result.valid).toBe(false)
      })

      test('rejects invalid IP octets', () => {
        const result = PACScriptGenerator.validatePattern('192.168.300.0/16', 'cidr')
        expect(result.valid).toBe(false)
      })
    })

    test('handles unknown pattern type', () => {
      const result = PACScriptGenerator.validatePattern('test', 'unknown' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown pattern type')
    })
  })

  describe('testUrl', () => {
    test('matches wildcard pattern', () => {
      const rules = [createRule({ pattern: '*.google.com' })]
      const result = PACScriptGenerator.testUrl('https://www.google.com', rules, [])

      expect(result.matched).toBe(true)
      expect(result.rule?.pattern).toBe('*.google.com')
    })

    test('matches exact hostname', () => {
      const rules = [createRule({ pattern: 'example.com', matchType: 'exact' })]
      const result = PACScriptGenerator.testUrl('https://example.com/path', rules, [])

      expect(result.matched).toBe(true)
    })

    test('does not match different hostname with exact', () => {
      const rules = [createRule({ pattern: 'example.com', matchType: 'exact' })]
      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [])

      expect(result.matched).toBe(false)
    })

    test('matches regex pattern', () => {
      const rules = [createRule({ pattern: '^(www\\.)?google\\.com$', matchType: 'regex' })]

      const result1 = PACScriptGenerator.testUrl('https://google.com', rules, [])
      const result2 = PACScriptGenerator.testUrl('https://www.google.com', rules, [])

      expect(result1.matched).toBe(true)
      expect(result2.matched).toBe(true)
    })

    test('matches CIDR pattern', () => {
      const rules = [createRule({ pattern: '192.168.0.0/24', matchType: 'cidr' })]

      const result1 = PACScriptGenerator.testUrl('http://192.168.0.50', rules, [])
      const result2 = PACScriptGenerator.testUrl('http://192.168.1.50', rules, [])

      expect(result1.matched).toBe(true)
      expect(result2.matched).toBe(false)
    })

    test('returns correct proxy result for direct', () => {
      const rules = [createRule({ pattern: '*.example.com', proxyType: 'direct' })]
      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [])

      expect(result.proxyResult).toBe('DIRECT')
    })

    test('returns correct proxy result for inline proxy', () => {
      const rules = [
        createRule({
          pattern: '*.example.com',
          proxyType: 'inline',
          inlineProxy: { scheme: 'http', host: 'proxy.local', port: '8080' },
        }),
      ]
      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [])

      expect(result.proxyResult).toBe('PROXY proxy.local:8080')
    })

    test('returns DIRECT when no rules match', () => {
      const rules = [createRule({ pattern: '*.other.com' })]
      const result = PACScriptGenerator.testUrl('https://example.com', rules, [])

      expect(result.matched).toBe(false)
      expect(result.proxyResult).toBe('DIRECT')
    })

    test('respects rule priority', () => {
      const rules = [
        createRule({ pattern: '*.example.com', priority: 2, proxyType: 'direct' }),
        createRule({
          pattern: '*.example.com',
          priority: 1,
          proxyType: 'inline',
          inlineProxy: { scheme: 'http', host: 'first.local', port: '8080' },
        }),
      ]
      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [])

      expect(result.proxyResult).toBe('PROXY first.local:8080')
    })

    test('skips disabled rules', () => {
      const rules = [
        createRule({
          pattern: '*.example.com',
          enabled: false,
          proxyType: 'inline',
          inlineProxy: { scheme: 'http', host: 'disabled.local', port: '8080' },
        }),
        createRule({ pattern: '*.example.com', enabled: true, proxyType: 'direct' }),
      ]
      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [])

      expect(result.proxyResult).toBe('DIRECT')
    })

    test('handles raw hostname input', () => {
      const rules = [createRule({ pattern: '*.example.com' })]
      const result = PACScriptGenerator.testUrl('www.example.com', rules, [])

      expect(result.matched).toBe(true)
    })

    test('identifies PAC script proxy references', () => {
      const pacProxy = createProxyConfig({
        id: 'pac-proxy',
        name: 'My PAC Script',
        mode: 'pac_script',
        pacScript: { data: 'function FindProxyForURL(url, host) { return "DIRECT"; }' },
      })

      const rules = [
        createRule({
          pattern: '*.example.com',
          proxyType: 'existing',
          proxyId: 'pac-proxy',
        }),
      ]

      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [pacProxy])

      expect(result.matched).toBe(true)
      expect(result.isPACScript).toBe(true)
      expect(result.proxyResult).toContain('PAC Script: My PAC Script')
    })

    test('handles existing proxy with direct mode', () => {
      const directProxy = createProxyConfig({
        id: 'direct-proxy',
        mode: 'direct',
      })

      const rules = [
        createRule({
          pattern: '*.example.com',
          proxyType: 'existing',
          proxyId: 'direct-proxy',
        }),
      ]

      const result = PACScriptGenerator.testUrl('https://www.example.com', rules, [directProxy])

      expect(result.proxyResult).toBe('DIRECT')
    })
  })

  describe('CIDR prefix to mask conversion', () => {
    test('handles /32 prefix', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '10.0.0.1/32', matchType: 'cidr' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('255.255.255.255')
    })

    test('handles /0 prefix', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '0.0.0.0/0', matchType: 'cidr' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('0.0.0.0')
    })

    test('handles /24 prefix', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '192.168.1.0/24', matchType: 'cidr' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('255.255.255.0')
    })

    test('handles /8 prefix', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '10.0.0.0/8', matchType: 'cidr' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('255.0.0.0')
    })
  })

  describe('edge cases', () => {
    test('handles missing proxy reference gracefully', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'existing',
            proxyId: 'non-existent',
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('DIRECT')
    })

    test('handles inline proxy without required fields', () => {
      const config: AutoProxyConfig = {
        rules: [
          createRule({
            pattern: '*.example.com',
            proxyType: 'inline',
            // inlineProxy is missing
          }),
        ],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      expect(result).toContain('DIRECT')
    })

    test('handles invalid CIDR in pattern generation', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: 'not-a-cidr', matchType: 'cidr' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      // Should still generate valid script with false condition
      expect(result).toContain('false')
    })

    test('escapes regex backslashes correctly', () => {
      const config: AutoProxyConfig = {
        rules: [createRule({ pattern: '\\d+\\.example\\.com', matchType: 'regex' })],
        fallbackType: 'direct',
      }

      const result = PACScriptGenerator.generate(config, [])

      // Backslashes should be double-escaped for JavaScript string
      expect(result).toContain('\\\\d+')
    })
  })
})
