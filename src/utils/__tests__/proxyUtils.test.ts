import { describe, expect, test } from 'bun:test'
import type { ProxyServer } from '@/interfaces'
import {
  createDefaultProxyServer,
  createDefaultProxySettings,
  createEmptyProxyConfig,
  formatBypassList,
  formatProxyString,
  parseProxyString,
  validateProxyServer,
} from '../proxyUtils'

describe('validateProxyServer', () => {
  test('should return valid for correct proxy servers', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '8080',
    })
    expect(result.isValid).toBe(true)
  })

  test('should return invalid for empty host', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: '',
      port: '8080',
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Host is required')
  })

  test('should return invalid for empty port', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Port is required')
  })

  test('should return invalid for out-of-range ports', () => {
    const result1 = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '0',
    })
    expect(result1.isValid).toBe(false)

    const result2 = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '65536',
    })
    expect(result2.isValid).toBe(false)
  })

  test('should return invalid for non-numeric port', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: 'abc',
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Port must be a number between 1 and 65535')
  })

  test('should handle edge case ports', () => {
    const result1 = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '1',
    })
    expect(result1.isValid).toBe(true)

    const result2 = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '65535',
    })
    expect(result2.isValid).toBe(true)
  })
})

describe('parseProxyString', () => {
  test('should parse valid proxy strings', () => {
    const result = parseProxyString('PROXY example.com:8080')
    expect(result).toEqual({
      scheme: 'http',
      host: 'example.com',
      port: '8080',
    })
  })

  test('should parse SOCKS proxy strings', () => {
    const result = parseProxyString('SOCKS5 socks.example.com:1080')
    expect(result).toEqual({
      scheme: 'socks5',
      host: 'socks.example.com',
      port: '1080',
    })
  })

  test('should parse different proxy types', () => {
    // Test all supported proxy types
    expect(parseProxyString('HTTP proxy.com:8080')).toEqual({
      scheme: 'http',
      host: 'proxy.com',
      port: '8080',
    })

    expect(parseProxyString('HTTPS secure.com:443')).toEqual({
      scheme: 'https',
      host: 'secure.com',
      port: '443',
    })

    expect(parseProxyString('QUIC quic.com:443')).toEqual({
      scheme: 'quic',
      host: 'quic.com',
      port: '443',
    })

    expect(parseProxyString('SOCKS socks.com:1080')).toEqual({
      scheme: 'socks5',
      host: 'socks.com',
      port: '1080',
    })

    expect(parseProxyString('SOCKS4 socks4.com:1080')).toEqual({
      scheme: 'socks4',
      host: 'socks4.com',
      port: '1080',
    })
  })

  test('should handle unknown proxy types', () => {
    const result = parseProxyString('UNKNOWN unknown.com:8080')
    expect(result).toBeNull()
  })

  test('should return null for invalid strings', () => {
    expect(parseProxyString('invalid')).toBeNull()
    expect(parseProxyString('PROXY invalid')).toBeNull()
  })
})

describe('formatProxyString', () => {
  test('should format proxy server to PAC format', () => {
    const result = formatProxyString({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '8080',
    })
    expect(result).toBe('PROXY proxy.example.com:8080')
  })

  test('should handle SOCKS proxies', () => {
    const result = formatProxyString({
      scheme: 'socks5',
      host: 'socks.example.com',
      port: '1080',
    })
    expect(result).toBe('SOCKS5 socks.example.com:1080')
  })

  test('should handle all proxy scheme types', () => {
    const servers: ProxyServer[] = [
      { scheme: 'https', host: 'secure.com', port: '443' },
      { scheme: 'quic', host: 'quic.com', port: '443' },
      { scheme: 'socks4', host: 'socks4.com', port: '1080' },
      { scheme: 'unknown' as any, host: 'unknown.com', port: '8080' },
    ]

    expect(formatProxyString(servers[0])).toBe('HTTPS secure.com:443')
    expect(formatProxyString(servers[1])).toBe('QUIC quic.com:443')
    expect(formatProxyString(servers[2])).toBe('SOCKS4 socks4.com:1080')
    expect(formatProxyString(servers[3])).toBe('PROXY unknown.com:8080') // Unknown maps to PROXY
  })
})

