import type { ProxyConfig } from '@/interfaces'
import type { ImportResult } from '../types'
import { pickColor } from '../utils'

/**
 * Wrap a raw PAC script (the `FindProxyForURL` body and friends) into a single
 * PACify `pac_script` configuration.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class PacFileAdapter {
  static readonly source = 'pac' as const

  static map(input: unknown): ImportResult {
    const data = typeof input === 'string' ? input : ''

    const config: ProxyConfig = {
      id: crypto.randomUUID(),
      name: 'Imported PAC script',
      color: pickColor(undefined),
      isActive: false,
      mode: 'pac_script',
      pacScript: { data },
    }

    return {
      configs: data.trim() ? [config] : [],
      report: {
        source: 'pac',
        proxyCount: data.trim() ? 1 : 0,
        ruleCount: 0,
        warnings: [],
      },
    }
  }
}
