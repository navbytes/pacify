import { startCompletion } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'
import { type CodeMirrorOptions, ERROR_TYPES, type ICodeMirrorEditor } from '@/interfaces'
import {
  createBasicExtensions,
  createThemeExtension,
  darkTheme,
  defaultCodeMirrorOptions,
  getSystemTheme,
  lightTheme,
} from '@/utils/codemirror'
import { withErrorHandling } from '@/utils/errorHandling'

// Detect if we're in a browser context (runtime check for testability)
const isBrowserContext = (): boolean => typeof window !== 'undefined'

// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class CodeMirror {
  private static hasInitialized = false
  private static themeChangeListeners = new Set<(theme: 'light' | 'dark') => void>()
  private static themeCompartments = new WeakMap<EditorView, Compartment>()
  private static readonly themeCleanupFunctions = new WeakMap<EditorView, () => void>()
  // Store global theme listener for cleanup
  private static globalThemeHandler: ((e: MediaQueryListEvent) => void) | null = null
  private static globalMediaQuery: MediaQueryList | null = null

  /**
   * Initializes CodeMirror with system theme detection
   */
  private static initializeCodeMirror = withErrorHandling(async (): Promise<void> => {
    if (this.hasInitialized) return
    if (!isBrowserContext()) return

    // Set up system theme change listener
    if (window.matchMedia) {
      this.globalMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      this.globalThemeHandler = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light'
        this.themeChangeListeners.forEach((listener) => {
          listener(newTheme)
        })
      }

      this.globalMediaQuery.addEventListener('change', this.globalThemeHandler)
    }

    this.hasInitialized = true
  }, ERROR_TYPES.EDITOR)

  /**
   * Creates a CodeMirror editor instance
   */
  static create = withErrorHandling(
    async (container: HTMLElement, options: CodeMirrorOptions): Promise<ICodeMirrorEditor> => {
      if (!isBrowserContext()) {
        throw new Error('CodeMirror editor can only be used in a browser context')
      }

      await this.initializeCodeMirror()

      // Merge with default options
      const mergedOptions: CodeMirrorOptions = {
        ...defaultCodeMirrorOptions,
        ...options,
        theme: options.theme || getSystemTheme(),
      }

      // Create theme compartment for dynamic theme switching
      const themeCompartment = new Compartment()

      // Create extensions
      const extensions = createBasicExtensions(mergedOptions)

      // Add minimal editor setup (without default highlight style to avoid conflicts)
      extensions.push(
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        highlightSpecialChars(),
        foldGutter(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...foldKeymap])
      )

      // Configure line numbers
      if (mergedOptions.lineNumbers) {
        extensions.push(lineNumbers())
      }

      // Add keyboard shortcuts for autocompletion
      extensions.push(
        keymap.of([
          {
            key: 'Ctrl-Space',
            run: startCompletion,
          },
          {
            key: 'Cmd-Space', // For Mac
            run: startCompletion,
          },
        ])
      )

      // Add theme extension in compartment
      const currentTheme = mergedOptions.theme === 'dark' ? darkTheme : lightTheme
      const themeExtension = createThemeExtension(currentTheme)
      extensions.push(themeCompartment.of(themeExtension))

      // Create editor state
      const state = EditorState.create({
        doc: mergedOptions.value,
        extensions,
      })

      // Create editor view
      const view = new EditorView({
        state,
        parent: container,
      })

      // Store theme compartment for this view
      this.themeCompartments.set(view, themeCompartment)

      // Set up theme change listener for this editor
      const themeChangeListener = (newTheme: 'light' | 'dark') => {
        if (view?.dom?.isConnected) {
          const compartment = this.themeCompartments.get(view)
          if (compartment) {
            const currentTheme = newTheme === 'dark' ? darkTheme : lightTheme
            const themeExtension = createThemeExtension(currentTheme)

            view.dispatch({
              effects: compartment.reconfigure(themeExtension),
            })
          }
        }
      }

      this.themeChangeListeners.add(themeChangeListener)

      // Store the cleanup function in WeakMap for later use
      this.themeCleanupFunctions.set(view, () => {
        this.themeChangeListeners.delete(themeChangeListener)
        this.themeCompartments.delete(view)
      })

      return view as ICodeMirrorEditor
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Disposes a CodeMirror editor instance
   */
  static dispose = withErrorHandling(async (editor: ICodeMirrorEditor): Promise<void> => {
    if (!isBrowserContext() || !editor) return

    // Clean up theme listener
    const cleanup = this.themeCleanupFunctions.get(editor as EditorView)
    if (cleanup) {
      cleanup()
      this.themeCleanupFunctions.delete(editor as EditorView)
    }

    editor.destroy()
  }, ERROR_TYPES.EDITOR)

  /**
   * Gets the value from a CodeMirror editor instance
   */
  static getValue = withErrorHandling(async (editor: ICodeMirrorEditor): Promise<string> => {
    if (!isBrowserContext() || !editor) return ''
    return editor.state.doc.toString()
  }, ERROR_TYPES.EDITOR)

  /**
   * Sets the value of a CodeMirror editor instance
   */
  static setValue = withErrorHandling(
    async (editor: ICodeMirrorEditor, value: string): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: value,
        },
      })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Focus the CodeMirror editor
   */
  static focus = withErrorHandling(async (editor: ICodeMirrorEditor): Promise<void> => {
    if (!isBrowserContext() || !editor) return
    editor.focus()
  }, ERROR_TYPES.EDITOR)

  /**
   * Gets the current selection from the editor
   */
  static getSelection = withErrorHandling(async (editor: ICodeMirrorEditor): Promise<string> => {
    if (!isBrowserContext() || !editor) return ''

    const selection = editor.state.selection.main
    if (selection.empty) return ''

    return editor.state.doc.sliceString(selection.from, selection.to)
  }, ERROR_TYPES.EDITOR)

  /**
   * Sets the selection in the editor
   */
  static setSelection = withErrorHandling(
    async (editor: ICodeMirrorEditor, from: number, to?: number): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      editor.dispatch({
        selection: { anchor: from, head: to ?? from },
      })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Gets the current cursor position
   */
  static getCursorPosition = withErrorHandling(
    async (editor: ICodeMirrorEditor): Promise<number> => {
      if (!isBrowserContext() || !editor) return 0
      return editor.state.selection.main.head
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Sets the cursor position
   */
  static setCursorPosition = withErrorHandling(
    async (editor: ICodeMirrorEditor, position: number): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      editor.dispatch({
        selection: { anchor: position, head: position },
      })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Inserts text at the current cursor position
   */
  static insertText = withErrorHandling(
    async (editor: ICodeMirrorEditor, text: string): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      const selection = editor.state.selection.main
      editor.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text,
        },
        selection: { anchor: selection.from + text.length },
      })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Replaces the selected text or inserts at cursor
   */
  static replaceSelection = withErrorHandling(
    async (editor: ICodeMirrorEditor, text: string): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      const selection = editor.state.selection.main
      editor.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text,
        },
        selection: { anchor: selection.from + text.length },
      })
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Gets the line count in the editor
   */
  static getLineCount = withErrorHandling(async (editor: ICodeMirrorEditor): Promise<number> => {
    if (!isBrowserContext() || !editor) return 0
    return editor.state.doc.lines
  }, ERROR_TYPES.EDITOR)

  /**
   * Gets the text of a specific line
   */
  static getLine = withErrorHandling(
    async (editor: ICodeMirrorEditor, lineNumber: number): Promise<string> => {
      if (!isBrowserContext() || !editor) return ''

      const line = editor.state.doc.line(lineNumber + 1) // CodeMirror uses 1-based line numbers
      return line.text
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Checks if CodeMirror can be used in the current context
   */
  static canUseCodeMirror(): boolean {
    return isBrowserContext()
  }

  /**
   * Updates the theme of an existing editor
   */
  static updateTheme = withErrorHandling(
    async (editor: ICodeMirrorEditor, theme: 'light' | 'dark'): Promise<void> => {
      if (!isBrowserContext() || !editor) return

      const compartment = this.themeCompartments.get(editor)
      if (compartment) {
        const currentTheme = theme === 'dark' ? darkTheme : lightTheme
        const themeExtension = createThemeExtension(currentTheme)

        editor.dispatch({
          effects: compartment.reconfigure(themeExtension),
        })
      }
    },
    ERROR_TYPES.EDITOR
  )

  /**
   * Adds an event listener for theme changes
   */
  static onThemeChange(listener: (theme: 'light' | 'dark') => void): () => void {
    CodeMirror.themeChangeListeners.add(listener)

    // Return cleanup function
    return () => {
      CodeMirror.themeChangeListeners.delete(listener)
    }
  }

  /**
   * Gets the current system theme
   */
  static getCurrentTheme(): 'light' | 'dark' {
    return getSystemTheme()
  }

  /**
   * Cleanup global resources (useful for testing and preventing memory leaks)
   */
  static cleanup(): void {
    // Remove global theme listener
    if (CodeMirror.globalMediaQuery && CodeMirror.globalThemeHandler) {
      CodeMirror.globalMediaQuery.removeEventListener('change', CodeMirror.globalThemeHandler)
      CodeMirror.globalMediaQuery = null
      CodeMirror.globalThemeHandler = null
    }

    // Clear all theme change listeners
    CodeMirror.themeChangeListeners.clear()

    // Reset initialization flag
    CodeMirror.hasInitialized = false
  }
}

// If we're not in a browser context, provide stub methods for type safety
if (!isBrowserContext()) {
  // Stubs are not needed for CodeMirror as the methods handle this internally
}
