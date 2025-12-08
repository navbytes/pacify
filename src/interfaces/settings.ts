export interface AppSettings {
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  proxyConfigs: ProxyConfig[]
  disableProxyOnStartup: boolean
  autoReloadOnProxySwitch: boolean
  testUrl: string // URL used for testing proxy connections
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
export type ProxyMode = 'direct' | 'auto_detect' | 'pac_script' | 'fixed_servers' | 'system'

// Phase 1: Proxy Testing
export interface ProxyTestResult {
  success: boolean
  responseTime?: number
  statusCode?: number
  error?: string
  testedAt: Date
  testUrl: string
}

// Phase 1: PAC Script Analysis
export type SecuritySeverity = 'critical' | 'warning' | 'info'

export interface SecurityIssue {
  severity: SecuritySeverity
  message: string
  line?: number
}

export interface PACAnalysisResult {
  syntax: {
    valid: boolean
    errors: string[]
  }
  security: SecurityIssue[]
  warnings: string[]
}

// Phase 1: Validation
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Phase 2: Usage Statistics
export interface ProxyStats {
  proxyId: string
  activationCount: number // Total times activated
  totalActiveTime: number // Total milliseconds active
  lastActivated?: Date // Last activation timestamp
  lastDeactivated?: Date // Last deactivation timestamp
  createdAt: Date // When stats tracking started
}

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
  // Phase 1: Testing support
  lastTestResult?: ProxyTestResult
  autoTest?: boolean
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
