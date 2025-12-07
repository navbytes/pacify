/**
 * Error Catalog - User-friendly error messages with suggestions
 * Phase 1: Foundation & Testing
 *
 * Provides helpful error messages and recovery suggestions
 */

export interface UserFacingError {
  title: string
  message: string
  suggestions: string[]
  recoverable: boolean
  retryAction?: () => Promise<void>
}

export const ERROR_CATALOG = {
  // Proxy Connection Errors
  PROXY_CONNECTION_FAILED: {
    title: 'Proxy Connection Failed',
    message: 'Could not connect through the proxy server',
    suggestions: [
      'Check if the proxy server is running and accessible',
      'Verify the host and port are correct',
      'Try testing the connection with the "Test" button',
      'Check your internet connection',
      'Make sure the proxy server allows connections from your IP'
    ],
    recoverable: true
  },

  PROXY_TIMEOUT: {
    title: 'Proxy Connection Timeout',
    message: 'The proxy server took too long to respond',
    suggestions: [
      'The proxy server may be overloaded or slow',
      'Try again in a few moments',
      'Check if the proxy server is responding',
      'Consider using a different proxy'
    ],
    recoverable: true
  },

  PROXY_AUTH_REQUIRED: {
    title: 'Proxy Authentication Required',
    message: 'The proxy server requires authentication',
    suggestions: [
      'This proxy requires a username and password',
      'Authentication support coming in Phase 4',
      'Contact your proxy administrator for credentials',
      'Try a different proxy that doesn\'t require authentication'
    ],
    recoverable: false
  },

  PROXY_HOST_UNREACHABLE: {
    title: 'Proxy Host Unreachable',
    message: 'Cannot reach the proxy server',
    suggestions: [
      'Check if the proxy host address is correct',
      'Verify the proxy server is online',
      'Check your network connection',
      'Try pinging the proxy server to verify connectivity'
    ],
    recoverable: true
  },

  // PAC Script Errors
  PAC_SCRIPT_SYNTAX_ERROR: {
    title: 'PAC Script Syntax Error',
    message: 'The PAC script contains syntax errors',
    suggestions: [
      'Review the script for typos or missing characters',
      'Check that all brackets and parentheses are balanced',
      'Ensure the FindProxyForURL function is defined correctly',
      'Use a JavaScript validator to find syntax issues',
      'Try one of the built-in templates as a starting point'
    ],
    recoverable: true
  },

  PAC_SCRIPT_SECURITY_ERROR: {
    title: 'PAC Script Security Issue',
    message: 'The PAC script contains potentially dangerous code',
    suggestions: [
      'Remove eval() or Function() calls - they are not allowed',
      'PAC scripts cannot access browser APIs or make network requests',
      'Use only standard PAC helper functions',
      'Review the security warnings for specific issues'
    ],
    recoverable: true
  },

  PAC_SCRIPT_MISSING_FUNCTION: {
    title: 'Missing FindProxyForURL Function',
    message: 'PAC script must define FindProxyForURL(url, host)',
    suggestions: [
      'Add the required function: function FindProxyForURL(url, host) { ... }',
      'The function must return a proxy string (e.g., "PROXY 192.168.1.1:8080" or "DIRECT")',
      'Use one of the built-in templates to get started',
      'See PAC script documentation for examples'
    ],
    recoverable: true
  },

  PAC_SCRIPT_URL_INVALID: {
    title: 'Invalid PAC Script URL',
    message: 'The PAC script URL is not valid',
    suggestions: [
      'URL must start with http:// or https://',
      'Check for typos in the URL',
      'Verify the PAC file is accessible from your network',
      'Try using an inline PAC script instead'
    ],
    recoverable: true
  },

  // Validation Errors
  VALIDATION_NAME_REQUIRED: {
    title: 'Proxy Name Required',
    message: 'Please enter a name for this proxy configuration',
    suggestions: [
      'Give the proxy a descriptive name (e.g., "Work Proxy", "Home VPN")',
      'Name helps you identify the proxy when switching',
      'Names can be up to 50 characters'
    ],
    recoverable: true
  },

  VALIDATION_HOST_INVALID: {
    title: 'Invalid Proxy Host',
    message: 'The proxy host address is not valid',
    suggestions: [
      'Host must be a domain name (e.g., proxy.company.com) or IP address',
      'Check for typos or extra characters',
      'Do not include the port number in the host field',
      'IPv4 format: 192.168.1.1',
      'IPv6 format: 2001:db8::1'
    ],
    recoverable: true
  },

  VALIDATION_PORT_INVALID: {
    title: 'Invalid Proxy Port',
    message: 'The port number is not valid',
    suggestions: [
      'Port must be a number between 1 and 65535',
      'Common proxy ports: 8080, 3128, 1080',
      'Check with your proxy administrator if unsure'
    ],
    recoverable: true
  },

  VALIDATION_NO_PROXY_CONFIGURED: {
    title: 'No Proxy Configured',
    message: 'At least one proxy server must be configured',
    suggestions: [
      'Add a proxy server for HTTP, HTTPS, FTP, or use shared proxy',
      'Or select a different proxy mode (PAC Script, Direct, etc.)',
      'Use "Shared Proxy" to use the same proxy for all protocols'
    ],
    recoverable: true
  },

  // Storage Errors
  STORAGE_QUOTA_EXCEEDED: {
    title: 'Storage Quota Exceeded',
    message: 'Not enough storage space to save settings',
    suggestions: [
      'Chrome Sync Storage is limited to 100KB',
      'Remove unused proxy configurations',
      'Shorten PAC scripts or use external PAC URLs',
      'Delete old proxy configurations you no longer use'
    ],
    recoverable: true
  },

  STORAGE_SYNC_ERROR: {
    title: 'Storage Sync Error',
    message: 'Failed to sync settings across devices',
    suggestions: [
      'Check your internet connection',
      'Make sure you are signed in to Chrome',
      'Settings are saved locally and will sync when connection is restored',
      'Try reloading the extension'
    ],
    recoverable: true
  },

  // General Errors
  NETWORK_ERROR: {
    title: 'Network Error',
    message: 'A network error occurred',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'If the problem persists, try restarting your browser'
    ],
    recoverable: true
  },

  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred',
    suggestions: [
      'Try the operation again',
      'Reload the extension if the problem persists',
      'Check the browser console for more details',
      'Report this issue if it continues to happen'
    ],
    recoverable: true
  }
} as const

