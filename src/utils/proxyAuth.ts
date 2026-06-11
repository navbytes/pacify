import type { AppSettings, ProxyServer } from '@/interfaces'

/**
 * Pick the proxy credentials to answer a proxy auth challenge with.
 *
 * Extracted from the background service worker so the (otherwise hard to
 * automate) credential-selection logic is unit-testable in isolation.
 *
 * Rules:
 *  - Look only at the currently active proxy config.
 *  - Consider every server slot that carries a username (single, per-protocol,
 *    fallback).
 *  - Prefer the server whose host matches the challenger; otherwise use the
 *    first server that has credentials.
 *  - Return `null` when there is no active config or none of its servers have
 *    credentials (the caller then defers to the browser's native dialog).
 */
export function selectActiveProxyCredentials(
  settings: AppSettings | null | undefined,
  challengerHost?: string
): { username: string; password: string } | null {
  if (!settings) return null

  const active = settings.proxyConfigs.find(
    (c) => c.isActive || (settings.activeScriptId && c.id === settings.activeScriptId)
  )
  if (!active?.rules) return null

  const servers: (ProxyServer | undefined)[] = [
    active.rules.singleProxy,
    active.rules.proxyForHttp,
    active.rules.proxyForHttps,
    active.rules.proxyForFtp,
    active.rules.fallbackProxy,
  ]
  const withCreds = servers.filter((s): s is ProxyServer => !!s?.username)
  if (withCreds.length === 0) return null

  const matched = challengerHost ? withCreds.find((s) => s.host === challengerHost) : undefined
  const chosen = matched ?? withCreds[0]
  return { username: chosen.username || '', password: chosen.password || '' }
}
