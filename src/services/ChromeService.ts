import { DEFAULT_SETTINGS } from '@/constants/app'
import { ERROR_TYPES, type AppSettings } from '@/interfaces'
import { NotifyService } from './NotifyService'

export class ChromeService {
  static async setProxy(data: string): Promise<void> {
    const details: chrome.types.ChromeSettingSetDetails = {
      value: {
        mode: 'pac_script',
        pacScript: { data },
      },
      scope: 'regular',
    }
    return new Promise((resolve, reject) => {
      chrome.proxy.settings.set(details, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError)
        }
        this.reloadActiveTab() // reload page after setting proxy
        resolve()
      })
    })
  }
  static async clearProxy(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.proxy.settings.clear({}, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError)
        }
        this.reloadActiveTab() // reload page after clearing proxy
        resolve()
      })
    })
  }
  static async reloadActiveTab(): Promise<void> {
    chrome.tabs.reload()
  }
  static async getProxy(): Promise<chrome.types.ChromeSettingGetResultDetails> {
    return new Promise((resolve, reject) => {
      chrome.proxy.settings.get({}, (config) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError)
        }
        resolve(config)
      })
    })
  }

  static async sendMessage<T>(message: T): Promise<void> {
    await chrome.runtime.sendMessage<T>(message)
  }

  static openOptionsPage(): void {
    chrome.runtime.openOptionsPage()
  }

  static async setSyncSettings(settings: AppSettings): Promise<void> {
    try {
      await chrome.storage.sync.set({ settings })
    } catch (error) {
      NotifyService.error(ERROR_TYPES.SAVE_SETTINGS, error)
    }
  }

  static async getSyncSettings(): Promise<AppSettings> {
    try {
      const data = await chrome.storage.sync.get('settings')
      return data.settings || DEFAULT_SETTINGS
    } catch (error) {
      NotifyService.error(ERROR_TYPES.FETCH_SETTINGS, error)
      return DEFAULT_SETTINGS
    }
  }
}
