import { describe, expect, test } from 'bun:test'
import { detectSource } from '../detectSource'

describe('detectSource', () => {
  test('detects SwitchyOmega via +profile keys', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      '+proxy': { profileType: 'FixedProfile', name: 'proxy' },
    })
    expect(detectSource(raw).type).toBe('switchyomega')
  })

  test('detects SwitchyOmega via schemaVersion only', () => {
    const raw = JSON.stringify({ schemaVersion: 2, '-confirmDeletion': true })
    expect(detectSource(raw).type).toBe('switchyomega')
  })

  test('detects FoxyProxy 7.x array form', () => {
    const raw = JSON.stringify([{ title: 'P', type: 'http', address: '1.2.3.4', port: 8080 }])
    expect(detectSource(raw).type).toBe('foxyproxy')
  })

  test('detects FoxyProxy wrapped { proxies: [...] }', () => {
    const raw = JSON.stringify({
      proxies: [{ type: 'socks5', address: 'h', port: 1080 }],
    })
    expect(detectSource(raw).type).toBe('foxyproxy')
  })

  test('detects legacy FoxyProxy { settings: {...} }', () => {
    const raw = JSON.stringify({ settings: { proxies: { all: [] } } })
    expect(detectSource(raw).type).toBe('foxyproxy')
  })

  test('detects PACify own backup', () => {
    const raw = JSON.stringify({ proxyConfigs: [], quickSwitchEnabled: false })
    expect(detectSource(raw).type).toBe('pacify')
  })

  test('detects raw PAC script', () => {
    const raw = 'function FindProxyForURL(url, host) { return "DIRECT"; }'
    const result = detectSource(raw)
    expect(result.type).toBe('pac')
    expect(result.data).toBe(raw)
  })

  test('returns unknown for empty input', () => {
    expect(detectSource('   ').type).toBe('unknown')
  })

  test('returns unknown for unrecognised JSON', () => {
    expect(detectSource(JSON.stringify({ foo: 'bar' })).type).toBe('unknown')
  })

  test('returns unknown for unrecognised plain text', () => {
    expect(detectSource('just some text').type).toBe('unknown')
  })

  test('PACify takes precedence over FoxyProxy-like shapes', () => {
    const raw = JSON.stringify({
      proxyConfigs: [],
      quickSwitchEnabled: true,
      settings: { proxies: [] },
    })
    expect(detectSource(raw).type).toBe('pacify')
  })
})
