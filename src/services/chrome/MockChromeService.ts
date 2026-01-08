// MockChromeService.ts

import { DEFAULT_SETTINGS } from '@/constants/app'
import { ERROR_TYPES, type AppSettings } from '@/interfaces'
import { NotificationService } from '../NotificationService'

// Mock storage to simulate chrome.storage.sync
const mockStorage = {
  settings: DEFAULT_SETTINGS,
}

// Mock proxy configuration
let mockProxyConfig = {
  value: {
    mode: 'direct',
    pacScript: { data: '' },
  },
  levelOfControl: 'controlled_by_this_extension' as const,
}

export class MockChromeService {
  static async setProxy(data: string): Promise<void> {
    return new Promise((resolve) => {
      mockProxyConfig = {
        value: {
          mode: 'pac_script',
          pacScript: { data },
        },
        levelOfControl: 'controlled_by_this_extension',
      }
      this.reloadActiveTab()
      resolve()
    })
  }

  static async clearProxy(): Promise<void> {
    return new Promise((resolve) => {
      mockProxyConfig = {
        value: {
          mode: 'direct',
          pacScript: { data: '' },
        },
        levelOfControl: 'controlled_by_this_extension',
      }
      this.reloadActiveTab()
      resolve()
    })
  }

  static async reloadActiveTab(): Promise<void> {
    console.log('Mock: Reloading active tab')
  }

  static async getProxy(): Promise<typeof mockProxyConfig> {
    return Promise.resolve(mockProxyConfig)
  }

  static async sendMessage<T>(message: T): Promise<void> {
    console.log('Mock: Sending message:', message)
    return Promise.resolve()
  }

  static openOptionsPage(params?: Record<string, string>): void {
    console.log(
      'Mock: Opening options page',
      params ? `with params: ${JSON.stringify(params)}` : ''
    )
  }

  static async setSyncSettings(settings: AppSettings): Promise<void> {
    try {
      mockStorage.settings = settings
    } catch (error) {
      await NotificationService.error(ERROR_TYPES.SAVE_SETTINGS, error)
    }
  }

  static async getSyncSettings(): Promise<AppSettings> {
    try {
      return mockStorage.settings || DEFAULT_SETTINGS
    } catch (error) {
      await NotificationService.error(ERROR_TYPES.FETCH_SETTINGS, error)
      return DEFAULT_SETTINGS
    }
  }

  // Helper method to reset mock storage to initial state
  static resetMockStorage(): void {
    mockStorage.settings = DEFAULT_SETTINGS
    mockProxyConfig = {
      value: {
        mode: 'direct',
        pacScript: { data: '' },
      },
      levelOfControl: 'controlled_by_this_extension',
    }
  }

  // Helper method to get current mock storage state (for testing)
  static getMockStorage() {
    return mockStorage
  }

  // Helper method to get current proxy config (for testing)
  static getMockProxyConfig() {
    return mockProxyConfig
  }
}
