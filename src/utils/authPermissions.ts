/**
 * Utilities for the optional webRequest + webRequestAuthProvider permissions
 * that enable automatic proxy credential supply.
 *
 * These are declared as optional_permissions so they don't appear in the
 * install/update prompt for users who never configure proxy authentication.
 * The permissions are requested in context — when the user saves a proxy
 * config that contains credentials.
 */

const AUTH_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ['webRequest', 'webRequestAuthProvider'],
}

/** Returns true when both auth permissions are currently granted. */
export async function hasAuthPermissions(): Promise<boolean> {
  return chrome.permissions.contains(AUTH_PERMISSIONS)
}

/**
 * Request webRequest + webRequestAuthProvider from the user.
 * Must be called from a user-gesture handler (button click, form submit, etc.)
 * Returns true if granted, false if denied.
 */
export async function requestAuthPermissions(): Promise<boolean> {
  return chrome.permissions.request(AUTH_PERMISSIONS)
}

/**
 * Returns true if the given proxy config has any credentials configured
 * (manual proxy servers or Auto-Proxy inline proxies).
 */
export function proxyConfigHasCredentials(
  config: Partial<{
    rules?: {
      singleProxy?: { username?: string }
      proxyForHttp?: { username?: string }
      proxyForHttps?: { username?: string }
      proxyForFtp?: { username?: string }
      fallbackProxy?: { username?: string }
    }
    autoProxy?: {
      rules: { inlineProxy?: { username?: string } }[]
      fallbackInlineProxy?: { username?: string }
    }
  }>
): boolean {
  if (config.rules) {
    const servers = [
      config.rules.singleProxy,
      config.rules.proxyForHttp,
      config.rules.proxyForHttps,
      config.rules.proxyForFtp,
      config.rules.fallbackProxy,
    ]
    if (servers.some((s) => s?.username)) return true
  }
  if (config.autoProxy) {
    if (config.autoProxy.rules.some((r) => r.inlineProxy?.username)) return true
    if (config.autoProxy.fallbackInlineProxy?.username) return true
  }
  return false
}
