import { describe, it, expect, vi, beforeEach } from 'vitest'
import { proxyStore } from '../proxyStore'
import type { ProxyConfig } from '@/interfaces'
import { get } from 'svelte/store'

// Mock ChromeService
vi.mock('@/services/chrome', () => ({
  ChromeService: {
    sendMessage: vi.fn().mockResolvedValue({}),
  },
}))

describe('ProxyStore', () => {
  beforeEach(() => {
    // Reset store before each test
    proxyStore.init([], null)
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty configs', () => {
      const state = proxyStore.getState()
      expect(state.configs).toEqual([])
      expect(state.activeScriptId).toBeNull()
    })

    it('should initialize with provided configs', () => {
      const mockConfigs: ProxyConfig[] = [
        {
          id: '1',
          name: 'Test Proxy',
          color: '#FF0000',
          isActive: false,
          mode: 'pac_script',
          quickSwitch: false,
        },
      ]

      proxyStore.init(mockConfigs, '1')
      const state = proxyStore.getState()

      expect(state.configs).toEqual(mockConfigs)
      expect(state.activeScriptId).toBe('1')
    })
  })

  describe('upsertConfig', () => {
    it('should add new config when scriptId is null', () => {
      const newConfig: Omit<ProxyConfig, 'id'> = {
        name: 'New Proxy',
        color: '#00FF00',
        isActive: false,
        mode: 'pac_script',
        quickSwitch: false,
      }

      const id = proxyStore.upsertConfig(newConfig, null)
      const state = proxyStore.getState()

      expect(id).toBeTruthy()
      expect(state.configs).toHaveLength(1)
      expect(state.configs[0].name).toBe('New Proxy')
    })

    it('should update existing config when scriptId is provided', () => {
      // First add a config
      const initialConfig: Omit<ProxyConfig, 'id'> = {
        name: 'Initial',
        color: '#FF0000',
        isActive: false,
        mode: 'pac_script',
        quickSwitch: false,
      }
      const id = proxyStore.upsertConfig(initialConfig, null)

      // Then update it
      const updatedConfig: Omit<ProxyConfig, 'id'> = {
        ...initialConfig,
        name: 'Updated',
      }
      proxyStore.upsertConfig(updatedConfig, id)

      const state = proxyStore.getState()
      expect(state.configs[0].name).toBe('Updated')
    })
  })

  describe('deleteConfig', () => {
    it('should remove config by id', () => {
      const config: Omit<ProxyConfig, 'id'> = {
        name: 'Test',
        color: '#FF0000',
        isActive: false,
        mode: 'pac_script',
        quickSwitch: false,
      }
      const id = proxyStore.upsertConfig(config, null)

      proxyStore.deleteConfig(id)
      const state = proxyStore.getState()

      expect(state.configs).toHaveLength(0)
    })

    it('should return true if deleted config was active', () => {
      const config: Omit<ProxyConfig, 'id'> = {
        name: 'Test',
        color: '#FF0000',
        isActive: false,
        mode: 'pac_script',
        quickSwitch: false,
      }
      const id = proxyStore.upsertConfig(config, null)
      proxyStore.init(proxyStore.getState().configs, id)

      const wasActive = proxyStore.deleteConfig(id)

      expect(wasActive).toBe(true)
    })
  })

  describe('updateQuickSwitch', () => {
    it('should update quick switch status', () => {
      const config: Omit<ProxyConfig, 'id'> = {
        name: 'Test',
        color: '#FF0000',
        isActive: false,
        mode: 'pac_script',
        quickSwitch: false,
      }
      const id = proxyStore.upsertConfig(config, null)

      proxyStore.updateQuickSwitch(id, true)
      const state = proxyStore.getState()

      expect(state.configs[0].quickSwitch).toBe(true)
    })
  })

  describe('derived stores', () => {
    it('should filter quick switch scripts', () => {
      const configs: Omit<ProxyConfig, 'id'>[] = [
        {
          name: 'Quick 1',
          color: '#FF0000',
          isActive: false,
          mode: 'pac_script',
          quickSwitch: true,
        },
        {
          name: 'Normal',
          color: '#00FF00',
          isActive: false,
          mode: 'pac_script',
          quickSwitch: false,
        },
        {
          name: 'Quick 2',
          color: '#0000FF',
          isActive: false,
          mode: 'pac_script',
          quickSwitch: true,
        },
      ]

      configs.forEach((c) => proxyStore.upsertConfig(c, null))

      const quickScripts = get(proxyStore.quickSwitchScripts)
      expect(quickScripts).toHaveLength(2)
    })

    it('should return active script', () => {
      const config: Omit<ProxyConfig, 'id'> = {
        name: 'Active',
        color: '#FF0000',
        isActive: true,
        mode: 'pac_script',
        quickSwitch: false,
      }
      const id = proxyStore.upsertConfig(config, null)
      proxyStore.init([{ ...config, id, isActive: true }], id)

      const active = get(proxyStore.activeScript)
      expect(active?.name).toBe('Active')
    })
  })
})
