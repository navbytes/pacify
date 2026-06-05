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
})
