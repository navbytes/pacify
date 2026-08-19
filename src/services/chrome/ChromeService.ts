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

// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class ChromeService {
  /**
   * Sets Chrome proxy settings based on proxy configuration
   */
  static setProxy = withErrorHandling(
    async (proxy: ProxyConfig, autoReload: boolean = true): Promise<void> => {
      const details: chrome.types.ChromeSettingSetDetails<ChromeProxyConfig> = {
        value: convertAppSettingsToChromeConfig(proxy),
        scope: 'regular',
      }
      // ChromeProxyConfig types `port` as a string (that is what the settings
      // UI stores and what Chrome accepts — the e2e proxy-routing tests cover
      // it), while @types/chrome declares ProxyServer.port as a number. The
      // cast records that mismatch instead of hiding it; the previous
      // BrowserService wrapper typed this parameter as `unknown`, which
      // silently erased all type checking on the proxy config.
      await chrome.proxy.settings.set(
        details as unknown as chrome.types.ChromeSettingSetDetails<chrome.proxy.ProxyConfig>
      )

      // Reload active tab to apply proxy changes if enabled
      if (autoReload) {
        try {
          await ChromeService.reloadActiveTab()
        } catch (error) {
          logger.warn('Failed to reload tab (proxy still set):', error)
        }
      }
    },
    ERROR_TYPES.SET_PROXY
  )

  /**
   * Clears all proxy settings
   */
  static clearProxy = withErrorHandling(async (autoReload: boolean = true): Promise<void> => {
    await chrome.proxy.settings.clear({})

    // Reload active tab to apply proxy changes if enabled
    if (autoReload) {
      try {
        await ChromeService.reloadActiveTab()
      } catch (error) {
        logger.warn('Failed to reload tab (proxy still cleared):', error)
      }
    }
  }, ERROR_TYPES.CLEAR_PROXY)

  /**
   * Reloads the active tab
   */
  static async reloadActiveTab(): Promise<void> {
    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tabToReload = activeTabs.find((tab) => tab.id && tab.id > 0)

      if (tabToReload?.id) {
        await chrome.tabs.reload(tabToReload.id)
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
      return (await chrome.proxy.settings.get(
        {}
      )) as unknown as chrome.types.ChromeSettingGetDetails
    },
    ERROR_TYPES.FETCH_SETTINGS,
    { value: { mode: 'direct' }, levelOfControl: 'not_controllable' }
  )

  /**
   * Sends a message to the background script with response validation
   */
  static sendMessage = withErrorHandling(
    async <T extends BackgroundMessage>(message: T): Promise<void> => {
      const response = (await chrome.runtime.sendMessage(message)) as BackgroundMessageResponse

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
      const optionsUrl = `${chrome.runtime.getURL('options.html')}?${queryString}`
      chrome.tabs.create({ url: optionsUrl })
    } else {
      chrome.runtime.openOptionsPage()
    }
  }

  /**
   * Saves settings to sync storage
   */
  static setSyncSettings = withErrorHandling(async (settings: AppSettings): Promise<void> => {
    await chrome.storage.sync.set({ settings })
  }, ERROR_TYPES.SAVE_SETTINGS)

  /**
   * Gets settings from sync storage
   */
  static getSyncSettings = withErrorHandlingAndFallback(
    async (): Promise<AppSettings> => {
      const data = await chrome.storage.sync.get('settings')
      return (data.settings as AppSettings | undefined) || DEFAULT_SETTINGS
    },
    ERROR_TYPES.FETCH_SETTINGS,
    DEFAULT_SETTINGS
  )
}
