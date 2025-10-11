import type { MonacoOptions } from '@/interfaces'
import type { editor, languages } from 'monaco-editor'

export const tokenizer: {
  [name: string]: languages.IMonarchLanguageRule[]
} = {
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
    [/[(){}[\]]/, '@brackets'],
    [/[<>](?!@)/, '@brackets'],
    // Operators
    [/[=!<>]=?|[+\-*/%]|\|\||&&|[?:]/, 'operator'],
    // Whitespace
    [/[ \t\r\n]+/, 'white'],
    // Delimiters
    [/[;,.]/, 'delimiter'],
    // Numbers
    [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
    [/\d+/, 'number'],
  ],
  comment: [
    [/[^/*]+/, 'comment'],
    [/\*\//, 'comment', '@pop'],
    [/[/*]/, 'comment'],
  ],
}

export const lightTheme: editor.IStandaloneThemeData = {
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
}

export const darkTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008800' },
    { token: 'string', foreground: 'A31515' },
    { token: 'keyword', foreground: '0000FF' },
    { token: 'type', foreground: '267F99' },
    { token: 'operator', foreground: '000000' },
    { token: 'delimiter', foreground: '000000' },
    { token: 'number', foreground: '098658' },
    { token: 'identifier', foreground: '001080' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#F3F3F3',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
    'editor.selectionBackground': '#ADD6FF',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorIndentGuide.background': '#D3D3D3',
    'editorIndentGuide.activeBackground': '#A9A9A9',
  },
}

export const defaultOptions: MonacoOptions = {
  value: '',
  theme: 'pac-light',
  language: 'pac',
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
  // lightbulb: { enabled: undefined },
  selectionHighlight: false,
  occurrencesHighlight: 'singleFile',
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
