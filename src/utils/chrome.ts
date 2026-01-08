import type { ChromeProxyConfig, ProxyConfig } from '@/interfaces'

/**

Converts an AppSettings object to a Chrome proxy configuration object.
@param appSettings - The complete application settings that include a list of proxy configurations.
@returns An object to be used with chrome.proxy.settings.set.
*/
export function convertAppSettingsToChromeConfig(proxyConfig: ProxyConfig): ChromeProxyConfig {
  // If no active proxy configuration is found, return a default configuration (e.g. direct)
  if (!proxyConfig) {
    return { mode: 'direct' }
  }

  // Start with the mode from the active configuration.
  const result: ChromeProxyConfig = {
    mode: proxyConfig.mode,
  }

  // For pac_script mode, include the pacScript details.
  if (proxyConfig.mode === 'pac_script' && proxyConfig.pacScript) {
    result.pacScript = {
      url: proxyConfig.pacScript.url || '',
      data: proxyConfig.pacScript.data || '',
      mandatory: proxyConfig.pacScript.mandatory || false,
    }
  }
  // For fixed_servers mode, include the proxy rules.
  else if (proxyConfig.mode === 'fixed_servers' && proxyConfig.rules) {
    result.rules = {}
    if (proxyConfig.rules.singleProxy) {
      result.rules.singleProxy = {
        scheme: proxyConfig.rules.singleProxy.scheme || 'http',
        host: proxyConfig.rules.singleProxy.host || '',
        port: proxyConfig.rules.singleProxy.port || '',
      }
    } else {
      // Use the values from activeConfig.rules if available, otherwise fall back to default empty fields.
      if (proxyConfig.rules.proxyForHttp)
        result.rules.proxyForHttp = proxyConfig.rules.proxyForHttp || {
          scheme: 'http',
          host: '',
          port: '',
        }
      if (proxyConfig.rules.proxyForHttps) {
        result.rules.proxyForHttps = proxyConfig.rules.proxyForHttps || {
          scheme: 'http',
          host: '',
          port: '',
        }
      }
      if (proxyConfig.rules.proxyForFtp) {
        result.rules.proxyForFtp = proxyConfig.rules.proxyForFtp || {
          scheme: 'http',
          host: '',
          port: '',
        }
      }
      if (proxyConfig.rules.fallbackProxy) {
        result.rules.fallbackProxy = proxyConfig.rules.fallbackProxy || {
          scheme: 'http',
          host: '',
          port: '',
        }
      }
      if (proxyConfig.rules.bypassList) {
        result.rules.bypassList = proxyConfig.rules.bypassList || []
      }
    }
  }

  // For other modes ("direct", "system", "auto_detect") no extra data is needed.
  return result
}
