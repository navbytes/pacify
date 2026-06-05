import type { ProxyScheme, ProxyServer } from '@/interfaces'
import { getRandomProxyColor } from '@/utils/colors'

const VALID_SCHEMES: ReadonlySet<string> = new Set(['http', 'https', 'quic', 'socks4', 'socks5'])

/**
 * Characters that must never reach a generated PAC script string literal.
 * Mirrors the guarantee enforced by SubscriptionParser.isValidDomain.
 */
const UNSAFE_PATTERN_CHARS = /["'\\<>`]/

/**
 * Normalise a source proxy "scheme" string onto PACify's {@link ProxyScheme}.
 * Returns `null` for DIRECT/unknown schemes so callers can decide what to do.
 */
export function normalizeScheme(raw: unknown): ProxyScheme | null {
  if (typeof raw !== 'string') return 'http'
  const s = raw.trim().toLowerCase()
  if (s === '' || s === 'direct') return null
  // FoxyProxy uses numeric proxy types in some versions: 2=http,3=https,4=socks5,5=socks4
  if (s === 'socks') return 'socks5'
  if (VALID_SCHEMES.has(s)) return s as ProxyScheme
  return 'http'
}

/**
 * Build a {@link ProxyServer} from loosely-typed source fields.
 * Returns `null` when there is no usable host (e.g. a DIRECT entry).
 */
export function toProxyServer(
  input:
    | {
        scheme?: unknown
        host?: unknown
        port?: unknown
        username?: unknown
        password?: unknown
      }
    | null
    | undefined
): ProxyServer | null {
  if (!input || typeof input !== 'object') return null

  const scheme = normalizeScheme(input.scheme)
  if (scheme === null) return null

  const host = typeof input.host === 'string' ? input.host.trim() : ''
  if (!host) return null

  const port =
    typeof input.port === 'number'
      ? String(input.port)
      : typeof input.port === 'string'
        ? input.port.trim()
        : ''

  const server: ProxyServer = { scheme, host, port }

  if (typeof input.username === 'string' && input.username) server.username = input.username
  if (typeof input.password === 'string' && input.password) server.password = input.password

  return server
}

/**
 * Whether the imported server carries credentials (for surfacing a privacy note).
 */
export function hasCredentials(server: ProxyServer | null | undefined): boolean {
  return !!server && (!!server.username || !!server.password)
}

/**
 * Validate a host pattern intended for PAC interpolation. Rejects strings with
 * characters that could break out of the generated JS string literal.
 */
export function isSafePattern(pattern: string): boolean {
  if (!pattern || pattern.length > 1000) return false
  return !UNSAFE_PATTERN_CHARS.test(pattern)
}

/**
 * Pick a usable colour: honour a valid source hex colour, else random palette.
 */
export function pickColor(sourceColor: unknown): string {
  if (typeof sourceColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(sourceColor.trim())) {
    return sourceColor.trim()
  }
  return getRandomProxyColor()
}

/**
 * Ensure every name in a list is unique, appending " (imported)" then
 * " (n)" suffixes on collision. `taken` seeds names already in use.
 */
export function dedupeName(name: string, taken: Set<string>): string {
  const base = name.trim() || 'Imported proxy'
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }

  let candidate = `${base} (imported)`
  let counter = 2
  while (taken.has(candidate)) {
    candidate = `${base} (${counter})`
    counter += 1
  }
  taken.add(candidate)
  return candidate
}
