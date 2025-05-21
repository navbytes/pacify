import { DEFAULT_SETTINGS } from '@/constants/app'
import {
  ERROR_TYPES,
  type AppSettings,
  type BackgroundMessage,
  type ProxyConfig,
} from '@/interfaces'
import { convertAppSettingsToChromeConfig } from '../../utils/chrome'
import {
  withErrorHandling,
  withErrorHandlingAndFallback,
} from '@/utils/errorHandling'
import { browserService } from './BrowserService'

export class ChromeService {
  // Detect if we're in a service worker context
  private static isServiceWorkerContext =
    typeof self !== 'undefined' &&
    typeof window === 'undefined' &&
    self.constructor.name === 'ServiceWorkerGlobalScope'

  // Reference to the browser service
  private static browser = browserService
  /**
   * Sets Chrome proxy settings based on proxy configuration
   */
  static setProxy = withErrorHandling(
    async (proxy: ProxyConfig): Promise<void> => {
      const details: chrome.types.ChromeSettingSetDetails = {
        value: convertAppSettingsToChromeConfig(proxy),
        scope: 'regular',
      }

      return new Promise((resolve, reject) => {
        this.browser.proxy.settings.set(details, () => {
          if (this.browser.runtime.lastError) {
            return reject(this.browser.runtime.lastError)
          }
          this.reloadActiveTab() // reload page after setting proxy
          resolve()
        })
      })
    },
    ERROR_TYPES.SET_PROXY
  )

  /**
   * Clears all proxy settings
   */
  static clearProxy = withErrorHandling(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.browser.proxy.settings.clear({}, () => {
        if (this.browser.runtime.lastError) {
          return reject(this.browser.runtime.lastError)
        }
        this.reloadActiveTab() // reload page after clearing proxy
        resolve()
      })
    })
  }, ERROR_TYPES.CLEAR_PROXY)

  /**
   * Reloads the current active tab
   */
  static async reloadActiveTab(): Promise<void> {
    try {
      if (this.isServiceWorkerContext) {
        const [activeTab] = await this.browser.tabs.query({
          active: true,
          currentWindow: true,
        })
        if (activeTab?.id) {
          await this.browser.tabs.reload(activeTab.id)
        }
      } else {
        // In a window context, we can use a simpler approach
        await this.browser.tabs.reload()
      }
    } catch (error) {
      console.error('Error reloading tab:', error)
    }
  }

  /**
   * Gets current proxy settings
   */
  static getProxy = withErrorHandlingAndFallback(
    async (): Promise<chrome.types.ChromeSettingGetResultDetails> => {
      return new Promise((resolve, reject) => {
        this.browser.proxy.settings.get({}, (config) => {
          if (this.browser.runtime.lastError) {
            return reject(this.browser.runtime.lastError)
          }
          resolve(config)
        })
      })
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { value: { mode: 'direct' }, levelOfControl: 'not_controllable' }
  )

  /**
   * Sends a message to the background script
   */
  static sendMessage = withErrorHandling(
    async <T extends BackgroundMessage>(message: T): Promise<void> => {
      await this.browser.runtime.sendMessage<T>(message)
    },
    ERROR_TYPES.SEND_MESSAGE
  )

  /**
   * Opens the options page
   */
  static openOptionsPage(): void {
    this.browser.runtime.openOptionsPage()
  }

  /**
   * Saves settings to sync storage
   */
  static setSyncSettings = withErrorHandling(
    async (settings: AppSettings): Promise<void> => {
      await this.browser.storage.sync.set({ settings })
    },
    ERROR_TYPES.SAVE_SETTINGS
  )

  /**
   * Gets settings from sync storage
   */
  static getSyncSettings = withErrorHandlingAndFallback(
    async (): Promise<AppSettings> => {
      const data = await this.browser.storage.sync.get('settings')
      return data.settings || DEFAULT_SETTINGS
    },
    ERROR_TYPES.FETCH_SETTINGS,
    DEFAULT_SETTINGS
  )
}
