import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings } from '@/interfaces'

// Mock data
let mockSettings: AppSettings

const mockStorageService = {
  getSettings: mock(async () => mockSettings),
  invalidateCache: mock(() => {}),
}

mock.module('@/services/StorageService', () => ({
  StorageService: mockStorageService,
}))

// Import after mocking
import { SettingsReader } from '../SettingsReader'

describe('SettingsReader', () => {
  beforeEach(() => {
    // Reset mock settings
    mockSettings = {
      ...DEFAULT_SETTINGS,
      proxyConfigs: [],
    }
    mockStorageService.getSettings.mockClear()
    mockStorageService.invalidateCache.mockClear()
  })

  describe('getScripts', () => {
    test('returns empty array when no scripts exist', async () => {
      const scripts = await SettingsReader.getScripts()

      expect(scripts).toEqual([])
    })

    test('returns all proxy configs', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: '2', name: 'Proxy 2', color: '#00ff00', isActive: false, mode: 'system' },
        { id: '3', name: 'Proxy 3', color: '#0000ff', isActive: true, mode: 'pac_script' },
      ]

      const scripts = await SettingsReader.getScripts()

      expect(scripts).toHaveLength(3)
      expect(scripts[0].name).toBe('Proxy 1')
      expect(scripts[1].name).toBe('Proxy 2')
      expect(scripts[2].name).toBe('Proxy 3')
    })

    test('calls StorageService.getSettings', async () => {
      await SettingsReader.getScripts()

      expect(mockStorageService.getSettings).toHaveBeenCalled()
    })
  })

  describe('getActiveScript', () => {
    test('returns null when no active script', async () => {
      mockSettings.activeScriptId = null
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
      ]

      const activeScript = await SettingsReader.getActiveScript()

      expect(activeScript).toBeNull()
    })

    test('returns null when activeScriptId does not match any script', async () => {
      mockSettings.activeScriptId = 'non-existent'
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
      ]

      const activeScript = await SettingsReader.getActiveScript()

      expect(activeScript).toBeNull()
    })

    test('returns the active script when found', async () => {
      mockSettings.activeScriptId = '2'
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: '2', name: 'Active Proxy', color: '#00ff00', isActive: true, mode: 'pac_script' },
        { id: '3', name: 'Proxy 3', color: '#0000ff', isActive: false, mode: 'system' },
      ]

      const activeScript = await SettingsReader.getActiveScript()

      expect(activeScript).not.toBeNull()
      expect(activeScript?.id).toBe('2')
      expect(activeScript?.name).toBe('Active Proxy')
    })

    test('returns first matching script when id matches', async () => {
      mockSettings.activeScriptId = '1'
      mockSettings.proxyConfigs = [
        { id: '1', name: 'First Proxy', color: '#ff0000', isActive: false, mode: 'direct' },
      ]

      const activeScript = await SettingsReader.getActiveScript()

      expect(activeScript?.id).toBe('1')
    })
  })

  describe('getPacScriptById', () => {
    test('returns null when script not found', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
      ]

      const script = await SettingsReader.getPacScriptById('non-existent')

      expect(script).toBeNull()
    })

    test('returns null when no scripts exist', async () => {
      mockSettings.proxyConfigs = []

      const script = await SettingsReader.getPacScriptById('any-id')

      expect(script).toBeNull()
    })

    test('returns the script when found', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Proxy 1', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: '2', name: 'Target Proxy', color: '#00ff00', isActive: false, mode: 'pac_script' },
        { id: '3', name: 'Proxy 3', color: '#0000ff', isActive: false, mode: 'system' },
      ]

      const script = await SettingsReader.getPacScriptById('2')

      expect(script).not.toBeNull()
      expect(script?.id).toBe('2')
      expect(script?.name).toBe('Target Proxy')
    })

    test('returns correct script by id', async () => {
      mockSettings.proxyConfigs = [
        { id: 'abc-123', name: 'ABC Proxy', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: 'xyz-789', name: 'XYZ Proxy', color: '#00ff00', isActive: false, mode: 'system' },
      ]

      const script = await SettingsReader.getPacScriptById('xyz-789')

      expect(script?.id).toBe('xyz-789')
      expect(script?.name).toBe('XYZ Proxy')
    })
  })

  describe('getSettings', () => {
    test('delegates to StorageService.getSettings', async () => {
      const expectedSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        quickSwitchEnabled: true,
      }
      mockSettings = expectedSettings

      const settings = await SettingsReader.getSettings()

      expect(mockStorageService.getSettings).toHaveBeenCalled()
      expect(settings).toEqual(expectedSettings)
    })

    test('returns complete settings object', async () => {
      mockSettings = {
        quickSwitchEnabled: true,
        activeScriptId: 'test-id',
        proxyConfigs: [
          { id: 'test-id', name: 'Test', color: '#000', isActive: true, mode: 'direct' },
        ],
        disableProxyOnStartup: true,
        autoReloadOnProxySwitch: false,
      }

      const settings = await SettingsReader.getSettings()

      expect(settings.quickSwitchEnabled).toBe(true)
      expect(settings.activeScriptId).toBe('test-id')
      expect(settings.proxyConfigs).toHaveLength(1)
      expect(settings.disableProxyOnStartup).toBe(true)
      expect(settings.autoReloadOnProxySwitch).toBe(false)
    })
  })

  describe('invalidateCache', () => {
    test('delegates to StorageService.invalidateCache', () => {
      SettingsReader.invalidateCache()

      expect(mockStorageService.invalidateCache).toHaveBeenCalled()
    })

    test('can be called multiple times', () => {
      SettingsReader.invalidateCache()
      SettingsReader.invalidateCache()
      SettingsReader.invalidateCache()

      expect(mockStorageService.invalidateCache).toHaveBeenCalledTimes(3)
    })
  })
})
