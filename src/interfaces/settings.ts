export interface AppSettings {
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  proxyConfigs: ProxyConfig[]
  disableProxyOnStartup: boolean
  autoReloadOnProxySwitch: boolean
}

export interface Settings {
  notifications: boolean
}

export type ProxyScheme = 'http' | 'https' | 'quic' | 'socks4' | 'socks5'

export interface ProxyServer {
  scheme: ProxyScheme
  host: string
  port: string
}

export interface ProxyRules {
  singleProxy?: ProxyServer
  proxyForHttp?: ProxyServer
  proxyForHttps?: ProxyServer
  proxyForFtp?: ProxyServer
  fallbackProxy?: ProxyServer
  bypassList?: string[]
}

// Auto-Proxy pattern matching types
export type AutoProxyMatchType = 'wildcard' | 'regex' | 'exact' | 'cidr'

// How a rule routes traffic
export type AutoProxyRouteType = 'existing' | 'inline' | 'direct'

// A single URL pattern rule within an Auto-Proxy config
export interface AutoProxyRule {
  id: string
  pattern: string
  matchType: AutoProxyMatchType
  proxyType: AutoProxyRouteType
  proxyId?: string // Reference to ProxyConfig.id (when proxyType === 'existing')
  inlineProxy?: ProxyServer // Inline definition (when proxyType === 'inline')
  enabled: boolean
  priority: number // Order in the list (lower = checked first)
  description?: string
}

// Configuration for an Auto-Proxy (URL-based routing)
export interface AutoProxyConfig {
  rules: AutoProxyRule[]
  fallbackType: AutoProxyRouteType
  fallbackProxyId?: string // When fallbackType === 'existing'
  fallbackInlineProxy?: ProxyServer // When fallbackType === 'inline'
}

export type ProxyMode = 'direct' | 'auto_detect' | 'pac_script' | 'fixed_servers' | 'system'
export interface ProxyConfig {
  id?: string
  name: string
  color: string
  quickSwitch?: boolean
  isActive: boolean
  mode: ProxyMode
  pacScript?: {
    url?: string
    data?: string
    mandatory?: boolean
    updateInterval?: number // in minutes, 0 means no auto-update
    lastFetched?: number // timestamp of last fetch
  }
  rules?: ProxyRules
  autoProxy?: AutoProxyConfig // Present for Auto-Proxy configs
}

export interface ProxySettings {
  singleProxy: ProxyServer
  proxyForHttp: ProxyServer
  proxyForHttps: ProxyServer
  proxyForFtp: ProxyServer
  fallbackProxy: ProxyServer
  bypassList: string[]
}

export type ProxyType = keyof Omit<ProxySettings, 'bypassList'>

export interface ChromeProxyConfig {
  mode: ProxyMode
  pacScript?: {
    url?: string
    data?: string
    mandatory?: boolean
    updateInterval?: number
    lastFetched?: number
  }
  rules?: ProxyRules
}
