import { afterEach, beforeEach, describe, expect, type Mock, spyOn, test } from 'bun:test'
import { ChromeService } from '@/services/chrome/ChromeService'
import { detectCurrentProxy } from '../detectCurrentProxy'

// Use spyOn (not mock.module) to avoid globally replacing ChromeService.
let spy: Mock<() => Promise<any>>

describe('detectCurrentProxy', () => {
  beforeEach(() => {
    spy = spyOn(ChromeService, 'getProxy').mockResolvedValue({
      value: { mode: 'direct' },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
  })

  afterEach(() => spy.mockRestore())

  test('maps a fixed_servers browser proxy to a config with rules', async () => {
    spy.mockResolvedValue({
      value: {
        mode: 'fixed_servers',
        rules: { singleProxy: { scheme: 'http', host: '1.2.3.4', port: '8080' } },
      },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('fixed_servers')
    expect(configs[0].rules?.singleProxy?.host).toBe('1.2.3.4')
    expect(configs[0].name).toBe('Current browser proxy')
  })

  test('maps a pac_script browser proxy to a PAC URL config', async () => {
    spy.mockResolvedValue({
      value: { mode: 'pac_script', pacScript: { url: 'https://x/p.pac' } },
      levelOfControl: 'controlled_by_this_extension',
    } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('pac_script')
    expect(configs[0].pacScript?.url).toBe('https://x/p.pac')
  })

  test('warns when the current proxy is direct (nothing meaningful to import)', async () => {
    const { configs, report } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('direct')
    expect(report.warnings.some((w) => w.message.toLowerCase().includes('no active proxy'))).toBe(
      true
    )
  })

  test('warns when the proxy is not controllable', async () => {
    spy.mockResolvedValue({
      value: { mode: 'fixed_servers', rules: {} },
      levelOfControl: 'controlled_by_other_extensions',
    } as any)
    const { report } = await detectCurrentProxy()
    expect(report.warnings.some((w) => w.message.includes('controllable'))).toBe(true)
  })

  test('warns the proxy is managed elsewhere when controlled by another extension', async () => {
    spy.mockResolvedValue({
      value: { mode: 'fixed_servers', rules: {} },
      levelOfControl: 'controlled_by_other_extensions',
    } as any)
    const { report } = await detectCurrentProxy()
    expect(
      report.warnings.some(
        (w) => w.level === 'warning' && w.message.toLowerCase().includes('managed elsewhere')
      )
    ).toBe(true)
  })

  test('does NOT warn about control when controlled by this extension', async () => {
    spy.mockResolvedValue({
      value: { mode: 'pac_script', pacScript: { url: 'https://x/p.pac' } },
      levelOfControl: 'controlled_by_this_extension',
    } as any)
    const { report } = await detectCurrentProxy()
    expect(report.warnings.some((w) => w.message.toLowerCase().includes('managed elsewhere'))).toBe(
      false
    )
  })

  test('does NOT warn about control when levelOfControl is absent', async () => {
    spy.mockResolvedValue({ value: { mode: 'fixed_servers', rules: {} } } as any)
    const { report } = await detectCurrentProxy()
    expect(report.warnings.some((w) => w.message.toLowerCase().includes('managed elsewhere'))).toBe(
      false
    )
  })

  test('captures pac_script inline data when no url is present', async () => {
    spy.mockResolvedValue({
      value: { mode: 'pac_script', pacScript: { data: 'function FindProxyForURL(){}' } },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('pac_script')
    expect(configs[0].pacScript?.data).toBe('function FindProxyForURL(){}')
    expect(configs[0].pacScript?.url).toBeUndefined()
  })

  test('does not attach pacScript when mode is pac_script but pacScript is missing', async () => {
    spy.mockResolvedValue({
      value: { mode: 'pac_script' },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('pac_script')
    expect(configs[0].pacScript).toBeUndefined()
  })

  test('does not attach rules when mode is fixed_servers but rules are missing', async () => {
    spy.mockResolvedValue({
      value: { mode: 'fixed_servers' },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('fixed_servers')
    expect(configs[0].rules).toBeUndefined()
  })

  test('falls back to direct for an unknown mode and warns about no active proxy', async () => {
    spy.mockResolvedValue({
      value: { mode: 'bananas' },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs, report } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('direct')
    expect(report.warnings.some((w) => w.message.toLowerCase().includes('no active proxy'))).toBe(
      true
    )
  })

  test('falls back to direct when the proxy value/mode is missing entirely', async () => {
    spy.mockResolvedValue({ levelOfControl: 'controllable_by_this_extension' } as any)
    const { configs } = await detectCurrentProxy()
    expect(configs[0].mode).toBe('direct')
  })

  test('tolerates a null result from ChromeService.getProxy', async () => {
    spy.mockResolvedValue(null as any)
    const { configs, report } = await detectCurrentProxy()
    expect(configs).toHaveLength(1)
    expect(configs[0].mode).toBe('direct')
    expect(report.proxyCount).toBe(1)
  })

  test('produces a config with a generated id, fixed name, inactive, and a pac report', async () => {
    spy.mockResolvedValue({
      value: { mode: 'direct' },
      levelOfControl: 'controllable_by_this_extension',
    } as any)
    const { configs, report } = await detectCurrentProxy()
    expect(configs[0].id).toMatch(/^[0-9a-f-]{36}$/)
    expect(configs[0].name).toBe('Current browser proxy')
    expect(configs[0].isActive).toBe(false)
    expect(configs[0].color).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(report.source).toBe('pac')
    expect(report.proxyCount).toBe(1)
    expect(report.ruleCount).toBe(0)
  })
})
