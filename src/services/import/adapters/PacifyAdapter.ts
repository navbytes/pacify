import type { ProxyConfig, ProxyMode } from '@/interfaces'
import type { ImportResult, ImportWarning } from '../types'
import { pickColor } from '../utils'

const VALID_MODES: ReadonlySet<ProxyMode> = new Set<ProxyMode>([
  'direct',
  'auto_detect',
  'pac_script',
  'fixed_servers',
  'system',
])

/**
 * Import the proxy configurations out of PACify's own backup JSON.
 *
 * Unlike the legacy "Restore" (which replaces *everything*), routing a PACify
 * backup through the unified importer lets the user merge it additively. Only
 * `proxyConfigs` are taken here; top-level app settings are left untouched.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class PacifyAdapter {
  static readonly source = 'pacify' as const

  static map(input: unknown): ImportResult {
    const warnings: ImportWarning[] = []

    if (!input || typeof input !== 'object') {
      return PacifyAdapter.report(warnings)
    }

    const proxyConfigs = (input as Record<string, unknown>).proxyConfigs
    if (!Array.isArray(proxyConfigs)) {
      return PacifyAdapter.report(warnings)
    }

    const configs: ProxyConfig[] = []
    let ruleCount = 0

    proxyConfigs.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') return
      const candidate = raw as ProxyConfig
      const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
      if (!name) {
        warnings.push({
          level: 'skipped',
          context: `Entry ${index + 1}`,
          message: 'Configuration has no name — skipped.',
        })
        return
      }
      if (typeof candidate.mode !== 'string' || !VALID_MODES.has(candidate.mode)) {
        warnings.push({
          level: 'skipped',
          context: name,
          message: `Invalid proxy mode "${candidate.mode}" — skipped.`,
        })
        return
      }

      ruleCount += candidate.autoProxy?.rules?.length ?? 0

      // Reassign a fresh id to avoid colliding with existing configs on merge.
      configs.push({
        ...candidate,
        id: crypto.randomUUID(),
        name,
        color: pickColor(candidate.color),
        isActive: false,
      })
    })

    return {
      configs,
      report: { source: 'pacify', proxyCount: configs.length, ruleCount, warnings },
    }
  }

  private static report(warnings: ImportWarning[]): ImportResult {
    return {
      configs: [],
      report: { source: 'pacify', proxyCount: 0, ruleCount: 0, warnings },
    }
  }
}
