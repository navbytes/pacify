import {
  ERROR_TYPES,
  type MonacoOptions,
  type IMonacoEditor,
  type IMonacoKeyCode,
} from '@/interfaces'
import { withErrorHandling } from '@/utils/errorHandling'
import { darkTheme, lightTheme, tokenizer } from '@/utils/monaco'

// Detect if we're in a browser context
const isBrowserContext = typeof window !== 'undefined'

export class Monaco {
  private static hasInitialized = false
  private static editorPromise: Promise<
    typeof import('monaco-editor/esm/vs/editor/editor.api')
  > | null = null
  // We'll define KeyCode once monaco is loaded
  static KeyCode: IMonacoKeyCode

  /**
   * Dynamically imports Monaco editor
   */
  private static async loadMonaco() {
    if (!isBrowserContext) {
      throw new Error('Monaco editor can only be used in a browser context')
    }

    if (!this.editorPromise) {
      this.editorPromise = import('monaco-editor/esm/vs/editor/editor.api').then((monaco) => {
        // Cache KeyCode on the class for external use
        this.KeyCode = monaco.KeyCode

        // Configure worker
        self.MonacoEnvironment = {
          getWorker() {
            return import('monaco-editor/esm/vs/editor/editor.worker?worker').then(
              (module) => new module.default()
            )
          },
        }
        return monaco
      })
    }
    return this.editorPromise
  }

  /**
   * Initializes Monaco with custom languages and themes
   */
  private static initializeMonaco = withErrorHandling(async (): Promise<void> => {
    if (this.hasInitialized) return
    if (!isBrowserContext) return

    const monaco = await this.loadMonaco()

    // Register PAC script language
    monaco.languages.register({ id: 'pac' })

    // Define PAC script syntax highlighting
    monaco.languages.setMonarchTokensProvider('pac', { tokenizer })

    // Register PAC script completions
    monaco.languages.registerCompletionItemProvider('pac', {
      triggerCharacters: ['.', '(', '"', "'", 'function '],
      provideCompletionItems: (_, position) => {
        const suggestions = [
          {
            label: 'FindProxyForURL',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: [
              'function FindProxyForURL(url, host) {',
              '\t$0',
              '\treturn "DIRECT";',
              '}',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Main PAC function that determines proxy settings',
            detail: '(url: string, host: string) => string',
          },
          {
            label: 'dnsResolve',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'dnsResolve(${1:host})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Resolves hostname to IP address',
            detail: '(host: string) => string',
          },
          {
            label: 'isInNet',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'isInNet(${1:host}, ${2:pattern}, ${3:mask})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if IP address is in subnet',
            detail: '(host: string, pattern: string, mask: string) => boolean',
          },
          {
            label: 'isPlainHostName',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'isPlainHostName(${1:host})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if the hostname has any dots',
            detail: '(host: string) => boolean',
          },
          {
            label: 'dnsDomainIs',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'dnsDomainIs(${1:host}, ${2:domain})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if hostname belongs to domain',
            detail: '(host: string, domain: string) => boolean',
          },
          {
            label: 'shExpMatch',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'shExpMatch(${1:str}, ${2:pattern})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Shell-expression pattern matching',
            detail: '(str: string, pattern: string) => boolean',
          },
          // Proxy return values
          {
            label: 'DIRECT',
            kind: monaco.languages.CompletionItemKind.Constant,
            insertText: '"DIRECT"',
            documentation: 'Direct connection without proxy',
          },
          {
            label: 'PROXY',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '"PROXY ${1:host}:${2:port}"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Use specified proxy server',
          },
          {
            label: 'SOCKS',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '"SOCKS ${1:host}:${2:port}"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Use specified SOCKS proxy server',
          },
        ]

        return {
          suggestions: suggestions.map((s) => ({
            ...s,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column,
            },
          })),
        }
      },
    })

    // Define themes
    monaco.editor.defineTheme('pac-dark', lightTheme)

    // Define light theme
    monaco.editor.defineTheme('pac-light', darkTheme)

    this.hasInitialized = true
  }, ERROR_TYPES.EDITOR)

  /**
   * Creates a Monaco editor instance with lazy loading
   */
  static create = withErrorHandling(
    async (container: HTMLElement, options: MonacoOptions): Promise<IMonacoEditor> => {
      if (!isBrowserContext) {
        throw new Error('Monaco editor can only be used in a browser context')
      }

      await this.initializeMonaco()

      const monaco = await this.loadMonaco()

      // Detect dark/light mode preference
      const darkMode =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

      // Listen for theme changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
          const editor = monaco.editor.getEditors()[0]
          if (editor) {
            monaco.editor.setTheme(event.matches ? 'pac-dark' : 'pac-light')
          }
        })
      }
      const theme = darkMode ? 'pac-dark' : 'pac-light'
      return monaco.editor.create(container, { ...options, theme })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Disposes a Monaco editor instance
   */
  static dispose = withErrorHandling(async (editor: IMonacoEditor): Promise<void> => {
    if (!isBrowserContext || !editor) return
    editor.dispose()
  }, ERROR_TYPES.EDITOR)

  /**
   * Gets the value from a Monaco editor instance
   */
  static getValue = withErrorHandling(async (editor: IMonacoEditor): Promise<string> => {
    if (!isBrowserContext || !editor) return ''
    return editor.getValue()
  }, ERROR_TYPES.EDITOR)

  /**
   * Sets the value of a Monaco editor instance
   */
  static setValue = withErrorHandling(
    async (editor: IMonacoEditor, value: string): Promise<void> => {
      if (!isBrowserContext || !editor) return
      editor.setValue(value)
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Checks if we're in a browser context where Monaco can be used
   */
  static canUseMonaco(): boolean {
    return isBrowserContext
  }
}

// If we're not in a browser context, provide stub methods for type safety
if (!isBrowserContext) {
  Monaco.KeyCode = {
    // Stub KeyCode values
    Enter: 13,
    Escape: 27,
  }
}
