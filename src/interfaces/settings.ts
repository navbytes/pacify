export interface AppSettings {
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  proxyConfigs: ProxyConfig[]
  disableProxyOnStartup: boolean
}

export interface Settings {
  notifications: boolean
}

type ProxyScheme = 'http' | 'https' | 'quic' | 'socks4' | 'socks5'

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
export type ProxyMode =
  | 'direct'
  | 'auto_detect'
  | 'pac_script'
  | 'fixed_servers'
  | 'system'
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
  }
  rules?: ProxyRules
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
  }
  rules?: ProxyRules
}
