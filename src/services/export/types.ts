/**
 * Formats PACify can export configurations to, for moving *out* to other tools
 * (or producing a portable artifact).
 */
export type ExportFormat = 'pacify' | 'switchyomega' | 'foxyproxy'

/**
 * A serialised export ready to be written to a file.
 */
export interface ExportArtifact {
  /** Pretty-printed file contents. */
  content: string
  /** Suggested download filename. */
  filename: string
  /** MIME type for the download blob. */
  mimeType: string
}
