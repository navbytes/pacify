import type { AppSettings } from '@/interfaces'
import { FoxyProxyExporter } from './FoxyProxyExporter'
import { SwitchyOmegaExporter } from './SwitchyOmegaExporter'
import type { ExportArtifact, ExportFormat } from './types'

/**
 * Produces portable export artifacts from PACify settings, enabling two-way
 * migration (out to other tools as well as in).
 *
 * `build` is pure and testable; `download` performs the DOM-based file save.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern, consistent with the rest of the codebase
export class ExportService {
  static build(format: ExportFormat, settings: AppSettings): ExportArtifact {
    const date = new Date().toISOString().slice(0, 10)
    switch (format) {
      case 'switchyomega':
        return {
          content: JSON.stringify(SwitchyOmegaExporter.export(settings.proxyConfigs), null, 2),
          filename: `pacify-export-switchyomega-${date}.bak`,
          mimeType: 'application/json',
        }
      case 'foxyproxy':
        return {
          content: JSON.stringify(FoxyProxyExporter.export(settings.proxyConfigs), null, 2),
          filename: `pacify-export-foxyproxy-${date}.json`,
          mimeType: 'application/json',
        }
      default:
        return {
          content: JSON.stringify(settings, null, 2),
          filename: `pacify-settings-backup-${date}.json`,
          mimeType: 'application/json',
        }
    }
  }

  /**
   * Trigger a browser download for the given artifact.
   */
  static download(artifact: ExportArtifact): void {
    let url: string | null = null
    let link: HTMLAnchorElement | null = null
    try {
      const blob = new Blob([artifact.content], { type: artifact.mimeType })
      url = URL.createObjectURL(blob)
      link = document.createElement('a')
      link.href = url
      link.download = artifact.filename
      document.body.appendChild(link)
      link.click()
    } finally {
      if (link && document.body.contains(link)) document.body.removeChild(link)
      if (url) URL.revokeObjectURL(url)
    }
  }
}
