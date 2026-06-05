import type { ImportSourceType } from './types'

/**
 * Outcome of sniffing raw import content.
 */
export interface DetectionResult {
  type: ImportSourceType
  /** Parsed JSON value when the source is JSON-based; raw text for PAC. */
  data: unknown
}

/**
 * Detect which proxy manager / format a pasted-or-uploaded blob came from.
 *
 * Detection is intentionally tolerant: it inspects shape rather than relying on
 * file extensions, so the same routine works for dropped files and pasted text.
 */
export function detectSource(raw: string): DetectionResult {
  const text = raw.trim()

  if (!text) {
    return { type: 'unknown', data: undefined }
  }

  // Try JSON first — SwitchyOmega, FoxyProxy and PACify backups are all JSON.
  let parsed: unknown
  let isJson = false
  try {
    parsed = JSON.parse(text)
    isJson = true
  } catch {
    isJson = false
  }

  if (!isJson) {
    // Non-JSON: only a raw PAC script is supported here.
    if (/function\s+FindProxyForURL\s*\(/i.test(text)) {
      return { type: 'pac', data: text }
    }
    return { type: 'unknown', data: text }
  }

  if (parsed === null || typeof parsed !== 'object') {
    return { type: 'unknown', data: parsed }
  }

  // Arrays are how FoxyProxy 7.x+ exports its proxy list.
  if (Array.isArray(parsed)) {
    return looksLikeFoxyProxyArray(parsed)
      ? { type: 'foxyproxy', data: parsed }
      : { type: 'unknown', data: parsed }
  }

  const obj = parsed as Record<string, unknown>

  // PACify's own backup: { proxyConfigs: [...], quickSwitchEnabled: bool, ... }
  if (Array.isArray(obj.proxyConfigs) && typeof obj.quickSwitchEnabled === 'boolean') {
    return { type: 'pacify', data: obj }
  }

  // SwitchyOmega / ZeroOmega: profiles stored under "+name" keys, plus a
  // numeric `schemaVersion`.
  const hasPlusKeys = Object.keys(obj).some((k) => k.startsWith('+'))
  if (hasPlusKeys || typeof obj.schemaVersion === 'number') {
    return { type: 'switchyomega', data: obj }
  }

  // FoxyProxy wrapped forms: { proxies: [...] } (7.x) or legacy { settings: {...} }.
  if (Array.isArray(obj.proxies) && looksLikeFoxyProxyArray(obj.proxies)) {
    return { type: 'foxyproxy', data: obj }
  }
  if (obj.settings && typeof obj.settings === 'object') {
    return { type: 'foxyproxy', data: obj }
  }

  return { type: 'unknown', data: obj }
}

/**
 * A FoxyProxy proxy list is an array of objects that carry a connection
 * `type`/`mode` together with an address-like field.
 */
function looksLikeFoxyProxyArray(value: unknown[]): boolean {
  if (value.length === 0) return false
  return value.every((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const e = entry as Record<string, unknown>
    const hasType = typeof e.type === 'string' || typeof e.mode === 'string'
    const hasAddress =
      typeof e.address === 'string' ||
      typeof e.hostname === 'string' ||
      typeof e.host === 'string' ||
      typeof e.proxyDNS === 'boolean' ||
      Array.isArray(e.whitePatterns) ||
      Array.isArray(e.blackPatterns)
    return hasType && hasAddress
  })
}
