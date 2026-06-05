import type { ChromeProxyConfig, ProxyConfig, ProxyMode } from '@/interfaces'
import { ChromeService } from '@/services/chrome/ChromeService'
import type { ImportResult, ImportWarning } from './types'
import { pickColor } from './utils'

const KNOWN_MODES: ReadonlySet<ProxyMode> = new Set<ProxyMode>([
  'direct',
  'auto_detect',
  'pac_script',
  'fixed_servers',
  'system',
])

/**
 * Capture the browser's *current* proxy settings as an importable config.
 *
 * Uses the already-granted `proxy` permission via {@link ChromeService.getProxy}
 * — no network access. Useful for users who configured a proxy at the OS/Chrome
 * level and want PACify to take it over.
 */
export async function detectCurrentProxy(): Promise<ImportResult> {
  const warnings: ImportWarning[] = []
  const current = await ChromeService.getProxy()

  const value = (current?.value ?? {}) as ChromeProxyConfig
  const level = (current as { levelOfControl?: string })?.levelOfControl

  if (
    level &&
    level !== 'controlled_by_this_extension' &&
    level !== 'controllable_by_this_extension'
  ) {
    warnings.push({
      level: 'warning',
      context: 'Browser proxy',
      message: 'The browser proxy is managed elsewhere and may not be fully controllable.',
    })
  }

  const mode: ProxyMode = KNOWN_MODES.has(value.mode as ProxyMode)
    ? (value.mode as ProxyMode)
    : 'direct'

  const config: ProxyConfig = {
    id: crypto.randomUUID(),
    name: 'Current browser proxy',
    color: pickColor(undefined),
    isActive: false,
    mode,
  }

  if (mode === 'pac_script' && value.pacScript) {
    config.pacScript = {
      url: value.pacScript.url || undefined,
      data: value.pacScript.data || undefined,
    }
  } else if (mode === 'fixed_servers' && value.rules) {
    config.rules = value.rules
  }

  if (mode === 'direct') {
    warnings.push({
      level: 'warning',
      context: 'Browser proxy',
      message: 'No active proxy is set in the browser; importing a Direct connection.',
    })
  }

  return {
    configs: [config],
    report: { source: 'pac', proxyCount: 1, ruleCount: 0, warnings },
  }
}
