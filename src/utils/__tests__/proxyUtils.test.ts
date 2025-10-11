import { describe, it, expect } from 'vitest'
import {
  validateProxyServer,
  createDefaultProxyServer,
  parseProxyString,
  formatProxyString,
  formatBypassList,
} from '../proxyUtils'

describe('validateProxyServer', () => {
  it('should return valid for correct proxy servers', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '8080',
    })
    expect(result.isValid).toBe(true)
  })

  it('should return invalid for empty host', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: '',
      port: '8080',
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Host is required')
  })

  it('should return invalid for empty port', () => {
    const result = validateProxyServer({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Port is required')
  })

  it('should return invalid for out-of-range ports', () => {
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
})

describe('parseProxyString', () => {
  it('should parse valid proxy strings', () => {
    const result = parseProxyString('PROXY example.com:8080')
    expect(result).toEqual({
      scheme: 'http',
      host: 'example.com',
      port: '8080',
    })
  })

  it('should parse SOCKS proxy strings', () => {
    const result = parseProxyString('SOCKS5 socks.example.com:1080')
    expect(result).toEqual({
      scheme: 'socks5',
      host: 'socks.example.com',
      port: '1080',
    })
  })

  it('should return null for invalid strings', () => {
    expect(parseProxyString('invalid')).toBeNull()
    expect(parseProxyString('PROXY invalid')).toBeNull()
  })
})

describe('formatProxyString', () => {
  it('should format proxy server to PAC format', () => {
    const result = formatProxyString({
      scheme: 'http',
      host: 'proxy.example.com',
      port: '8080',
    })
    expect(result).toBe('PROXY proxy.example.com:8080')
  })

  it('should handle SOCKS proxies', () => {
    const result = formatProxyString({
      scheme: 'socks5',
      host: 'socks.example.com',
      port: '1080',
    })
    expect(result).toBe('SOCKS5 socks.example.com:1080')
  })
})

describe('formatBypassList', () => {
  it('should convert string to array', () => {
    const result = formatBypassList('localhost\nexample.com\n*.local')
    expect(result).toEqual(['localhost', 'example.com', '*.local'])
  })

  it('should convert array to string', () => {
    const result = formatBypassList(['localhost', 'example.com', '*.local'])
    expect(result).toBe('localhost\nexample.com\n*.local')
  })

  it('should filter empty lines', () => {
    const result = formatBypassList('localhost\n\nexample.com\n  \n*.local')
    expect(result).toEqual(['localhost', 'example.com', '*.local'])
  })
})

describe('createDefaultProxyServer', () => {
  it('should create default proxy server', () => {
    const result = createDefaultProxyServer()
    expect(result).toEqual({
      scheme: 'http',
      host: '',
      port: '',
    })
  })
})
