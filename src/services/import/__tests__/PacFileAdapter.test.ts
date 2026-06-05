import { describe, expect, test } from 'bun:test'
import { PacFileAdapter } from '../adapters/PacFileAdapter'
import { detectSource } from '../detectSource'

describe('PacFileAdapter', () => {
  test('wraps an inline PAC script as pacScript.data', () => {
    const script = 'function FindProxyForURL(url, host) { return "DIRECT"; }'
    const { configs } = PacFileAdapter.map(script)
    expect(configs).toHaveLength(1)
    expect(configs[0].mode).toBe('pac_script')
    expect(configs[0].pacScript?.data).toBe(script)
    expect(configs[0].pacScript?.url).toBeUndefined()
  })

  test('treats a bare URL as a PAC URL', () => {
    const { configs } = PacFileAdapter.map('https://example.com/proxy.pac')
    expect(configs[0].pacScript?.url).toBe('https://example.com/proxy.pac')
    expect(configs[0].pacScript?.data).toBeUndefined()
    expect(configs[0].name).toBe('Imported PAC (URL)')
  })

  test('produces nothing for empty input', () => {
    expect(PacFileAdapter.map('').configs).toHaveLength(0)
  })

  test('detectSource recognises a bare PAC URL as pac', () => {
    expect(detectSource('https://example.com/proxy.pac').type).toBe('pac')
  })
})
