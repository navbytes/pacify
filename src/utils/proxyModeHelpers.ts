import type { ComponentType } from 'svelte'
import type { AppSettings, ProxyConfig, ProxyMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { FileText, GitBranch, Globe, Monitor, Radar, Wrench, Zap } from '@/utils/icons'

/**
 * Checks if a ProxyConfig is an Auto-Proxy configuration
 */
export function isAutoProxy(config: ProxyConfig): boolean {
  return config.autoProxy !== undefined
}

export function getProxyModeLabel(mode: ProxyMode, config?: ProxyConfig): string {
  // Check if this is an Auto-Proxy config
  if (config && isAutoProxy(config)) {
    return I18nService.getMessage('autoProxyMode')
  }

  const labels: Record<ProxyMode, string> = {
    system: I18nService.getMessage('systemMode'),
    direct: I18nService.getMessage('directMode'),
    auto_detect: I18nService.getMessage('autoDetectMode'),
    pac_script: I18nService.getMessage('pacScriptMode'),
    fixed_servers: I18nService.getMessage('manualMode'),
  }
  return labels[mode] || mode
}

/**
 * Plain-language label for the proxy card badge. Unlike getProxyModeLabel
 * (which mirrors the editor's technical mode names), this avoids jargon for the
 * everyday "Toggler" persona: "Manual Configuration" → "Proxy server",
 * "Auto-Proxy" → "Smart routing", "Auto‑config URL" → "Auto-detect". The
 * precise mode names stay in the editor's mode selector, not on the card.
 */
/**
 * Resolve which proxy id to activate after a save (the "Save & Turn On" flow).
 * On edit, it's the id we were editing; on create, the freshly-saved config has
 * a generated id, so we find it by name. Returns null when none can be resolved
 * (the caller then skips activation).
 */
export function resolveSavedProxyId(
  editingId: string | null,
  settings: AppSettings | null | undefined,
  name: string
): string | null {
  if (editingId) return editingId
  return settings?.proxyConfigs.find((c) => c.name === name)?.id ?? null
}

export function getProxyCardLabel(mode: ProxyMode, config?: ProxyConfig): string {
  if (config && isAutoProxy(config)) {
    return I18nService.getMessage('cardModeRouting')
  }
  const labels: Record<ProxyMode, string> = {
    system: I18nService.getMessage('systemMode'),
    direct: I18nService.getMessage('directMode'),
    auto_detect: I18nService.getMessage('cardModeAutoDetect'),
    pac_script: I18nService.getMessage('pacScriptMode'),
    fixed_servers: I18nService.getMessage('cardModeManual'),
  }
  return labels[mode] || mode
}

export function getProxyModeIcon(mode: ProxyMode, config?: ProxyConfig): ComponentType {
  // Check if this is an Auto-Proxy config
  if (config && isAutoProxy(config)) {
    return GitBranch
  }

  const icons: Record<ProxyMode, ComponentType> = {
    system: Monitor,
    direct: Zap,
    auto_detect: Radar,
    pac_script: FileText,
    fixed_servers: Wrench,
  }
  return icons[mode] || Globe
}

// Auto-Proxy color scheme (distinct orange/amber)
const AUTO_PROXY_COLORS = {
  bg: 'bg-orange-100 dark:bg-orange-900/30',
  text: 'text-orange-800 dark:text-orange-200',
  border: 'border-orange-300 dark:border-orange-700',
}

export function getProxyModeColor(
  mode: ProxyMode,
  config?: ProxyConfig
): {
  bg: string
  text: string
  border: string
} {
  // Check if this is an Auto-Proxy config
  if (config && isAutoProxy(config)) {
    return AUTO_PROXY_COLORS
  }

  const colors: Record<ProxyMode, { bg: string; text: string; border: string }> = {
    system: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-600',
    },
    direct: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-300 dark:border-green-700',
    },
    auto_detect: {
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-800 dark:text-sky-200',
      border: 'border-sky-300 dark:border-sky-700',
    },
    pac_script: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-800 dark:text-indigo-200',
      border: 'border-indigo-300 dark:border-indigo-700',
    },
    fixed_servers: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-300 dark:border-blue-700',
    },
  }
  return (
    colors[mode] || {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-600',
    }
  )
}

