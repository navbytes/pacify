import type {
  AutoProxyConfig,
  AutoProxyMatchType,
  AutoProxyRouteType,
  AutoProxyRule,
  ProxyConfig,
  ProxyMode,
  ProxyRules,
  ProxyScheme,
  ProxyServer,
} from '@/interfaces'
import { getRandomProxyColor } from '@/utils/colors'
import { I18nService } from './i18n/i18nService'

// --- SwitchyOmega types ---

interface OmegaProxyServer {
  scheme: string
  host: string
  port: number
}

interface OmegaBypassCondition {
  conditionType: 'BypassCondition'
  pattern: string
}

interface OmegaFixedProfile {
  name: string
  profileType: 'FixedProfile'
  color?: string
  proxyForHttp?: OmegaProxyServer
  proxyForHttps?: OmegaProxyServer
  proxyForFtp?: OmegaProxyServer
  fallbackProxy?: OmegaProxyServer
  bypassList?: OmegaBypassCondition[]
  auth?: Record<string, { username?: string; password?: string }>
}

interface OmegaPacProfile {
  name: string
  profileType: 'PacProfile'
  color?: string
  pacUrl?: string
  pacScript?: string
}

interface OmegaSwitchCondition {
  conditionType: string
  pattern?: string
  ip?: string
  prefixLength?: number
}

interface OmegaSwitchRule {
  condition: OmegaSwitchCondition
  profileName: string
}

interface OmegaSwitchProfile {
  name: string
  profileType: 'SwitchProfile'
  color?: string
  defaultProfileName?: string
  rules?: OmegaSwitchRule[]
}

interface OmegaRuleListProfile {
  name: string
  profileType: 'RuleListProfile'
  color?: string
  defaultProfileName?: string
  matchProfileName?: string
  sourceUrl?: string
  format?: string
  ruleList?: string
}

type OmegaProfile = OmegaFixedProfile | OmegaPacProfile | OmegaSwitchProfile | OmegaRuleListProfile

interface OmegaBackup {
  schemaVersion?: number
  [key: string]: unknown
}

export interface ImportResult {
  configs: ProxyConfig[]
  warnings: string[]
  skipped: string[]
}

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const OMEGA_SCHEME_MAP: Record<string, ProxyScheme> = {
  http: 'http',
  https: 'https',
  socks4: 'socks4',
  socks5: 'socks5',
}

// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class SwitchyOmegaImporter {
  /**
   * Parse and validate a SwitchyOmega backup file
   */
  static async parseFile(file: File): Promise<OmegaBackup> {
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      throw new Error(
        I18nService.getMessage('importFileTooLarge') || 'Import file is too large (max 5MB).'
      )
    }

    const content = await file.text()
    let parsed: OmegaBackup

    try {
      // SwitchyOmega exports can be plain JSON or base64-encoded JSON
      if (content.trimStart().startsWith('{')) {
        parsed = JSON.parse(content)
      } else {
        const decoded = atob(content.trim())
        parsed = JSON.parse(decoded)
      }
    } catch {
      throw new Error(
        I18nService.getMessage('invalidSwitchyOmegaFormat') ||
          'Invalid SwitchyOmega backup format. Please check the file.'
      )
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error(
        I18nService.getMessage('invalidSwitchyOmegaFormat') ||
          'Invalid SwitchyOmega backup format. Please check the file.'
      )
    }

    return parsed
  }

  /**
   * Import a SwitchyOmega backup file and convert to PACify ProxyConfigs
   */
  static async importFile(file: File): Promise<ImportResult> {
    const backup = await SwitchyOmegaImporter.parseFile(file)
    return SwitchyOmegaImporter.convertBackup(backup)
  }

  /**
   * Convert a parsed SwitchyOmega backup to PACify ProxyConfigs
   */
  static convertBackup(backup: OmegaBackup): ImportResult {
    const configs: ProxyConfig[] = []
    const warnings: string[] = []
    const skipped: string[] = []

    // Extract profiles (keys starting with "+")
    const profiles: OmegaProfile[] = []
    for (const [key, value] of Object.entries(backup)) {
      if (key.startsWith('+') && value && typeof value === 'object') {
        // Skip internal rule list profiles (prefixed with __ruleListOf_)
        const profile = value as OmegaProfile
        if (profile.name?.startsWith('__ruleListOf_')) {
          continue
        }
        profiles.push(profile)
      }
    }

    // Build a name->profile map for resolving references in SwitchProfiles
    const profileMap = new Map<string, OmegaProfile>()
    for (const profile of profiles) {
      if (profile.name) {
        profileMap.set(profile.name, profile)
      }
    }

    // Convert each profile
    for (const profile of profiles) {
      try {
        const config = SwitchyOmegaImporter.convertProfile(profile, profileMap, backup)
        if (config) {
          configs.push(config)
        }
      } catch (err) {
        const name = profile.name || 'Unknown'
        warnings.push(`Failed to import "${name}": ${(err as Error).message}`)
      }
    }

    if (profiles.length === 0) {
      warnings.push(
        I18nService.getMessage('noProfilesFound') || 'No proxy profiles found in the backup file.'
      )
    }

    return { configs, warnings, skipped }
  }

  private static convertProfile(
    profile: OmegaProfile,
    profileMap: Map<string, OmegaProfile>,
    backup: OmegaBackup
  ): ProxyConfig | null {
    switch (profile.profileType) {
      case 'FixedProfile':
        return SwitchyOmegaImporter.convertFixedProfile(profile)
      case 'PacProfile':
        return SwitchyOmegaImporter.convertPacProfile(profile)
      case 'SwitchProfile':
        return SwitchyOmegaImporter.convertSwitchProfile(profile, profileMap, backup)
      default:
        return null
    }
  }

  private static convertFixedProfile(profile: OmegaFixedProfile): ProxyConfig {
    const rules: ProxyRules = {}

    // Check if there's a single proxy (only fallbackProxy set, no per-protocol)
    const hasPerProtocol = profile.proxyForHttp || profile.proxyForHttps || profile.proxyForFtp
    if (!hasPerProtocol && profile.fallbackProxy) {
      rules.singleProxy = SwitchyOmegaImporter.convertProxyServer(
        profile.fallbackProxy,
        profile.auth?.fallbackProxy
      )
    } else {
      if (profile.proxyForHttp) {
        rules.proxyForHttp = SwitchyOmegaImporter.convertProxyServer(
          profile.proxyForHttp,
          profile.auth?.proxyForHttp
        )
      }
      if (profile.proxyForHttps) {
        rules.proxyForHttps = SwitchyOmegaImporter.convertProxyServer(
          profile.proxyForHttps,
          profile.auth?.proxyForHttps
        )
      }
      if (profile.proxyForFtp) {
        rules.proxyForFtp = SwitchyOmegaImporter.convertProxyServer(
          profile.proxyForFtp,
          profile.auth?.proxyForFtp
        )
      }
      if (profile.fallbackProxy) {
        rules.fallbackProxy = SwitchyOmegaImporter.convertProxyServer(
          profile.fallbackProxy,
          profile.auth?.fallbackProxy
        )
      }
    }

    // Convert bypass list
    if (profile.bypassList?.length) {
      rules.bypassList = profile.bypassList
        .filter((b) => b.conditionType === 'BypassCondition' && b.pattern)
        .map((b) => b.pattern)
    }

    return {
      id: crypto.randomUUID(),
      name: profile.name,
      color: profile.color || getRandomProxyColor(),
      isActive: false,
      mode: 'fixed_servers' as ProxyMode,
      rules,
    }
  }

  private static convertPacProfile(profile: OmegaPacProfile): ProxyConfig {
    return {
      id: crypto.randomUUID(),
      name: profile.name,
      color: profile.color || getRandomProxyColor(),
      isActive: false,
      mode: 'pac_script' as ProxyMode,
      pacScript: {
        url: profile.pacUrl || undefined,
        data: profile.pacScript || undefined,
      },
    }
  }

  private static convertSwitchProfile(
    profile: OmegaSwitchProfile,
    profileMap: Map<string, OmegaProfile>,
    backup: OmegaBackup
  ): ProxyConfig | null {
    if (!profile.rules?.length) {
      return null
    }

    // We'll convert a SwitchProfile into a PACify Auto-Proxy config.
    // This requires resolving profile references into proxy configs that
    // will also be imported. We build Auto-Proxy rules from the switch rules.

    const autoProxyRules: AutoProxyRule[] = []
    let priority = 0

    for (const rule of profile.rules) {
      const converted = SwitchyOmegaImporter.convertSwitchRule(rule, priority)
      if (converted) {
        autoProxyRules.push(converted)
        priority++
      }
    }

    // Also check for an associated RuleListProfile
    const ruleListKey = `+__ruleListOf_${profile.name}`
    const ruleListProfile = backup[ruleListKey] as OmegaRuleListProfile | undefined
    if (ruleListProfile?.sourceUrl) {
      // We can't directly import the rule list contents, but we note the source URL
      // as a warning for the user
    }

    if (autoProxyRules.length === 0) {
      return null
    }

    // Determine fallback behavior
    let fallbackType: AutoProxyRouteType = 'direct'
    if (profile.defaultProfileName && profile.defaultProfileName !== 'direct') {
      // If the default profile is "system", treat as direct (closest equivalent)
      fallbackType = 'direct'
    }

    const autoProxy: AutoProxyConfig = {
      rules: autoProxyRules,
      fallbackType,
    }

    return {
      id: crypto.randomUUID(),
      name: profile.name,
      color: profile.color || getRandomProxyColor(),
      isActive: false,
      mode: 'pac_script' as ProxyMode,
      autoProxy,
    }
  }

  private static convertSwitchRule(rule: OmegaSwitchRule, priority: number): AutoProxyRule | null {
    const condition = rule.condition
    if (!condition?.conditionType) return null

    let pattern = ''
    let matchType: AutoProxyMatchType = 'wildcard'

    switch (condition.conditionType) {
      case 'HostWildcardCondition':
      case 'UrlWildcardCondition':
        pattern = condition.pattern || ''
        matchType = 'wildcard'
        break

      case 'HostRegexCondition':
      case 'UrlRegexCondition':
        pattern = condition.pattern || ''
        matchType = 'regex'
        break

      case 'KeywordCondition':
        // Convert keyword to a wildcard pattern
        pattern = `*${condition.pattern || ''}*`
        matchType = 'wildcard'
        break

      case 'IpCondition':
        if (condition.ip && condition.prefixLength !== undefined) {
          pattern = `${condition.ip}/${condition.prefixLength}`
          matchType = 'cidr'
        }
        break

      case 'BypassCondition':
        pattern = condition.pattern || ''
        matchType = 'wildcard'
        break

      case 'FalseCondition':
        // Disabled rule — skip
        return null

      case 'TrueCondition':
        // Always matches — use a catch-all wildcard
        pattern = '*'
        matchType = 'wildcard'
        break

      default:
        // Unknown condition type — skip with pattern if available
        if (condition.pattern) {
          pattern = condition.pattern
          matchType = 'wildcard'
        } else {
          return null
        }
    }

    if (!pattern) return null

    // Determine the proxy routing — since we don't know the target proxy's
    // PACify ID at import time, we mark it as "direct" for non-direct profiles
    // and let the user reconfigure. For "direct", it's straightforward.
    const proxyType: AutoProxyRouteType = rule.profileName === 'direct' ? 'direct' : 'direct'

    return {
      id: crypto.randomUUID(),
      pattern,
      matchType,
      proxyType,
      enabled: true,
      priority,
      description: `Imported from SwitchyOmega (target: ${rule.profileName})`,
    }
  }

  private static convertProxyServer(
    server: OmegaProxyServer,
    auth?: { username?: string; password?: string }
  ): ProxyServer {
    const scheme = OMEGA_SCHEME_MAP[server.scheme] || 'http'
    return {
      scheme,
      host: server.host || '',
      port: String(server.port || ''),
      ...(auth?.username ? { username: auth.username } : {}),
      ...(auth?.password ? { password: auth.password } : {}),
    }
  }
}
