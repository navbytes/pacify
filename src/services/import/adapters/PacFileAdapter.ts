import type { ProxyConfig } from '@/interfaces'
import type { ImportResult } from '../types'
import { pickColor } from '../utils'

/**
 * Wrap a PAC source into a single PACify `pac_script` configuration.
 *
 * Accepts either an inline script (the `FindProxyForURL` body and friends) or a
 * single `http(s)://` URL pointing at a remotely-hosted PAC file.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class PacFileAdapter {
  static readonly source = 'pac' as const

  static map(input: unknown): ImportResult {
    const raw = typeof input === 'string' ? input.trim() : ''

    if (!raw) {
      return {
        configs: [],
        report: { source: 'pac', proxyCount: 0, ruleCount: 0, warnings: [] },
      }
    }

    const isUrl = /^https?:\/\/[^\s]+$/i.test(raw)
    const config: ProxyConfig = {
      id: crypto.randomUUID(),
      name: isUrl ? 'Imported PAC (URL)' : 'Imported PAC script',
      color: pickColor(undefined),
      isActive: false,
      mode: 'pac_script',
      pacScript: isUrl ? { url: raw } : { data: raw },
    }

    return {
      configs: [config],
      report: { source: 'pac', proxyCount: 1, ruleCount: 0, warnings: [] },
    }
  }
}
