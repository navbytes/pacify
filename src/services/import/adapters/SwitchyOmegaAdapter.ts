import type {
  AutoProxyConfig,
  AutoProxyMatchType,
  AutoProxyRouteType,
  AutoProxyRule,
  AutoProxySubscription,
  ProxyConfig,
  ProxyRules,
  SubscriptionFormat,
} from '@/interfaces'
import { SubscriptionParser } from '../../SubscriptionParser'
import type { ImportReport, ImportResult, ImportWarning } from '../types'
import { hasCredentials, isSafePattern, pickColor, toProxyServer } from '../utils'

/** Built-in SwitchyOmega profiles that map to a Chrome proxy mode, not a config. */
const BUILTIN_DIRECT = new Set(['direct', 'system', 'auto_detect'])

interface SOCondition {
  conditionType?: string
  pattern?: string
  ip?: string
  prefixLength?: number
}

interface SORule {
  condition?: SOCondition
  profileName?: string
}

interface SOProfile {
  profileType?: string
  name?: string
  color?: string
  // FixedProfile
  fallbackProxy?: unknown
  proxyForHttp?: unknown
  proxyForHttps?: unknown
  proxyForFtp?: unknown
  bypassList?: unknown
  // PacProfile
  pacUrl?: string
  pacScript?: string
  // SwitchProfile
  rules?: SORule[]
  defaultProfileName?: string
  // RuleListProfile
  format?: string
  ruleList?: string
  sourceUrl?: string
  matchProfileName?: string
  [key: string]: unknown
}

interface ResolvedRoute {
  proxyType: AutoProxyRouteType
  proxyId?: string
}

