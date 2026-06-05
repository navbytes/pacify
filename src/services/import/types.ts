import type { ProxyConfig } from '@/interfaces'

/**
 * Recognised source applications/formats that PACify can import from.
 */
export type ImportSourceType =
  | 'switchyomega' // Proxy SwitchyOmega / ZeroOmega .bak JSON
  | 'foxyproxy' // FoxyProxy Standard (7.x+) or legacy JSON
  | 'pac' // Raw PAC script (FindProxyForURL)
  | 'pacify' // PACify's own backup JSON
  | 'unknown'

/**
 * Severity of an item recorded in the import report.
 * - `warning`: imported, but with an approximation the user should know about.
 * - `skipped`: could not be imported and was dropped.
 */
export type ImportWarningLevel = 'warning' | 'skipped'

/**
 * A single note surfaced to the user about how a source construct was handled.
 */
export interface ImportWarning {
  level: ImportWarningLevel
  /** The source profile/rule the note relates to (for display). */
  context: string
  /** Human-readable explanation. */
  message: string
}

/**
 * Summary of an import, shown to the user before committing.
 */
export interface ImportReport {
  source: ImportSourceType
  /** Number of proxy configurations produced. */
  proxyCount: number
  /** Total number of routing rules + cached subscription rules produced. */
  ruleCount: number
  /** Warnings and skipped constructs, in the order they were encountered. */
  warnings: ImportWarning[]
}

/**
 * Result of parsing + mapping a source file.
 *
 * Configs carry freshly-generated ids so that intra-import references
 * (e.g. SwitchyOmega switch rules pointing at a fixed profile) resolve
 * correctly before anything is persisted.
 */
export interface ImportResult {
  configs: ProxyConfig[]
  report: ImportReport
}

/**
 * How imported configs are reconciled with the user's existing configs.
 * - `merge`: append imported configs, disambiguating duplicate names (default).
 * - `replace`: discard existing configs and use only the imported ones.
 */
export type ImportStrategy = 'merge' | 'replace'

/**
 * Contract for a per-format adapter. Adapters are pure functions: they take
 * already-parsed input and produce configs + a report, with no Chrome/DOM
 * dependency, so they are trivially unit-testable.
 */
export interface ImportAdapter {
  /** Source type this adapter produces. */
  readonly source: ImportSourceType
  /** Map parsed source data to PACify configs. */
  map(input: unknown): ImportResult
}
