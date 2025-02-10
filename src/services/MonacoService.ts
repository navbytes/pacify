// MonacoService.ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

interface MonacoOptions {
  value: string
  automaticLayout?: boolean
  minimap?: { enabled: boolean }
  scrollBeyondLastLine?: boolean
  fontSize?: number
  lineNumbers?: 'on' | 'off'
  renderLineHighlight?: 'all' | 'none' | 'gutter' | 'line'
  tabSize?: number
  wordWrap?: 'on' | 'off'
  folding?: boolean
}

export class Monaco {
  private static hasInitialized = false
  static KeyCode = monaco.KeyCode

  private static initializeMonaco(): void {
    if (this.hasInitialized) return

    // Configure worker
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorker() {
        return new editorWorker()
      },
    }

    // Register PAC script language
    monaco.languages.register({ id: 'pac' })

    // Define PAC script syntax highlighting
    monaco.languages.setMonarchTokensProvider('pac', {
      tokenizer: {
        root: [
          // PAC Functions
          [
            /[a-zA-Z][\w$]*/,
            {
              cases: {
                'FindProxyForURL|dnsResolve|isInNet|isPlainHostName|dnsDomainIs|localHostOrDomainIs|isResolvable|isInResolvableHostList|myIpAddress|dnsDomainLevels|shExpMatch|weekdayRange|dateRange|timeRange|alert':
                  'keyword',
                'DIRECT|PROXY|SOCKS|SOCKS4|SOCKS5|HTTP|HTTPS': 'type',
                '@default': 'identifier',
              },
            },
          ],
          // Strings
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          // Brackets
          [/[(){}\[\]]/, '@brackets'],
          [/[<>](?!@)/, '@brackets'],
          // Operators
          [/[=!<>]=?|[+\-*/%]|\|\||&&|\?|\:/, 'operator'],
          // Whitespace
          [/[ \t\r\n]+/, 'white'],
          // Delimiters
          [/[;,.]/, 'delimiter'],
          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment'],
        ],
      },
    })

    // Register PAC script completions
    monaco.languages.registerCompletionItemProvider('pac', {
      provideCompletionItems: (model, position) => {
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
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Main PAC function that determines proxy settings',
            detail: '(url: string, host: string) => string',
          },
          {
            label: 'dnsResolve',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'dnsResolve(${1:host})',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Resolves hostname to IP address',
            detail: '(host: string) => string',
          },
          {
            label: 'isInNet',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'isInNet(${1:host}, ${2:pattern}, ${3:mask})',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if IP address is in subnet',
            detail: '(host: string, pattern: string, mask: string) => boolean',
          },
          {
            label: 'isPlainHostName',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'isPlainHostName(${1:host})',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if the hostname has any dots',
            detail: '(host: string) => boolean',
          },
          {
            label: 'dnsDomainIs',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'dnsDomainIs(${1:host}, ${2:domain})',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Checks if hostname belongs to domain',
            detail: '(host: string, domain: string) => boolean',
          },
          {
            label: 'shExpMatch',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'shExpMatch(${1:str}, ${2:pattern})',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Use specified proxy server',
          },
          {
            label: 'SOCKS',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '"SOCKS ${1:host}:${2:port}"',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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

    // Simple dark theme
    monaco.editor.defineTheme('pac-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'identifier', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D2D',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
      },
    })

    this.hasInitialized = true
  }

  static create(
    container: HTMLElement,
    options: MonacoOptions
  ): monaco.editor.IStandaloneCodeEditor {
    this.initializeMonaco()

    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: options.value || '',
      language: 'pac',
      theme: 'pac-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      tabSize: 2,
      wordWrap: 'on',
      folding: true,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      fixedOverflowWidgets: true,
      // Disable features using valid properties
      hover: {
        enabled: false,
        delay: 100000, // Long delay as another way to effectively disable
      },
      links: false,
      contextmenu: false,
      parameterHints: { enabled: false },
      codeLens: false,
      lightbulb: { enabled: undefined },
      selectionHighlight: false,
      occurrencesHighlight: 'off',
      suggest: {
        showKeywords: false,
        showSnippets: true,
        showClasses: false,
        showFunctions: true,
        showConstructors: false,
        showFields: false,
        showVariables: false,
        showInterfaces: false,
        showModules: false,
      },
    }

    return monaco.editor.create(container, {
      ...defaultOptions,
      ...options,
    })
  }

  static dispose(editor: monaco.editor.IStandaloneCodeEditor): void {
    editor?.dispose()
  }

  static getValue(editor: monaco.editor.IStandaloneCodeEditor): string {
    return editor.getValue()
  }

  static setValue(
    editor: monaco.editor.IStandaloneCodeEditor,
    value: string
  ): void {
    editor.setValue(value)
  }
}
