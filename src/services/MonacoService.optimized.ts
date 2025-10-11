import {
  ERROR_TYPES,
  type MonacoOptions,
  type IMonacoEditor,
  type IMonacoKeyCode,
} from '@/interfaces'
import { withErrorHandling } from '@/utils/errorHandling'
import { darkTheme, lightTheme, tokenizer } from '@/utils/monaco'

/**
 * Optimized Monaco Service with lazy loading and code splitting
 * - Loads Monaco only when needed (lazy loading)
 * - Uses dynamic imports for better code splitting
 * - Caches editor instance for reuse
 * - Implements progressive loading strategy
 */

// Detect browser context
const isBrowserContext = typeof window !== 'undefined'

// Monaco module type
type MonacoModule = typeof import('monaco-editor/esm/vs/editor/editor.api')

export class MonacoOptimized {
  private static hasInitialized = false
  private static editorPromise: Promise<MonacoModule> | null = null
  private static monacoInstance: MonacoModule | null = null
  static KeyCode: IMonacoKeyCode

  /**
   * Preload Monaco in the background (optional optimization)
   * Call this early in app lifecycle to improve perceived performance
   */
  static async preload(): Promise<void> {
    if (!isBrowserContext || this.editorPromise) return

    // Start loading Monaco in background
    this.loadMonaco().catch((error) => {
      console.warn('Monaco preload failed:', error)
    })
  }

  /**
   * Dynamically import Monaco with caching
   */
  private static async loadMonaco(): Promise<MonacoModule> {
    if (!isBrowserContext) {
      throw new Error('Monaco editor can only be used in a browser context')
    }

    // Return cached instance if available
    if (this.monacoInstance) {
      return this.monacoInstance
    }

    // Return existing promise if loading
    if (this.editorPromise) {
      return this.editorPromise
    }

    // Start new load
    this.editorPromise = import(
      /* webpackChunkName: "monaco-editor" */
      /* webpackPrefetch: true */
      'monaco-editor/esm/vs/editor/editor.api'
    ).then(async (monaco) => {
      // Cache the instance
      this.monacoInstance = monaco

      // Cache KeyCode for external use
      this.KeyCode = monaco.KeyCode as IMonacoKeyCode

      // Configure worker with lazy loading
      self.MonacoEnvironment = {
        getWorker: () => {
          return import(
            /* webpackChunkName: "monaco-worker" */
            'monaco-editor/esm/vs/editor/editor.worker?worker'
          ).then((module) => new module.default())
        },
      }

      return monaco
    })

    return this.editorPromise
  }

  /**
   * Initialize Monaco with custom languages and themes
   * Uses lazy initialization - only runs when first editor is created
   */
  private static initializeMonaco = withErrorHandling(async (): Promise<void> => {
    if (this.hasInitialized) return
    if (!isBrowserContext) return

    const monaco = await this.loadMonaco()

    // Register PAC script language
    monaco.languages.register({ id: 'pac' })

    // Define PAC script syntax highlighting
    monaco.languages.setMonarchTokensProvider('pac', { tokenizer })

    // Register PAC script completions (with lazy loading of suggestions)
    monaco.languages.registerCompletionItemProvider('pac', {
      triggerCharacters: ['.', '(', '"', "'", 'function '],
      provideCompletionItems: async (_, position) => {
        // Lazy load completions
        const { getPACCompletions } = await import('@/utils/monaco-completions')
        return getPACCompletions(monaco, position)
      },
    })

    // Define themes
    monaco.editor.defineTheme('pac-dark', lightTheme)
    monaco.editor.defineTheme('pac-light', darkTheme)

    this.hasInitialized = true
  }, ERROR_TYPES.EDITOR)

  /**
   * Create editor with optimized loading
   */
  static create = withErrorHandling(
    async (container: HTMLElement, options: MonacoOptions): Promise<IMonacoEditor> => {
      if (!isBrowserContext) {
        throw new Error('Monaco editor can only be used in a browser context')
      }

      // Initialize Monaco (only once)
      await this.initializeMonaco()

      // Load Monaco module
      const monaco = await this.loadMonaco()

      // Detect theme preference
      const darkMode =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

      // Set up theme change listener
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleThemeChange = (event: MediaQueryListEvent) => {
          const editor = monaco.editor.getEditors()[0]
          if (editor) {
            monaco.editor.setTheme(event.matches ? 'pac-dark' : 'pac-light')
          }
        }

        // Use modern addEventListener if available, fallback to addListener
        if ('addEventListener' in mediaQuery) {
          mediaQuery.addEventListener('change', handleThemeChange)
        } else {
          mediaQuery.addListener(handleThemeChange)
        }
      }

      const theme = darkMode ? 'pac-dark' : 'pac-light'

      // Create editor with optimized options
      const editor = monaco.editor.create(container, {
        ...options,
        theme,
        // Performance optimizations
        automaticLayout: options.automaticLayout ?? true,
        minimap: options.minimap ?? { enabled: false },
        scrollBeyondLastLine: options.scrollBeyondLastLine ?? false,
        // Reduce memory usage
        renderLineHighlight: options.renderLineHighlight ?? 'none',
        occurrencesHighlight: options.occurrencesHighlight ?? 'off',
      })

      return editor as IMonacoEditor
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Dispose editor instance
   */
  static dispose = withErrorHandling(async (editor: IMonacoEditor): Promise<void> => {
    if (!isBrowserContext || !editor) return
    editor.dispose()
  }, ERROR_TYPES.EDITOR)

  /**
   * Get editor value
   */
  static getValue = withErrorHandling(async (editor: IMonacoEditor): Promise<string> => {
    if (!isBrowserContext || !editor) return ''
    return editor.getValue()
  }, ERROR_TYPES.EDITOR)

  /**
   * Set editor value
   */
  static setValue = withErrorHandling(
    async (editor: IMonacoEditor, value: string): Promise<void> => {
      if (!isBrowserContext || !editor) return
      editor.setValue(value)
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Check if Monaco can be used
   */
  static canUseMonaco(): boolean {
    return isBrowserContext
  }

  /**
   * Clear cached Monaco instance (for testing)
   */
  static clearCache(): void {
    this.hasInitialized = false
    this.editorPromise = null
    this.monacoInstance = null
  }
}

// Stub KeyCode for non-browser contexts
if (!isBrowserContext) {
  MonacoOptimized.KeyCode = {
    Enter: 13,
    Escape: 27,
  }
}

// Export as default for backward compatibility
export const Monaco = MonacoOptimized
