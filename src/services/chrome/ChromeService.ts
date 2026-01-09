import { DEFAULT_SETTINGS } from '@/constants/app'
import {
  type AppSettings,
  type BackgroundMessage,
  type BackgroundMessageResponse,
  type ChromeProxyConfig,
  ERROR_TYPES,
  type ProxyConfig,
} from '@/interfaces'
import { logger } from '@/services/LoggerService'
import { withErrorHandling, withErrorHandlingAndFallback } from '@/utils/errorHandling'
import { convertAppSettingsToChromeConfig } from '../../utils/chrome'
import { browserService } from './BrowserService'

export class ChromeService {
  // Reference to the browser service
  private static browser = browserService
  /**
   * Sets Chrome proxy settings based on proxy configuration
   */
  static setProxy = withErrorHandling(
    async (proxy: ProxyConfig, autoReload: boolean = true): Promise<void> => {
      const details: chrome.types.ChromeSettingSetDetails<ChromeProxyConfig> = {
        value: convertAppSettingsToChromeConfig(proxy),
        scope: 'regular',
      }

      return new Promise((resolve, reject) => {
        this.browser.proxy.settings.set(details, async () => {
          if (this.browser.runtime.lastError) {
            return reject(this.browser.runtime.lastError)
          }

          // Reload active tab to apply proxy changes if enabled
          if (autoReload) {
            try {
              await this.reloadActiveTab()
            } catch (error) {
              logger.warn('Failed to reload tab (proxy still set):', error)
            }
          }

          resolve()
        })
      })
    },
    ERROR_TYPES.SET_PROXY
  )

  /**
   * Clears all proxy settings
   */
  static clearProxy = withErrorHandling(async (autoReload: boolean = true): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.browser.proxy.settings.clear({}, async () => {
        if (this.browser.runtime.lastError) {
          return reject(this.browser.runtime.lastError)
        }

        // Reload active tab to apply proxy changes if enabled
        if (autoReload) {
          try {
            await this.reloadActiveTab()
          } catch (error) {
            logger.warn('Failed to reload tab (proxy still cleared):', error)
          }
        }

        resolve()
      })
    })
  }, ERROR_TYPES.CLEAR_PROXY)

  /**
   * Reloads the active tab
   */
  static async reloadActiveTab(): Promise<void> {
    try {
      const activeTabs = await ChromeService.browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      const tabToReload = activeTabs.find((tab) => tab.id && tab.id > 0)

      if (tabToReload?.id) {
        await ChromeService.browser.tabs.reload(tabToReload.id)
      }
    } catch (error) {
      logger.debug('Could not reload tab:', error)
    }
  }

  /**
   * Gets current proxy settings
   */
  static getProxy = withErrorHandlingAndFallback(
    async (): Promise<chrome.types.ChromeSettingGetDetails> => {
      return new Promise((resolve, reject) => {
        this.browser.proxy.settings.get({}, (config) => {
          if (this.browser.runtime.lastError) {
            return reject(this.browser.runtime.lastError)
          }
          resolve(config as unknown as chrome.types.ChromeSettingGetDetails)
        })
      })
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { value: { mode: 'direct' }, levelOfControl: 'not_controllable' }
  )

  /**
   * Sends a message to the background script with response validation
   */
  static sendMessage = withErrorHandling(
    async <T extends BackgroundMessage>(message: T): Promise<void> => {
      const response = (await this.browser.runtime.sendMessage<T>(
        message
      )) as BackgroundMessageResponse

      // Validate response from background script
      if (response && !response.success) {
        const errorMessage = response.error || 'Unknown error from background script'
        logger.error(`Background script returned error for ${message.type}:`, errorMessage)
        throw new Error(errorMessage)
      }

      logger.info(`Message ${message.type} processed successfully`)
    },
    ERROR_TYPES.SEND_MESSAGE
  )

  /**
   * Opens the options page with optional query parameters
   */
  static openOptionsPage(params?: Record<string, string>): void {
    if (params && Object.keys(params).length > 0) {
      // Build URL with query parameters
      const queryString = new URLSearchParams(params).toString()
      const optionsUrl = `${ChromeService.browser.runtime.getURL('src/options/options.html')}?${queryString}`
      ChromeService.browser.tabs.create({ url: optionsUrl })
    } else {
      ChromeService.browser.runtime.openOptionsPage()
    }
  }

  /**
   * Saves settings to sync storage
   */
  static setSyncSettings = withErrorHandling(async (settings: AppSettings): Promise<void> => {
    await this.browser.storage.sync.set({ settings })
  }, ERROR_TYPES.SAVE_SETTINGS)

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
