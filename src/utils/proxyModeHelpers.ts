import { I18nService } from '@/services/i18n/i18nService'
import type { ProxyMode } from '@/interfaces'
import type { ComponentType } from 'svelte'
import { Monitor, Zap, Radar, FileText, Wrench, Globe } from 'lucide-svelte'

export function getProxyModeLabel(mode: ProxyMode): string {
  const labels: Record<ProxyMode, string> = {
    system: I18nService.getMessage('systemMode'),
    direct: I18nService.getMessage('directMode'),
    auto_detect: I18nService.getMessage('autoDetectMode'),
    pac_script: I18nService.getMessage('pacScriptMode'),
    fixed_servers: I18nService.getMessage('manualMode'),
  }
  return labels[mode] || mode
}

export function getProxyModeIcon(mode: ProxyMode): ComponentType {
  const icons: Record<ProxyMode, ComponentType> = {
    system: Monitor,
    direct: Zap,
    auto_detect: Radar,
    pac_script: FileText,
    fixed_servers: Wrench,
  }
  return icons[mode] || Globe
}

export function getProxyModeColor(mode: ProxyMode): {
  bg: string
  text: string
  border: string
} {
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

interface ProxyConfig {
  pacScript?: {
    url?: string
  }
  rules?: {
    singleProxy?: {
      host: string
      port: number
    }
    proxyForHttp?: {
      host: string
      port: number
    }
  }
}

export function getProxyDescription(mode: ProxyMode, config: ProxyConfig): string {
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
