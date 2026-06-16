import type { ChromeProxyConfig, ProxyConfig } from '@/interfaces'

// Data-URL prefix Chrome uses for inline PAC scripts. We add an explicit
// `charset=utf-8` (Chrome's own `pacScript.data` handling omits it) so the
// bytes are decoded as UTF-8 instead of Latin-1.
const PAC_DATA_URL_PREFIX = 'data:application/x-ns-proxy-autoconfig;charset=utf-8;base64,'

function hasNonAscii(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) {
      return true
    }
  }
  return false
}

/**
 * Encode an inline PAC script as a base64 `data:` URL with an explicit UTF-8
 * charset.
 *
 * Chrome converts a `pacScript.data` value into a `data:` URL internally, but
 * it does not declare a charset. The PAC fetcher then defaults to Latin-1, so
 * any non-ASCII bytes — e.g. Chinese characters in comments — are mis-decoded
 * and the script can fail to load. Building the URL ourselves with
 * `charset=utf-8` keeps multi-byte content intact.
 */
function encodePacDataUrl(script: string): string {
  const bytes = new TextEncoder().encode(script)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return PAC_DATA_URL_PREFIX + btoa(binary)
}

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
    const url = proxyConfig.pacScript.url || ''
    const data = proxyConfig.pacScript.data || ''
    const mandatory = proxyConfig.pacScript.mandatory || false

    // Inline scripts containing non-ASCII characters (e.g. Chinese comments)
    // must be handed to Chrome as a UTF-8 `data:` URL. Chrome's own
    // `pacScript.data` path produces a charset-less data URL that gets decoded
    // as Latin-1, corrupting the script. Routing through `url` with an explicit
    // charset avoids that. ASCII-only scripts keep the original `data` path.
    if (!url && data && hasNonAscii(data)) {
      result.pacScript = {
        url: encodePacDataUrl(data),
        data: '',
        mandatory,
      }
    } else {
      result.pacScript = { url, data, mandatory }
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
    }

    // The bypass list applies to BOTH the single-proxy and per-protocol cases,
    // so it must live outside the if/else above. (Previously it was only set in
    // the per-protocol branch, so a single shared proxy silently ignored it.)
    if (proxyConfig.rules.bypassList && proxyConfig.rules.bypassList.length > 0) {
      result.rules.bypassList = proxyConfig.rules.bypassList
    }
  }

  // For other modes ("direct", "system", "auto_detect") no extra data is needed.
  return result
}
