import { afterEach, beforeEach, describe, expect, type Mock, spyOn, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'
import { SettingsReader } from '@/services/SettingsReader'
import { SettingsWriter } from '@/services/SettingsWriter'
import { ImportService } from '../ImportService'

// NOTE: We use spyOn (not mock.module) so we don't globally replace the
// SettingsReader/SettingsWriter modules — that would leak into and break their
// own test suites when the whole suite runs in one process.

let mockSettings: AppSettings
let getSettingsSpy: Mock<() => Promise<AppSettings>>
let updateSpy: Mock<(partial: Partial<AppSettings>) => Promise<void>>

const switchyOmegaBak = JSON.stringify({
  schemaVersion: 2,
  '+work': {
    profileType: 'FixedProfile',
    name: 'work',
    fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 },
  },
})

describe('ImportService', () => {
  beforeEach(() => {
    mockSettings = { ...DEFAULT_SETTINGS, proxyConfigs: [] }
    getSettingsSpy = spyOn(SettingsReader, 'getSettings').mockImplementation(
      async () => mockSettings
    )
    updateSpy = spyOn(SettingsWriter, 'updateSettings').mockImplementation(async () => {})
  })

  afterEach(() => {
    getSettingsSpy.mockRestore()
    updateSpy.mockRestore()
  })

  describe('parse', () => {
    test('dispatches to the SwitchyOmega adapter', () => {
      const result = ImportService.parse(switchyOmegaBak)
      expect(result.report.source).toBe('switchyomega')
      expect(result.configs).toHaveLength(1)
      expect(result.configs[0].name).toBe('work')
    })

    test('dispatches to the FoxyProxy adapter', () => {
      const result = ImportService.parse(
        JSON.stringify([{ title: 'P', type: 'http', address: 'h', port: 80 }])
      )
      expect(result.report.source).toBe('foxyproxy')
    })

    test('dispatches a raw PAC script', () => {
      const result = ImportService.parse('function FindProxyForURL(u,h){return "DIRECT";}')
      expect(result.report.source).toBe('pac')
      expect(result.configs[0].mode).toBe('pac_script')
    })

    test('throws on unrecognised format', () => {
      expect(() => ImportService.parse('{"foo":"bar"}')).toThrow('unrecognizedImportFormat')
    })
  })

  describe('commit (merge)', () => {
    test('appends imported configs to existing ones', async () => {
      mockSettings.proxyConfigs = [
        { id: 'a', name: 'Existing', color: '#000', isActive: false, mode: 'direct' },
      ]
      const result = ImportService.parse(switchyOmegaBak)
      await ImportService.commit(result, 'merge')

      const saved = updateSpy.mock.calls[0][0].proxyConfigs as ProxyConfig[]
      expect(saved).toHaveLength(2)
      expect(saved.map((c) => c.name)).toEqual(['Existing', 'work'])
    })

    test('disambiguates duplicate names on merge', async () => {
      mockSettings.proxyConfigs = [
        { id: 'a', name: 'work', color: '#000', isActive: false, mode: 'direct' },
      ]
      const result = ImportService.parse(switchyOmegaBak)
      await ImportService.commit(result, 'merge')

      const saved = updateSpy.mock.calls[0][0].proxyConfigs as ProxyConfig[]
      expect(saved.map((c) => c.name)).toEqual(['work', 'work (imported)'])
    })
  })

  describe('commit (replace)', () => {
    test('replaces existing configs and clears active id', async () => {
      mockSettings.proxyConfigs = [
        { id: 'a', name: 'Existing', color: '#000', isActive: false, mode: 'direct' },
      ]
      const result = ImportService.parse(switchyOmegaBak)
      await ImportService.commit(result, 'replace')

      const arg = updateSpy.mock.calls[0][0]
      expect((arg.proxyConfigs as ProxyConfig[]).map((c) => c.name)).toEqual(['work'])
      expect(arg.activeScriptId).toBeNull()
    })
  })

  test('commit throws when there is nothing to import', async () => {
    await expect(
      ImportService.commit({
        configs: [],
        report: { source: 'pacify', proxyCount: 0, ruleCount: 0, warnings: [] },
      })
    ).rejects.toThrow('nothingToImport')
  })
})