/**
 * Parse a Proxy SwitchyOmega / ZeroOmega `.bak` export into PACify configs.
 *
 * Profiles live under `+name` keys. We do two passes so that switch rules,
 * which reference other profiles *by name*, can be wired to the freshly
 * generated ids of the configs created in the first pass.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class SwitchyOmegaAdapter {
  static readonly source = 'switchyomega' as const

  static map(input: unknown): ImportResult {
    const warnings: ImportWarning[] = []

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return SwitchyOmegaAdapter.empty(warnings)
    }

    const root = input as Record<string, unknown>

    // Gather profiles (keys prefixed with "+").
    const profiles: { key: string; name: string; profile: SOProfile }[] = []
    for (const [key, value] of Object.entries(root)) {
      if (!key.startsWith('+') || !value || typeof value !== 'object') continue
      const profile = value as SOProfile
      const name = (typeof profile.name === 'string' && profile.name) || key.slice(1)
      profiles.push({ key, name, profile })
    }

    if (profiles.length === 0) {
      return SwitchyOmegaAdapter.empty(warnings)
    }

    // Pass 1: pre-assign an id to every profile so cross-references resolve.
    const idByName = new Map<string, string>()
    for (const { name } of profiles) {
      if (!idByName.has(name)) idByName.set(name, crypto.randomUUID())
    }

    const resolveRoute = (profileName: string | undefined, ctx: string): ResolvedRoute => {
      const target = (profileName || '').trim()
      if (!target || BUILTIN_DIRECT.has(target.toLowerCase())) {
        if (target && target.toLowerCase() !== 'direct') {
          warnings.push({
            level: 'warning',
            context: ctx,
            message: `Routes to "${target}", which has no PACify equivalent — using Direct.`,
          })
        }
        return { proxyType: 'direct' }
      }
      const id = idByName.get(target)
      if (!id) {
        warnings.push({
          level: 'warning',
          context: ctx,
          message: `Routes to unknown profile "${target}" — using Direct.`,
        })
        return { proxyType: 'direct' }
      }
      return { proxyType: 'existing', proxyId: id }
    }

    const configs: ProxyConfig[] = []
    let ruleCount = 0

    for (const { name, profile } of profiles) {
      const id = idByName.get(name) as string
      const color = pickColor(profile.color)
      const type = profile.profileType

      switch (type) {
        case 'FixedProfile': {
          const rules = SwitchyOmegaAdapter.mapFixedProfile(profile, name, warnings)
          configs.push({ id, name, color, isActive: false, mode: 'fixed_servers', rules })
          break
        }
        case 'PacProfile': {
          const pacScript = SwitchyOmegaAdapter.mapPacProfile(profile)
          configs.push({ id, name, color, isActive: false, mode: 'pac_script', pacScript })
          break
        }
        case 'SwitchProfile': {
          const autoProxy = SwitchyOmegaAdapter.mapSwitchProfile(profile, name, resolveRoute)
          ruleCount += autoProxy.rules.length
          configs.push({ id, name, color, isActive: false, mode: 'pac_script', autoProxy })
          break
        }
        case 'RuleListProfile': {
          const autoProxy = SwitchyOmegaAdapter.mapRuleListProfile(
            profile,
            name,
            resolveRoute,
            warnings
          )
          ruleCount += autoProxy.subscriptions?.[0]?.cachedRules?.length ?? 0
          configs.push({ id, name, color, isActive: false, mode: 'pac_script', autoProxy })
          break
        }
        case 'DirectProfile':
          configs.push({ id, name, color, isActive: false, mode: 'direct' })
          break
        case 'SystemProfile':
          configs.push({ id, name, color, isActive: false, mode: 'system' })
          break
        default:
          warnings.push({
            level: 'skipped',
            context: name,
            message: `Unsupported profile type "${type ?? 'unknown'}" — skipped.`,
          })
      }
    }

    // Drop ids of skipped profiles so dangling references warn correctly.
    const builtConfigIds = new Set(configs.map((c) => c.id))
    for (const config of configs) {
      const rules = config.autoProxy?.rules ?? []
      for (const rule of rules) {
        if (rule.proxyType === 'existing' && rule.proxyId && !builtConfigIds.has(rule.proxyId)) {
          rule.proxyType = 'direct'
          rule.proxyId = undefined
        }
      }
    }

    const report: ImportReport = {
      source: 'switchyomega',
      proxyCount: configs.length,
      ruleCount,
      warnings,
    }

    return { configs, report }
  }

  private static mapFixedProfile(
    profile: SOProfile,
    name: string,
    warnings: ImportWarning[]
  ): ProxyRules {
    const http = toProxyServer(profile.proxyForHttp as Record<string, unknown>)
    const https = toProxyServer(profile.proxyForHttps as Record<string, unknown>)
    const ftp = toProxyServer(profile.proxyForFtp as Record<string, unknown>)
    const fallback = toProxyServer(profile.fallbackProxy as Record<string, unknown>)
    const bypassList = SwitchyOmegaAdapter.extractBypassList(profile.bypassList)

    if ([http, https, ftp, fallback].some((p) => hasCredentials(p))) {
      warnings.push({
        level: 'warning',
        context: name,
        message: 'Imported proxy credentials — review them under Privacy & Security.',
      })
    }

    const rules: ProxyRules = {}
    if (bypassList.length > 0) rules.bypassList = bypassList

    // No per-protocol overrides → treat the fallback proxy as a single proxy.
    if (!http && !https && !ftp && fallback) {
      rules.singleProxy = fallback
      return rules
    }

    if (http) rules.proxyForHttp = http
    if (https) rules.proxyForHttps = https
    if (ftp) rules.proxyForFtp = ftp
    if (fallback) rules.fallbackProxy = fallback
    return rules
  }

  private static mapPacProfile(profile: SOProfile): ProxyConfig['pacScript'] {
    if (typeof profile.pacUrl === 'string' && profile.pacUrl.trim()) {
      return { url: profile.pacUrl.trim() }
    }
    if (typeof profile.pacScript === 'string' && profile.pacScript.trim()) {
      return { data: profile.pacScript }
    }
    return { data: '' }
  }

  private static mapSwitchProfile(
    profile: SOProfile,
    name: string,
    resolveRoute: (profileName: string | undefined, ctx: string) => ResolvedRoute
  ): AutoProxyConfig {
    const rules: AutoProxyRule[] = []
    const sourceRules = Array.isArray(profile.rules) ? profile.rules : []

    sourceRules.forEach((sourceRule, index) => {
      const ctx = `${name} → rule ${index + 1}`
      const mapped = SwitchyOmegaAdapter.mapCondition(sourceRule.condition)
      if (!mapped) return // skipped condition already warned where relevant

      const route = resolveRoute(sourceRule.profileName, ctx)
      rules.push({
        id: crypto.randomUUID(),
        pattern: mapped.pattern,
        matchType: mapped.matchType,
        proxyType: route.proxyType,
        proxyId: route.proxyId,
        enabled: true,
        priority: rules.length,
      })
    })

    const fallback = resolveRoute(profile.defaultProfileName, `${name} → default`)
    return {
      rules,
      fallbackType: fallback.proxyType,
      fallbackProxyId: fallback.proxyId,
    }
  }

  private static mapRuleListProfile(
    profile: SOProfile,
    name: string,
    resolveRoute: (profileName: string | undefined, ctx: string) => ResolvedRoute,
    warnings: ImportWarning[]
  ): AutoProxyConfig {
    const format = SwitchyOmegaAdapter.mapRuleListFormat(profile.format)
    let cachedRules: string[] = []

    if (typeof profile.ruleList === 'string' && profile.ruleList.trim()) {
      try {
        const parsed = SubscriptionParser.parse(profile.ruleList, format)
        cachedRules = SubscriptionParser.domainsToWildcardPatterns(parsed.domains)
      } catch {
        warnings.push({
          level: 'warning',
          context: name,
          message: 'Could not parse the embedded rule list — subscription added empty.',
        })
      }
    }

    const match = resolveRoute(profile.matchProfileName, `${name} → matched`)
    const fallback = resolveRoute(profile.defaultProfileName, `${name} → default`)
    const url = typeof profile.sourceUrl === 'string' ? profile.sourceUrl.trim() : ''

    const subscription: AutoProxySubscription = {
      id: crypto.randomUUID(),
      name,
      url,
      format,
      enabled: true,
      proxyType: match.proxyType,
      proxyId: match.proxyId,
      updateInterval: 0,
      ruleCount: cachedRules.length,
      cachedRules,
    }

    return {
      rules: [],
      subscriptions: [subscription],
      fallbackType: fallback.proxyType,
      fallbackProxyId: fallback.proxyId,
    }
  }

  private static mapRuleListFormat(format: unknown): SubscriptionFormat {
    if (typeof format === 'string' && format.toLowerCase() === 'switchy') return 'auto'
    // SwitchyOmega "AutoProxy" lists are ABP/GFWList-style.
    return 'abp'
  }

  private static mapCondition(
    condition: SOCondition | undefined
  ): { pattern: string; matchType: AutoProxyMatchType } | null {
    if (!condition) return null
    const type = condition.conditionType
    const raw = (condition.pattern || '').trim()

    switch (type) {
      case 'HostWildcardCondition':
      case 'UrlWildcardCondition':
        return isSafePattern(raw) ? { pattern: raw, matchType: 'wildcard' } : null
      case 'HostRegexCondition':
      case 'UrlRegexCondition':
        return raw ? { pattern: raw, matchType: 'regex' } : null
      case 'KeywordCondition':
        return isSafePattern(raw) ? { pattern: `*${raw}*`, matchType: 'wildcard' } : null
      case 'IpCondition': {
        const ip = (condition.ip || '').trim()
        const prefix = condition.prefixLength
        if (ip && typeof prefix === 'number') {
          return { pattern: `${ip}/${prefix}`, matchType: 'cidr' }
        }
        return isSafePattern(raw) ? { pattern: raw, matchType: 'cidr' } : null
      }
      default:
        return null
    }
  }

  private static extractBypassList(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    const out: string[] = []
    for (const entry of value) {
      let pattern: string | undefined
      if (typeof entry === 'string') {
        pattern = entry
      } else if (entry && typeof entry === 'object') {
        const p = (entry as Record<string, unknown>).pattern
        if (typeof p === 'string') pattern = p
      }
      const trimmed = pattern?.trim()
      if (trimmed && isSafePattern(trimmed)) out.push(trimmed)
    }
    return out
  }

  private static empty(warnings: ImportWarning[]): ImportResult {
    return {
      configs: [],
      report: { source: 'switchyomega', proxyCount: 0, ruleCount: 0, warnings },
    }
  }
}
