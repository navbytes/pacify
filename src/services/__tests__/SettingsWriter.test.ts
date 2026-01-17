import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'

// Mock data
let mockSettings: AppSettings
let savedSettings: AppSettings | null = null

const mockStorageService = {
  getSettings: mock(async () => mockSettings),
  saveSettings: mock(async (settings: AppSettings) => {
    savedSettings = settings
    mockSettings = settings
  }),
  invalidateCache: mock(() => {}),
}

mock.module('@/services/StorageService', () => ({
  StorageService: mockStorageService,
}))

mock.module('@/services/SettingsReader', () => ({
  SettingsReader: {
    getSettings: mock(async () => mockSettings),
    getPacScriptById: mock(async (id: string) => {
      return mockSettings.proxyConfigs.find((s) => s.id === id) || null
    }),
  },
}))

// Import after mocking
import { SettingsWriter } from '../SettingsWriter'

describe('SettingsWriter', () => {
  beforeEach(() => {
    // Reset mock settings
    mockSettings = {
      ...DEFAULT_SETTINGS,
      proxyConfigs: [],
    }
    savedSettings = null
    mockStorageService.getSettings.mockClear()
    mockStorageService.saveSettings.mockClear()
  })

  describe('saveSettings', () => {
    test('saves settings to StorageService', async () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        quickSwitchEnabled: true,
      }

      await SettingsWriter.saveSettings(settings)

      expect(mockStorageService.saveSettings).toHaveBeenCalledWith(settings)
    })

    test('saves complete settings object', async () => {
      const settings: AppSettings = {
        quickSwitchEnabled: true,
        activeScriptId: 'test-id',
        proxyConfigs: [
          { id: 'test-id', name: 'Test', color: '#000', isActive: true, mode: 'direct' },
        ],
        disableProxyOnStartup: true,
        autoReloadOnProxySwitch: false,
      }

      await SettingsWriter.saveSettings(settings)

      expect(savedSettings).toEqual(settings)
    })
  })

  describe('updateSettings', () => {
    test('merges partial settings with existing settings', async () => {
      mockSettings = {
        ...DEFAULT_SETTINGS,
        quickSwitchEnabled: false,
      }

      await SettingsWriter.updateSettings({ quickSwitchEnabled: true })

      expect(savedSettings?.quickSwitchEnabled).toBe(true)
    })

    test('preserves existing settings when updating', async () => {
      mockSettings = {
        ...DEFAULT_SETTINGS,
        activeScriptId: 'existing-id',
        proxyConfigs: [
          { id: 'existing-id', name: 'Existing', color: '#fff', isActive: true, mode: 'direct' },
        ],
      }

      await SettingsWriter.updateSettings({ quickSwitchEnabled: true })

      expect(savedSettings?.activeScriptId).toBe('existing-id')
      expect(savedSettings?.proxyConfigs).toHaveLength(1)
    })
  })

  describe('addPACScript', () => {
    test('adds new script to proxyConfigs', async () => {
      mockSettings.proxyConfigs = []

      const newScript: Omit<ProxyConfig, 'id'> = {
        name: 'New Proxy',
        color: '#ff0000',
        isActive: false,
        mode: 'pac_script',
      }

      await SettingsWriter.addPACScript(newScript)

      expect(savedSettings?.proxyConfigs).toHaveLength(1)
      expect(savedSettings?.proxyConfigs[0].name).toBe('New Proxy')
    })

    test('generates unique id for new script', async () => {
      mockSettings.proxyConfigs = []

      await SettingsWriter.addPACScript({
        name: 'New Proxy',
        color: '#ff0000',
        isActive: false,
        mode: 'pac_script',
      })

      expect(savedSettings?.proxyConfigs[0].id).toBeDefined()
      expect(savedSettings?.proxyConfigs[0].id.length).toBeGreaterThan(0)
    })

    test('preserves existing scripts when adding new one', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Existing Proxy', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.addPACScript({
        name: 'New Proxy',
        color: '#ff0000',
        isActive: false,
        mode: 'pac_script',
      })

      expect(savedSettings?.proxyConfigs).toHaveLength(2)
      expect(savedSettings?.proxyConfigs[0].name).toBe('Existing Proxy')
      expect(savedSettings?.proxyConfigs[1].name).toBe('New Proxy')
    })
  })

  describe('updatePACScript', () => {
    test('updates existing script', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Original Name', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.updatePACScript({
        id: '1',
        name: 'Updated Name',
        color: '#fff',
        isActive: true,
        mode: 'pac_script',
      })

      expect(savedSettings?.proxyConfigs[0].name).toBe('Updated Name')
      expect(savedSettings?.proxyConfigs[0].color).toBe('#fff')
    })

    test('does nothing when script not found', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Existing', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.updatePACScript({
        id: 'non-existent',
        name: 'Updated',
        color: '#fff',
        isActive: true,
        mode: 'pac_script',
      })

      // Should not call saveSettings when script not found
      expect(mockStorageService.saveSettings).not.toHaveBeenCalled()
    })

    test('updates correct script when multiple exist', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'First', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: '2', name: 'Second', color: '#00ff00', isActive: false, mode: 'system' },
        { id: '3', name: 'Third', color: '#0000ff', isActive: false, mode: 'pac_script' },
      ]

      await SettingsWriter.updatePACScript({
        id: '2',
        name: 'Updated Second',
        color: '#00ff00',
        isActive: true,
        mode: 'system',
      })

      expect(savedSettings?.proxyConfigs[0].name).toBe('First')
      expect(savedSettings?.proxyConfigs[1].name).toBe('Updated Second')
      expect(savedSettings?.proxyConfigs[2].name).toBe('Third')
    })
  })

  describe('deletePACScript', () => {
    test('removes script from proxyConfigs', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'To Delete', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.deletePACScript('1')

      expect(savedSettings?.proxyConfigs).toHaveLength(0)
    })

    test('clears activeScriptId when deleting active script', async () => {
      mockSettings = {
        ...DEFAULT_SETTINGS,
        activeScriptId: '1',
        proxyConfigs: [
          { id: '1', name: 'Active Script', color: '#000', isActive: true, mode: 'direct' },
        ],
      }

      await SettingsWriter.deletePACScript('1')

      expect(savedSettings?.activeScriptId).toBeNull()
    })

    test('preserves activeScriptId when deleting non-active script', async () => {
      mockSettings = {
        ...DEFAULT_SETTINGS,
        activeScriptId: '1',
        proxyConfigs: [
          { id: '1', name: 'Active', color: '#000', isActive: true, mode: 'direct' },
          { id: '2', name: 'Inactive', color: '#fff', isActive: false, mode: 'system' },
        ],
      }

      await SettingsWriter.deletePACScript('2')

      expect(savedSettings?.activeScriptId).toBe('1')
    })

    test('removes correct script when multiple exist', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'First', color: '#ff0000', isActive: false, mode: 'direct' },
        { id: '2', name: 'Second', color: '#00ff00', isActive: false, mode: 'system' },
        { id: '3', name: 'Third', color: '#0000ff', isActive: false, mode: 'pac_script' },
      ]

      await SettingsWriter.deletePACScript('2')

      expect(savedSettings?.proxyConfigs).toHaveLength(2)
      expect(savedSettings?.proxyConfigs.find((s) => s.id === '2')).toBeUndefined()
    })
  })

  describe('toggleQuickSwitch', () => {
    test('enables quick switch', async () => {
      mockSettings.quickSwitchEnabled = false

      await SettingsWriter.toggleQuickSwitch(true)

      expect(savedSettings?.quickSwitchEnabled).toBe(true)
    })

    test('disables quick switch', async () => {
      mockSettings.quickSwitchEnabled = true

      await SettingsWriter.toggleQuickSwitch(false)

      expect(savedSettings?.quickSwitchEnabled).toBe(false)
    })
  })

  describe('updateAllScripts', () => {
    test('replaces all proxy configs', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Old Script', color: '#000', isActive: false, mode: 'direct' },
      ]

      const newScripts: ProxyConfig[] = [
        {
          id: 'new-1',
          name: 'New Script 1',
          color: '#ff0000',
          isActive: false,
          mode: 'pac_script',
        },
        { id: 'new-2', name: 'New Script 2', color: '#00ff00', isActive: false, mode: 'system' },
      ]

      await SettingsWriter.updateAllScripts(newScripts)

      expect(savedSettings?.proxyConfigs).toHaveLength(2)
      expect(savedSettings?.proxyConfigs[0].id).toBe('new-1')
      expect(savedSettings?.proxyConfigs[1].id).toBe('new-2')
    })

    test('can set empty scripts array', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Old Script', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.updateAllScripts([])

      expect(savedSettings?.proxyConfigs).toHaveLength(0)
    })
  })

  describe('updateScriptQuickSwitch', () => {
    test('enables quick switch for script', async () => {
      mockSettings.proxyConfigs = [
        {
          id: '1',
          name: 'Script',
          color: '#000',
          isActive: false,
          mode: 'direct',
          quickSwitch: false,
        },
      ]

      await SettingsWriter.updateScriptQuickSwitch('1', true)

      expect(savedSettings?.proxyConfigs[0].quickSwitch).toBe(true)
    })

    test('disables quick switch for script', async () => {
      mockSettings.proxyConfigs = [
        {
          id: '1',
          name: 'Script',
          color: '#000',
          isActive: false,
          mode: 'direct',
          quickSwitch: true,
        },
      ]

      await SettingsWriter.updateScriptQuickSwitch('1', false)

      expect(savedSettings?.proxyConfigs[0].quickSwitch).toBe(false)
    })

    test('does nothing when script not found', async () => {
      mockSettings.proxyConfigs = [
        { id: '1', name: 'Script', color: '#000', isActive: false, mode: 'direct' },
      ]

      await SettingsWriter.updateScriptQuickSwitch('non-existent', true)

      // Should not call saveSettings when script not found
      expect(mockStorageService.saveSettings).not.toHaveBeenCalled()
    })
  })

  describe('restoreSettings', () => {
    test('throws error for invalid settings file', async () => {
      const file = new File(['{}'], 'invalid.json', { type: 'application/json' })

      await expect(SettingsWriter.restoreSettings(file)).rejects.toThrow(
        'Failed to restore settings'
      )
    })

    test('throws error for non-JSON file content', async () => {
      const file = new File(['not json'], 'invalid.json', { type: 'application/json' })

      await expect(SettingsWriter.restoreSettings(file)).rejects.toThrow(
        'Failed to restore settings'
      )
    })

    test('restores valid settings file', async () => {
      const validSettings: AppSettings = {
        quickSwitchEnabled: true,
        activeScriptId: null,
        proxyConfigs: [],
        disableProxyOnStartup: false,
        autoReloadOnProxySwitch: true,
      }
      const file = new File([JSON.stringify(validSettings)], 'settings.json', {
        type: 'application/json',
      })

      await SettingsWriter.restoreSettings(file)

      expect(savedSettings?.quickSwitchEnabled).toBe(true)
    })

    test('provides default for disableProxyOnStartup if missing', async () => {
      const partialSettings = {
        quickSwitchEnabled: true,
        activeScriptId: null,
        proxyConfigs: [],
        autoReloadOnProxySwitch: true,
      }
      const file = new File([JSON.stringify(partialSettings)], 'settings.json', {
        type: 'application/json',
      })

      await SettingsWriter.restoreSettings(file)

      expect(savedSettings?.disableProxyOnStartup).toBe(false)
    })
  })
})
