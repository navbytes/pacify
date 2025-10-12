import type { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

// Type for CodeMirror Editor instance
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ICodeMirrorEditor extends EditorView {
  // EditorView already has all the methods we need
}

// Configuration options for CodeMirror editor
export interface CodeMirrorOptions {
  value: string
  theme?: 'light' | 'dark'
  language?: string
  fontSize?: number
  lineNumbers?: boolean
  lineWrapping?: boolean
  readOnly?: boolean
  placeholder?: string
  extensions?: Extension[]

  // PAC-specific options
  enableAutocompletion?: boolean
  enableSyntaxHighlighting?: boolean
  enableLinting?: boolean
}

// PAC function completion item
export interface PACCompletionItem {
  label: string
  type: 'function' | 'constant' | 'keyword'
  insertText: string
  documentation: string
  detail?: string
  apply?: string
}

// Theme configuration
export interface CodeMirrorTheme {
  name: string
  isDark: boolean
  colors: {
    background: string
    foreground: string
    selection: string
    cursor: string
    lineHighlight: string
    lineNumber: string
    lineNumberActive: string
  }
  syntax: {
    comment: string
    string: string
    keyword: string
    type: string
    operator: string
    number: string
    identifier: string
  }
}

// Error types for CodeMirror operations
export interface CodeMirrorError extends Error {
  type: 'INITIALIZATION' | 'OPERATION' | 'THEME' | 'COMPLETION'
  context?: string
}