describe('formatBypassList', () => {
  test('should convert string to array', () => {
    const result = formatBypassList('localhost\nexample.com\n*.local')
    expect(result).toEqual(['localhost', 'example.com', '*.local'])
  })

  test('should convert array to string', () => {
    const result = formatBypassList(['localhost', 'example.com', '*.local'])
    expect(result).toBe('localhost\nexample.com\n*.local')
  })

  test('should filter empty lines', () => {
    const result = formatBypassList('localhost\n\nexample.com\n  \n*.local')
    expect(result).toEqual(['localhost', 'example.com', '*.local'])
  })

  test('should handle empty string input', () => {
    const result = formatBypassList('')
    expect(result).toEqual([])
  })

  test('should handle empty array input', () => {
    const result = formatBypassList([])
    expect(result).toBe('')
  })

  test('should handle whitespace-only lines', () => {
    const result = formatBypassList('localhost\n   \t   \nexample.com')
    expect(result).toEqual(['localhost', 'example.com'])
  })
})

describe('createDefaultProxyServer', () => {
  test('should create default proxy server', () => {
    const result = createDefaultProxyServer()
    expect(result).toEqual({
      scheme: 'http',
      host: '',
      port: '',
    })
  })
})

describe('createDefaultProxySettings', () => {
  test('should create default proxy settings with all proxy types', () => {
    const result = createDefaultProxySettings()

    expect(result).toHaveProperty('singleProxy')
    expect(result).toHaveProperty('proxyForHttp')
    expect(result).toHaveProperty('proxyForHttps')
    expect(result).toHaveProperty('proxyForFtp')
    expect(result).toHaveProperty('fallbackProxy')
    expect(result).toHaveProperty('bypassList')

    // All proxy servers should be default empty servers
    const expectedServer: ProxyServer = { scheme: 'http', host: '', port: '' }
    expect(result.singleProxy).toEqual(expectedServer)
    expect(result.proxyForHttp).toEqual(expectedServer)
    expect(result.proxyForHttps).toEqual(expectedServer)
    expect(result.proxyForFtp).toEqual(expectedServer)
    expect(result.fallbackProxy).toEqual(expectedServer)

    expect(result.bypassList).toEqual([])
  })
})

describe('createEmptyProxyConfig', () => {
  test('should create empty proxy config with default mode', () => {
    const result = createEmptyProxyConfig()

    expect(result.name).toBe('')
    expect(result.isActive).toBe(false)
    expect(result.mode).toBe('system')
    expect(result.quickSwitch).toBe(false)
    expect(result.color).toMatch(/^#[0-9a-f]{6}$/i) // Valid hex color
  })

  test('should create empty proxy config with specified mode', () => {
    const result = createEmptyProxyConfig('pac_script')

    expect(result.mode).toBe('pac_script')
    expect(result.name).toBe('')
    expect(result.isActive).toBe(false)
    expect(result.quickSwitch).toBe(false)
  })

  test('should generate different random colors', () => {
    const config1 = createEmptyProxyConfig()
    const config2 = createEmptyProxyConfig()

    // While it's possible they could be the same due to randomness,
    // it's extremely unlikely with 16+ million possible colors
    // This test may occasionally fail due to randomness, but very rarely
    expect(config1.color).not.toBe(config2.color)
  })

  test('should handle all proxy modes', () => {
    const modes = ['system', 'direct', 'fixed_servers', 'pac_script'] as const

    modes.forEach((mode) => {
      const result = createEmptyProxyConfig(mode)
      expect(result.mode).toBe(mode)
    })
  })
})
