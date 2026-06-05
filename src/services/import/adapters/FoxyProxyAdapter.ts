import type {
  AutoProxyConfig,
  AutoProxyMatchType,
  AutoProxyRule,
  ProxyConfig,
  ProxyRules,
} from '@/interfaces'
import type { ImportResult, ImportWarning } from '../types'
import { hasCredentials, isSafePattern, normalizeScheme, pickColor, toProxyServer } from '../utils'

interface FoxyPattern {
  pattern?: string
  // 7.x uses numeric type (1 = wildcard, 2 = regex); older uses strings.
  type?: number | string
  active?: boolean
}

interface FoxyProxyEntry {
  title?: string
  name?: string
  type?: string | number
  mode?: string
  address?: string
  hostname?: string
  host?: string
  port?: number | string
  username?: string
  password?: string
  color?: string
  active?: boolean
  whitePatterns?: FoxyPattern[]
  blackPatterns?: FoxyPattern[]
  [key: string]: unknown
}

/**
 * Parse a FoxyProxy export (Standard 7.x+ array/object, or legacy `settings`
 * shape) into PACify configs.
 *
 * Each proxy becomes a `fixed_servers` config. When a proxy carries
 * whitePatterns ("use this proxy for these URLs"), an accompanying Auto-Proxy
 * config is generated so the URL-based routing is preserved.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class FoxyProxyAdapter {
  static readonly source = 'foxyproxy' as const

  static map(input: unknown): ImportResult {
    const warnings: ImportWarning[] = []
    const entries = FoxyProxyAdapter.collectEntries(input)

    if (entries.length === 0) {
      return {
        configs: [],
        report: { source: 'foxyproxy', proxyCount: 0, ruleCount: 0, warnings },
      }
    }

    const configs: ProxyConfig[] = []
    let ruleCount = 0

    entries.forEach((entry, index) => {
      const name =
        (entry.title || entry.name || `Proxy ${index + 1}`).trim() || `Proxy ${index + 1}`
      const color = pickColor(entry.color)
      const scheme = normalizeScheme(entry.type ?? entry.mode)

      // Direct / system entries map to a mode rather than a server.
      const modeWord = String(entry.type ?? entry.mode ?? '').toLowerCase()
      if (scheme === null || modeWord === 'direct' || modeWord === 'system') {
        const mode = modeWord === 'system' ? 'system' : 'direct'
        configs.push({ id: crypto.randomUUID(), name, color, isActive: false, mode })
        return
      }

      const server = toProxyServer({
        scheme: entry.type ?? entry.mode,
        host: entry.address ?? entry.hostname ?? entry.host,
        port: entry.port,
        username: entry.username,
        password: entry.password,
      })

      if (!server) {
        warnings.push({
          level: 'skipped',
          context: name,
          message: 'Proxy has no usable host/address — skipped.',
        })
        return
      }

      if (hasCredentials(server)) {
        warnings.push({
          level: 'warning',
          context: name,
          message: 'Imported proxy credentials — review them under Privacy & Security.',
        })
      }

      const proxyId = crypto.randomUUID()
      const rules: ProxyRules = { singleProxy: server }

      // blackPatterns => bypass this proxy (go direct) for matching hosts.
      const bypass = FoxyProxyAdapter.toHostPatterns(entry.blackPatterns, name, warnings)
      if (bypass.length > 0) rules.bypassList = bypass

      configs.push({
        id: proxyId,
        name,
        color,
        isActive: false,
        mode: 'fixed_servers',
        rules,
      })

      // whitePatterns => an Auto-Proxy config routing those hosts to this proxy.
      const whites = FoxyProxyAdapter.toRules(entry.whitePatterns, proxyId, name, warnings)
      if (whites.length > 0) {
        const autoProxy: AutoProxyConfig = {
          rules: whites,
          fallbackType: 'direct',
        }
        ruleCount += whites.length
        configs.push({
          id: crypto.randomUUID(),
          name: `${name} (rules)`,
          color,
          isActive: false,
          mode: 'pac_script',
          autoProxy,
        })
        warnings.push({
          level: 'warning',
          context: name,
          message: 'URL patterns were imported as a separate Auto-Proxy configuration.',
        })
      }
    })

    return {
      configs,
      report: { source: 'foxyproxy', proxyCount: configs.length, ruleCount, warnings },
    }
  }

  /**
   * Normalise the various FoxyProxy container shapes into a flat entry list.
   */
  private static collectEntries(input: unknown): FoxyProxyEntry[] {
    if (Array.isArray(input)) return input as FoxyProxyEntry[]
    if (!input || typeof input !== 'object') return []

    const obj = input as Record<string, unknown>
    if (Array.isArray(obj.proxies)) return obj.proxies as FoxyProxyEntry[]

    // Legacy: { settings: { proxies: [...] | { all: [...] } | { id: {...} } } }
    const settings = obj.settings as Record<string, unknown> | undefined
    const proxies = settings?.proxies ?? obj.proxies
    if (Array.isArray(proxies)) return proxies as FoxyProxyEntry[]
    if (proxies && typeof proxies === 'object') {
      const maybeAll = (proxies as Record<string, unknown>).all
      if (Array.isArray(maybeAll)) return maybeAll as FoxyProxyEntry[]
      return Object.values(proxies as Record<string, unknown>).filter(
        (v): v is FoxyProxyEntry => !!v && typeof v === 'object'
      )
    }
    return []
  }

  private static toRules(
    patterns: FoxyPattern[] | undefined,
    proxyId: string,
    ctx: string,
    warnings: ImportWarning[]
  ): AutoProxyRule[] {
    const out: AutoProxyRule[] = []
    for (const converted of FoxyProxyAdapter.convertPatterns(patterns, ctx, warnings)) {
      out.push({
        id: crypto.randomUUID(),
        pattern: converted.pattern,
        matchType: converted.matchType,
        proxyType: 'existing',
        proxyId,
        enabled: true,
        priority: out.length,
      })
    }
    return out
  }

  private static toHostPatterns(
    patterns: FoxyPattern[] | undefined,
    ctx: string,
    warnings: ImportWarning[]
  ): string[] {
    return FoxyProxyAdapter.convertPatterns(patterns, ctx, warnings)
      .filter((c) => c.matchType === 'wildcard')
      .map((c) => c.pattern)
  }

  private static convertPatterns(
    patterns: FoxyPattern[] | undefined,
    ctx: string,
    warnings: ImportWarning[]
  ): { pattern: string; matchType: AutoProxyMatchType }[] {
    if (!Array.isArray(patterns)) return []
    const out: { pattern: string; matchType: AutoProxyMatchType }[] = []
    for (const p of patterns) {
      if (p.active === false) continue
      const raw = (p.pattern || '').trim()
      if (!raw) continue

      const isRegex = p.type === 2 || p.type === 'regex' || p.type === 'regexp'
      if (isRegex) {
        out.push({ pattern: raw, matchType: 'regex' })
        continue
      }

      const host = FoxyProxyAdapter.urlWildcardToHost(raw)
      if (host && isSafePattern(host)) {
        out.push({ pattern: host, matchType: 'wildcard' })
      } else {
        warnings.push({
          level: 'skipped',
          context: ctx,
          message: `Could not convert pattern "${raw}".`,
        })
      }
    }
    return out
  }

  /**
   * Convert a FoxyProxy URL wildcard (e.g. `*://*.example.com/*`) to a PACify
   * host wildcard (`*.example.com`). PACify matches on host, so scheme/path
   * components are dropped.
   */
  private static urlWildcardToHost(pattern: string): string | null {
    let host = pattern
    const schemeSplit = host.split('://')
    if (schemeSplit.length > 1) host = schemeSplit[1]
    // Host is everything up to the first path/query/port separator.
    host = host.split('/')[0].split('?')[0].split(':')[0]
    host = host.trim()
    if (!host || host === '*') return null
    return host
  }
}