/**
 * Find Auto-Proxy configs that reference a given proxy ID
 * Returns the names of Auto-Proxy configs that would be affected if this proxy is deleted
 */
export function findAutoProxyReferences(
  proxyId: string,
  allConfigs: ProxyConfig[]
): { configName: string; ruleCount: number }[] {
  const references: { configName: string; ruleCount: number }[] = []

  for (const config of allConfigs) {
    if (!isAutoProxy(config) || !config.autoProxy) continue

    // Count rules that reference this proxy
    const referencingRules = config.autoProxy.rules.filter(
      (rule) => rule.proxyType === 'existing' && rule.proxyId === proxyId
    )

    // Check fallback
    const fallbackReferences =
      config.autoProxy.fallbackType === 'existing' && config.autoProxy.fallbackProxyId === proxyId
        ? 1
        : 0

    const totalReferences = referencingRules.length + fallbackReferences

    if (totalReferences > 0) {
      references.push({
        configName: config.name,
        ruleCount: totalReferences,
      })
    }
  }

  return references
}

/**
 * Build a map of proxy ID → Auto-Proxy references for all proxies in one pass.
 * Avoids O(n²) lookups when rendering a list of proxy items.
 */
export function buildAutoProxyReferenceMap(
  allConfigs: ProxyConfig[]
): Map<string, { configName: string; ruleCount: number }[]> {
  const map = new Map<string, { configName: string; ruleCount: number }[]>()

  for (const config of allConfigs) {
    if (!isAutoProxy(config) || !config.autoProxy) continue

    // Count references per proxy ID
    const refCounts = new Map<string, number>()

    for (const rule of config.autoProxy.rules) {
      if (rule.proxyType === 'existing' && rule.proxyId) {
        refCounts.set(rule.proxyId, (refCounts.get(rule.proxyId) || 0) + 1)
      }
    }

    if (config.autoProxy.fallbackType === 'existing' && config.autoProxy.fallbackProxyId) {
      const id = config.autoProxy.fallbackProxyId
      refCounts.set(id, (refCounts.get(id) || 0) + 1)
    }

    for (const [proxyId, count] of refCounts) {
      const existing = map.get(proxyId) || []
      existing.push({ configName: config.name, ruleCount: count })
      map.set(proxyId, existing)
    }
  }

  return map
}

/**
 * Check if a proxy ID is referenced by any Auto-Proxy config
 */
export function isProxyReferencedByAutoProxy(proxyId: string, allConfigs: ProxyConfig[]): boolean {
  return findAutoProxyReferences(proxyId, allConfigs).length > 0
}

/**
 * Check if a rule references a deleted/missing proxy
 */
export function isOrphanedRule(
  rule: { proxyType: string; proxyId?: string },
  allConfigs: ProxyConfig[]
): boolean {
  if (rule.proxyType !== 'existing' || !rule.proxyId) return false
  return !allConfigs.some((config) => config.id === rule.proxyId)
}

export function getProxyDescription(mode: ProxyMode, config: ProxyConfig): string {
  // Check if this is an Auto-Proxy config
  if (isAutoProxy(config)) {
    const ruleCount = config.autoProxy?.rules?.length || 0
    return I18nService.getMessage('autoProxyRulesCount', String(ruleCount))
  }

  switch (mode) {
    case 'system':
      return I18nService.getMessage('systemProxy')
    case 'direct':
      return I18nService.getMessage('directModeHelp')
    case 'auto_detect':
      return I18nService.getMessage('autoDetectModeHelp')
    case 'pac_script':
      if (config?.pacScript?.url) {
        return config.pacScript.url
      }
      return I18nService.getMessage('pacScriptConfigured') || 'PAC script configuration'
    case 'fixed_servers': {
      // A freshly-created manual proxy can have an empty host/port; don't
      // render a bare ":" — fall back to a descriptive label instead.
      const server = config?.rules?.singleProxy?.host
        ? config.rules.singleProxy
        : config?.rules?.proxyForHttp?.host
          ? config.rules.proxyForHttp
          : null
      if (server?.host) {
        return `${server.host}:${server.port}`
      }
      return I18nService.getMessage('manualProxyNotConfigured') || 'No server configured yet'
    }
    default:
      return ''
  }
}
