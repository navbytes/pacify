import type { ComponentType } from 'svelte'
import type { ProxyConfig, ProxyMode } from '@/interfaces'
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
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-300 dark:border-purple-700',
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
      return 'PAC script configuration'
    case 'fixed_servers':
      if (config?.rules?.singleProxy) {
        const { host, port } = config.rules.singleProxy
        return `${host}:${port}`
      } else if (config?.rules?.proxyForHttp) {
        const { host, port } = config.rules.proxyForHttp
        return `${host}:${port}`
      }
      return 'Manual proxy configuration'
    default:
      return ''
  }
}
