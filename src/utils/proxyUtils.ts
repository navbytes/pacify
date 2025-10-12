import type { ProxyConfig, ProxyMode, ProxyServer, ProxySettings } from '@/interfaces'

/**
 * Creates a default proxy server configuration
 */
export function createDefaultProxyServer(): ProxyServer {
  return {
    scheme: 'http',
    host: '',
    port: '',
  }
}

/**
 * Creates default proxy settings
 */
export function createDefaultProxySettings(): ProxySettings {
  return {
    singleProxy: createDefaultProxyServer(),
    proxyForHttp: createDefaultProxyServer(),
    proxyForHttps: createDefaultProxyServer(),
    proxyForFtp: createDefaultProxyServer(),
    fallbackProxy: createDefaultProxyServer(),
    bypassList: [],
  }
}

/**
 * Creates a new proxy configuration with default values
 */
export function createEmptyProxyConfig(mode: ProxyMode = 'system'): Omit<ProxyConfig, 'id'> {
  return {
    name: '',
    color:
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0'), // Random color
    isActive: false,
    mode,
    quickSwitch: false,
  }
}

/**
 * Format bypass list from string to array and back
 */
export function formatBypassList(bypassList: string[] | string): string | string[] {
  if (typeof bypassList === 'string') {
    return bypassList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  return bypassList.join('\n')
}

/**
 * Validates a proxy server configuration
 */
export function validateProxyServer(server: ProxyServer): {
  isValid: boolean
  message?: string
} {
  if (!server.host) {
    return { isValid: false, message: 'Host is required' }
  }

  if (!server.port) {
    return { isValid: false, message: 'Port is required' }
  }

  const portNum = parseInt(server.port, 10)
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return {
      isValid: false,
      message: 'Port must be a number between 1 and 65535',
    }
  }

  return { isValid: true }
}

/**
 * Parses a proxy string from PAC script format to ProxyServer object
 * e.g. "PROXY host:port" => { scheme: "http", host: "host", port: "port" }
 */
export function parseProxyString(proxyString: string): ProxyServer | null {
  const match = proxyString.match(/^(PROXY|SOCKS|SOCKS4|SOCKS5|HTTP|HTTPS|QUIC)\s+([^:]+):(\d+)$/)
  if (!match) return null

  const [, type, host, port] = match

  const schemeMap: Record<string, string> = {
    PROXY: 'http',
    HTTP: 'http',
    HTTPS: 'https',
    QUIC: 'quic',
    SOCKS: 'socks5',
    SOCKS4: 'socks4',
    SOCKS5: 'socks5',
  }

  return {
    scheme: (schemeMap[type] as any) || 'http',
    host,
    port,
  }
}

/**
 * Formats a ProxyServer object to PAC script format
 */
export function formatProxyString(server: ProxyServer): string {
  const typeMap: Record<string, string> = {
    http: 'PROXY',
    https: 'HTTPS',
    quic: 'QUIC',
    socks4: 'SOCKS4',
    socks5: 'SOCKS5',
  }

  const type = typeMap[server.scheme] || 'PROXY'
  return `${type} ${server.host}:${server.port}`
}
