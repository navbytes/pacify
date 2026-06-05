import { SettingsReader } from '../SettingsReader'
import { SettingsWriter } from '../SettingsWriter'
import { FoxyProxyAdapter } from './adapters/FoxyProxyAdapter'
import { PacFileAdapter } from './adapters/PacFileAdapter'
import { PacifyAdapter } from './adapters/PacifyAdapter'
import { SwitchyOmegaAdapter } from './adapters/SwitchyOmegaAdapter'
import { detectSource } from './detectSource'
import type { ImportResult, ImportStrategy } from './types'
import { dedupeName } from './utils'

/**
 * Max size for an imported file. Larger than the 1 MB settings-restore cap
 * because real SwitchyOmega backups bundle sizeable rule lists.
 */
const MAX_IMPORT_FILE_SIZE = 4 * 1024 * 1024

/**
 * Orchestrates importing configurations from other proxy managers:
 * detect → map (via a per-format adapter) → preview → commit.
 *
 * `parse`/`detect` are pure and synchronous; only `commit` touches storage.
 * Errors are thrown with an i18n *key* as the message so the UI can localise
 * them (falling back to the key if a translation is missing).
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class ImportService {
  static readonly MAX_FILE_SIZE = MAX_IMPORT_FILE_SIZE

  /**
   * Detect the format of raw text and map it to PACify configs.
   * @throws Error('unrecognizedImportFormat') when the format is not recognised.
   */
  static parse(raw: string): ImportResult {
    const { type, data } = detectSource(raw)

    switch (type) {
      case 'switchyomega':
        return SwitchyOmegaAdapter.map(data)
      case 'foxyproxy':
        return FoxyProxyAdapter.map(data)
      case 'pacify':
        return PacifyAdapter.map(data)
      case 'pac':
        return PacFileAdapter.map(data)
      default:
        throw new Error('unrecognizedImportFormat')
    }
  }

  /**
   * Read a File, enforce the size cap, and parse it.
   * @throws Error('importFileTooLarge') when the file exceeds the size cap.
   */
  static async parseFile(file: File): Promise<ImportResult> {
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      throw new Error('importFileTooLarge')
    }
    const text = await file.text()
    return ImportService.parse(text)
  }

  /**
   * Persist a parsed import. `merge` (default) appends, disambiguating
   * duplicate names; `replace` swaps in only the imported configs.
   */
  static async commit(result: ImportResult, strategy: ImportStrategy = 'merge'): Promise<void> {
    if (result.configs.length === 0) {
      throw new Error('nothingToImport')
    }

    if (strategy === 'replace') {
      const taken = new Set<string>()
      const deduped = result.configs.map((c) => ({ ...c, name: dedupeName(c.name, taken) }))
      await SettingsWriter.updateSettings({ proxyConfigs: deduped, activeScriptId: null })
      return
    }

    const settings = await SettingsReader.getSettings()
    const taken = new Set(settings.proxyConfigs.map((c) => c.name))
    const deduped = result.configs.map((c) => ({ ...c, name: dedupeName(c.name, taken) }))
    await SettingsWriter.updateSettings({
      proxyConfigs: [...settings.proxyConfigs, ...deduped],
    })
  }
}
