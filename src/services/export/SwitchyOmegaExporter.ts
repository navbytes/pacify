import type { AutoProxyRule, ProxyConfig, ProxyServer } from '@/interfaces'

/**
 * Serialise PACify configs to a Proxy SwitchyOmega / ZeroOmega backup object.
 *
 * Best-effort round trip: fixed, PAC and switch (Auto-Proxy rule) profiles map
 * cleanly. Inline rule proxies and remote subscriptions have no direct
 * SwitchyOmega equivalent and are routed to `direct`.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class SwitchyOmegaExporter {
  static export(configs: ProxyConfig[]): Record<string, unknown> {
    const root: Record<string, unknown> = { schemaVersion: 2 }
    const nameById = new Map<string, string>()
    for (const config of configs) {
      if (config.id) nameById.set(config.id, config.name)
    }

    for (const config of configs) {
      const profile = SwitchyOmegaExporter.toProfile(config, nameById)
      if (profile) root[`+${config.name}`] = profile
    }
    return root
  }

  private static toProfile(
    config: ProxyConfig,
    nameById: Map<string, string>
  ): Record<string, unknown> | null {
    const base = { name: config.name, color: config.color }

    switch (config.mode) {
      case 'fixed_servers':
        return { ...base, profileType: 'FixedProfile', ...SwitchyOmegaExporter.fixedFields(config) }
      case 'pac_script':
        if (config.autoProxy) {
          return {
            ...base,
            profileType: 'SwitchProfile',
            defaultProfileName: SwitchyOmegaExporter.routeName(
              config.autoProxy.fallbackType,
              config.autoProxy.fallbackProxyId,
              nameById
            ),
            rules: config.autoProxy.rules.map((rule) =>
              SwitchyOmegaExporter.toRule(rule, nameById)
            ),
          }
        }
        return {
          ...base,
          profileType: 'PacProfile',
          ...(config.pacScript?.url
            ? { pacUrl: config.pacScript.url }
            : { pacScript: config.pacScript?.data || '' }),
        }
      case 'direct':
        return { ...base, profileType: 'DirectProfile' }
      case 'system':
        return { ...base, profileType: 'SystemProfile' }
      default:
        return null
    }
  }

  private static fixedFields(config: ProxyConfig): Record<string, unknown> {
    const rules = config.rules
    const fields: Record<string, unknown> = {
      bypassList: (rules?.bypassList ?? []).map((pattern) => ({
        conditionType: 'BypassCondition',
        pattern,
      })),
    }
    if (rules?.singleProxy) {
      fields.fallbackProxy = SwitchyOmegaExporter.toServer(rules.singleProxy)
    } else {
      if (rules?.proxyForHttp)
        fields.proxyForHttp = SwitchyOmegaExporter.toServer(rules.proxyForHttp)
      if (rules?.proxyForHttps)
        fields.proxyForHttps = SwitchyOmegaExporter.toServer(rules.proxyForHttps)
      if (rules?.proxyForFtp) fields.proxyForFtp = SwitchyOmegaExporter.toServer(rules.proxyForFtp)
      if (rules?.fallbackProxy)
        fields.fallbackProxy = SwitchyOmegaExporter.toServer(rules.fallbackProxy)
    }
    return fields
  }

  private static toServer(server: ProxyServer): Record<string, unknown> {
    return {
      scheme: server.scheme,
      host: server.host,
      port: Number.parseInt(server.port, 10) || 0,
    }
  }

  private static toRule(
    rule: AutoProxyRule,
    nameById: Map<string, string>
  ): Record<string, unknown> {
    return {
      condition: SwitchyOmegaExporter.toCondition(rule),
      profileName: SwitchyOmegaExporter.routeName(rule.proxyType, rule.proxyId, nameById),
    }
  }

  private static toCondition(rule: AutoProxyRule): Record<string, unknown> {
    switch (rule.matchType) {
      case 'regex':
        return { conditionType: 'HostRegexCondition', pattern: rule.pattern }
      case 'cidr': {
        const [ip, prefix] = rule.pattern.split('/')
        return { conditionType: 'IpCondition', ip, prefixLength: Number.parseInt(prefix, 10) || 32 }
      }
      default:
        // wildcard + exact both map to a host wildcard condition
        return { conditionType: 'HostWildcardCondition', pattern: rule.pattern }
    }
  }

  private static routeName(
    type: string,
    proxyId: string | undefined,
    nameById: Map<string, string>
  ): string {
    if (type === 'existing' && proxyId) return nameById.get(proxyId) ?? 'direct'
    return 'direct'
  }
}
