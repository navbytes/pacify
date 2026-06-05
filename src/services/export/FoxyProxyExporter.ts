import type { ProxyConfig, ProxyServer } from '@/interfaces'

interface FoxyProxyExportEntry {
  title: string
  color: string
  active: boolean
  type: string
  address?: string
  port?: number
  username?: string
  password?: string
  pacURL?: string
  blackPatterns?: { title: string; pattern: string; type: number; active: boolean }[]
}

/**
 * Serialise PACify configs to a FoxyProxy Standard (7.x) export array.
 *
 * Fixed-server and PAC-URL proxies map cleanly. Bypass entries become
 * blackPatterns. Auto-Proxy/switch configs and inline PAC data have no direct
 * FoxyProxy proxy representation and are omitted.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class FoxyProxyExporter {
  static export(configs: ProxyConfig[]): FoxyProxyExportEntry[] {
    const entries: FoxyProxyExportEntry[] = []

    for (const config of configs) {
      if (config.mode === 'fixed_servers') {
        const server = config.rules?.singleProxy || config.rules?.proxyForHttp
        if (!server) continue
        entries.push(FoxyProxyExporter.fromServer(config, server))
      } else if (config.mode === 'pac_script' && config.pacScript?.url) {
        entries.push({
          title: config.name,
          color: config.color,
          active: config.isActive,
          type: 'pac',
          pacURL: config.pacScript.url,
        })
      }
      // direct/system/auto_detect and Auto-Proxy configs are not representable
      // as FoxyProxy proxy entries and are intentionally skipped.
    }

    return entries
  }

  private static fromServer(config: ProxyConfig, server: ProxyServer): FoxyProxyExportEntry {
    const entry: FoxyProxyExportEntry = {
      title: config.name,
      color: config.color,
      active: config.isActive,
      type: server.scheme,
      address: server.host,
      port: Number.parseInt(server.port, 10) || 0,
    }
    if (server.username) entry.username = server.username
    if (server.password) entry.password = server.password

    const bypass = config.rules?.bypassList ?? []
    if (bypass.length > 0) {
      entry.blackPatterns = bypass.map((host) => ({
        title: '',
        pattern: host.includes('://') ? host : `*://${host}/*`,
        type: 1,
        active: true,
      }))
    }
    return entry
  }
}
