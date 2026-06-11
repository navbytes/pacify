import type { CodeMirrorOptions } from '@/interfaces/codemirror'

/**
 * Default CodeMirror editor options.
 *
 * Kept in its own dependency-free module (no `@codemirror/*` imports) so that
 * consumers can reference the defaults without pulling the heavy editor bundle
 * into their eager import graph. The actual editor code in
 * {@link CodeMirrorService} loads `@codemirror/*` lazily via dynamic import.
 */
export const defaultCodeMirrorOptions: Partial<CodeMirrorOptions> = {
  theme: 'light',
  language: 'javascript',
  fontSize: 14,
  lineNumbers: true,
  lineWrapping: true,
  readOnly: false,
  enableAutocompletion: true,
  enableSyntaxHighlighting: true,
  enableLinting: false,
}
