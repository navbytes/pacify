import type {
  ChromeProxyConfig,
  ChromeProxyRules,
  ChromeProxyServer,
  ProxyConfig,
  ProxyRules,
  ProxyServer,
} from '@/interfaces'

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
 * Convert one stored proxy server into Chrome's shape, or `null` if it is not
 * usable.
 *
 * A server is only sent to Chrome when it has both a host and a port that
 * parses to a valid TCP port. Anything else is dropped: Chrome rejects the
 * *entire* config if any server is malformed, which previously left the
 * extension reporting a proxy as active while traffic went out unproxied.
 */
export function toChromeProxyServer(server: ProxyServer | undefined): ChromeProxyServer | null {
  if (!server) return null

  const host = server.host?.trim()
  if (!host) return null

  const port = Number.parseInt(String(server.port ?? '').trim(), 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null

  return { scheme: server.scheme || 'http', host, port }
}

/**
 * Convert Chrome's proxy rules back into the app's storage shape.
 *
 * The inverse of {@link toChromeProxyServer}: Chrome hands back numeric ports,
 * but the settings form and everything we persist use strings. Assigning
 * Chrome's rules straight across (as the "import current browser proxy" flow
 * used to) writes numbers into a field the rest of the app reads as a string.
 */
export function fromChromeProxyRules(rules: ChromeProxyRules): ProxyRules {
  const toApp = (s: ChromeProxyServer | undefined): ProxyServer | undefined =>
    s ? { scheme: s.scheme, host: s.host, port: String(s.port) } : undefined

  return {
    singleProxy: toApp(rules.singleProxy),
    proxyForHttp: toApp(rules.proxyForHttp),
    proxyForHttps: toApp(rules.proxyForHttps),
    proxyForFtp: toApp(rules.proxyForFtp),
    fallbackProxy: toApp(rules.fallbackProxy),
    bypassList: rules.bypassList,
  }
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
    const single = toChromeProxyServer(proxyConfig.rules.singleProxy)
    if (single) {
      result.rules.singleProxy = single
    } else {
      // Per-protocol servers. Each is included only if fully specified; the
      // form renders an input group for every protocol, so the unused ones
      // arrive here empty and must not be forwarded.
      const perProtocol = {
        proxyForHttp: toChromeProxyServer(proxyConfig.rules.proxyForHttp),
        proxyForHttps: toChromeProxyServer(proxyConfig.rules.proxyForHttps),
        proxyForFtp: toChromeProxyServer(proxyConfig.rules.proxyForFtp),
        fallbackProxy: toChromeProxyServer(proxyConfig.rules.fallbackProxy),
      } as const
      for (const [key, server] of Object.entries(perProtocol)) {
        if (server) result.rules[key as keyof typeof perProtocol] = server
      }
    }

    // No usable server means there is nothing to proxy through. Chrome would
    // reject the config and quietly leave the previous setting in place, so the
    // extension would show the proxy as active while traffic went out
    // unproxied. Throwing surfaces it: setProxy is wrapped in
    // withErrorHandling, which reports the failure to the user.
    if (!result.rules.singleProxy && Object.keys(result.rules).length === 0) {
      throw new Error('This proxy has no usable server. Set a host and a port between 1 and 65535.')
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