export type ErrorCatalogKey = keyof typeof ERROR_CATALOG

/**
 * Get a user-facing error from the catalog
 */
export function getUserFacingError(
  key: ErrorCatalogKey,
  retryAction?: () => Promise<void>
): UserFacingError {
  const catalogError = ERROR_CATALOG[key]

  return {
    ...catalogError,
    retryAction
  }
}

/**
 * Convert a technical error to a user-facing error
 */
export function convertToUserFacingError(error: Error): UserFacingError {
  const message = error.message.toLowerCase()

  // Match error messages to catalog entries
  if (message.includes('timeout')) {
    return getUserFacingError('PROXY_TIMEOUT')
  }

  if (message.includes('network') || message.includes('fetch')) {
    return getUserFacingError('NETWORK_ERROR')
  }

  if (message.includes('syntax')) {
    return getUserFacingError('PAC_SCRIPT_SYNTAX_ERROR')
  }

  if (message.includes('quota') || message.includes('storage')) {
    return getUserFacingError('STORAGE_QUOTA_EXCEEDED')
  }

  // Default to unknown error
  return {
    ...ERROR_CATALOG.UNKNOWN_ERROR,
    message: error.message || 'An unexpected error occurred',
    recoverable: true
  }
}

/**
 * Format error for display in toast/alert
 */
export function formatErrorForDisplay(error: UserFacingError): string {
  let message = `${error.title}\n\n${error.message}`

  if (error.suggestions.length > 0) {
    message += '\n\nSuggestions:\n'
    message += error.suggestions.map(s => `• ${s}`).join('\n')
  }

  return message
}
