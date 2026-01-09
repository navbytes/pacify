import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { CodeMirrorOptions, CodeMirrorTheme, PACCompletionItem } from '@/interfaces/codemirror'

// PAC function completions data
export const PAC_COMPLETIONS: PACCompletionItem[] = [
  {
    label: 'FindProxyForURL',
    type: 'function',
    insertText: 'function FindProxyForURL(url, host) {\n\t\n\treturn "DIRECT";\n}',
    documentation: 'Main PAC function that determines proxy settings for a given URL and host',
    detail: '(url: string, host: string) => string',
    apply: 'function FindProxyForURL(url, host) {\n\t${}\n\treturn "DIRECT";\n}',
  },
  {
    label: 'dnsResolve',
    type: 'function',
    insertText: 'dnsResolve(${host})',
    documentation:
      'Resolves the given DNS hostname into an IP address, and returns it in the dot separated format as a string',
    detail: '(host: string) => string',
    apply: 'dnsResolve(${host})',
  },
  {
    label: 'isInNet',
    type: 'function',
    insertText: 'isInNet(${host}, ${pattern}, ${mask})',
    documentation:
      'Returns true if the IP address of the host matches the specified IP address pattern',
    detail: '(host: string, pattern: string, mask: string) => boolean',
    apply: 'isInNet(${host}, ${pattern}, ${mask})',
  },
  {
    label: 'isPlainHostName',
    type: 'function',
    insertText: 'isPlainHostName(${host})',
    documentation: 'Returns true if there are no domain name separators (dots) in the hostname',
    detail: '(host: string) => boolean',
    apply: 'isPlainHostName(${host})',
  },
  {
    label: 'dnsDomainIs',
    type: 'function',
    insertText: 'dnsDomainIs(${host}, ${domain})',
    documentation: 'Returns true if the domain of hostname matches the specified domain',
    detail: '(host: string, domain: string) => boolean',
    apply: 'dnsDomainIs(${host}, ${domain})',
  },
  {
    label: 'localHostOrDomainIs',
    type: 'function',
    insertText: 'localHostOrDomainIs(${host}, ${hostdom})',
    documentation:
      'Returns true if the hostname matches exactly the specified host, or if there is no domain name part in the hostname, but the unqualified hostname matches',
    detail: '(host: string, hostdom: string) => boolean',
    apply: 'localHostOrDomainIs(${host}, ${hostdom})',
  },
  {
    label: 'isResolvable',
    type: 'function',
    insertText: 'isResolvable(${host})',
    documentation: 'Tries to resolve the hostname. Returns true if succeeds',
    detail: '(host: string) => boolean',
    apply: 'isResolvable(${host})',
  },
  {
    label: 'shExpMatch',
    type: 'function',
    insertText: 'shExpMatch(${str}, ${shexp})',
    documentation: 'Returns true if the string matches the specified shell expression pattern',
    detail: '(str: string, shexp: string) => boolean',
    apply: 'shExpMatch(${str}, ${shexp})',
  },
  {
    label: 'weekdayRange',
    type: 'function',
    insertText: 'weekdayRange(${wd1}, ${wd2}, ${gmt})',
    documentation: 'Returns true if the current weekday falls within the specified range',
    detail: '(wd1: string, wd2?: string, gmt?: string) => boolean',
    apply: 'weekdayRange(${wd1}, ${wd2}, ${gmt})',
  },
  {
    label: 'dateRange',
    type: 'function',
    insertText: 'dateRange(${day1}, ${month1}, ${year1}, ${day2}, ${month2}, ${year2}, ${gmt})',
    documentation: 'Returns true if the current date falls within the specified range',
    detail: '(...args: (string | number)[]) => boolean',
    apply: 'dateRange(${day1}, ${month1}, ${year1}, ${day2}, ${month2}, ${year2}, ${gmt})',
  },
  {
    label: 'timeRange',
    type: 'function',
    insertText: 'timeRange(${hour1}, ${min1}, ${sec1}, ${hour2}, ${min2}, ${sec2}, ${gmt})',
    documentation: 'Returns true if the current time falls within the specified range',
    detail: '(...args: (string | number)[]) => boolean',
    apply: 'timeRange(${hour1}, ${min1}, ${sec1}, ${hour2}, ${min2}, ${sec2}, ${gmt})',
  },
  {
    label: 'myIpAddress',
    type: 'function',
    insertText: 'myIpAddress()',
    documentation:
      'Returns the IP address of the host that the Navigator is running on, as a string in the dot-separated integer format',
    detail: '() => string',
    apply: 'myIpAddress()',
  },
  // Proxy return values
  {
    label: 'DIRECT',
    type: 'constant',
    insertText: '"DIRECT"',
    documentation: 'Direct connection without proxy',
    detail: 'string',
  },
  {
    label: 'PROXY',
    type: 'constant',
    insertText: '"PROXY ${host}:${port}"',
    documentation: 'Use the specified proxy server',
    detail: 'string',
    apply: '"PROXY ${host}:${port}"',
  },
  {
    label: 'SOCKS',
    type: 'constant',
    insertText: '"SOCKS ${host}:${port}"',
    documentation: 'Use the specified SOCKS proxy server',
    detail: 'string',
    apply: '"SOCKS ${host}:${port}"',
  },
  {
    label: 'SOCKS4',
    type: 'constant',
    insertText: '"SOCKS4 ${host}:${port}"',
    documentation: 'Use the specified SOCKS4 proxy server',
    detail: 'string',
    apply: '"SOCKS4 ${host}:${port}"',
  },
  {
    label: 'SOCKS5',
    type: 'constant',
    insertText: '"SOCKS5 ${host}:${port}"',
    documentation: 'Use the specified SOCKS5 proxy server',
    detail: 'string',
    apply: '"SOCKS5 ${host}:${port}"',
  },
]

// PAC language completions function
export function pacCompletions(context: CompletionContext): CompletionResult | null {
  // Look for word boundaries or explicit activation
  const word = context.matchBefore(/\w*/) || context.matchBefore(/[a-zA-Z_$]\w*/)

  // Always show completions if explicitly triggered or if we have at least one character
  const shouldShow =
    context.explicit || (word && word.to - word.from >= 1) || context.matchBefore(/[a-zA-Z_$]/)

  if (!shouldShow) return null

  // Get the range for replacement
  const from = word ? word.from : context.pos
  const to = word ? word.to : context.pos

  return {
    from,
    to,
    options: PAC_COMPLETIONS.map((item) => ({
      label: item.label,
      type: item.type,
      info: item.documentation,
      detail: item.detail,
      apply: item.apply || item.insertText,
      boost: item.type === 'function' ? 10 : item.type === 'constant' ? 5 : 0,
      section: item.type === 'function' ? 'PAC Functions' : 'Return Values',
    })),
    validFor: /^[a-zA-Z_$]\w*$/,
  }
}

// Light theme configuration
export const lightTheme: CodeMirrorTheme = {
  name: 'pac-light',
  isDark: false,
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    selection: '#ADD6FF',
    cursor: '#000000',
    lineHighlight: '#F3F3F3',
    lineNumber: '#999999',
    lineNumberActive: '#333333',
  },
  syntax: {
    comment: '#008800',
    string: '#A31515',
    keyword: '#0000FF',
    type: '#267F99',
    operator: '#000000',
    number: '#098658',
    identifier: '#001080',
  },
}

// Dark theme configuration
export const darkTheme: CodeMirrorTheme = {
  name: 'pac-dark',
  isDark: true,
  colors: {
    background: '#1E1E1E',
    foreground: '#D4D4D4',
    selection: '#264F78',
    cursor: '#FFFFFF',
    lineHighlight: '#2D2D2D',
    lineNumber: '#858585',
    lineNumberActive: '#C6C6C6',
  },
  syntax: {
    comment: '#6A9955',
    string: '#CE9178',
    keyword: '#569CD6',
    type: '#4EC9B0',
    operator: '#D4D4D4',
    number: '#B5CEA8',
    identifier: '#9CDCFE',
  },
}

// Create theme extension from theme configuration
export function createThemeExtension(theme: CodeMirrorTheme): Extension {
  const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: theme.syntax.comment },
    { tag: tags.string, color: theme.syntax.string },
    { tag: tags.keyword, color: theme.syntax.keyword },
    { tag: tags.typeName, color: theme.syntax.type },
    { tag: tags.operator, color: theme.syntax.operator },
    { tag: tags.number, color: theme.syntax.number },
    { tag: tags.variableName, color: theme.syntax.identifier },
    { tag: tags.function(tags.variableName), color: theme.syntax.keyword },
    { tag: tags.definition(tags.variableName), color: theme.syntax.identifier },
  ])

  const themeExtension = EditorView.theme(
    {
      '&': {
        color: theme.colors.foreground,
        backgroundColor: theme.colors.background,
      },
      '.cm-content': {
        padding: '12px',
        caretColor: theme.colors.cursor,
      },
      '.cm-focused .cm-cursor': {
        borderLeftColor: theme.colors.cursor,
      },
      '.cm-selectionBackground, .cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: theme.colors.selection,
      },
      '.cm-activeLine': {
        backgroundColor: theme.colors.lineHighlight,
      },
      '.cm-gutters': {
        backgroundColor: theme.colors.background,
        color: theme.colors.lineNumber,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: theme.colors.lineHighlight,
        color: theme.colors.lineNumberActive,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: theme.colors.lineNumber,
      },
      '.cm-focused .cm-matchingBracket': {
        backgroundColor: theme.isDark ? '#5A5A5A' : '#E0E0E0',
        outline: '1px solid transparent',
      },
    },
    { dark: theme.isDark }
  )

  return [themeExtension, syntaxHighlighting(highlightStyle)]
}

// Default CodeMirror options
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

// Get system theme preference
// Safe for service worker environments
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Create basic extensions array
export function createBasicExtensions(options: CodeMirrorOptions): Extension[] {
  const extensions: Extension[] = []

  // Language support
  if (options.language === 'javascript' || options.language === 'pac') {
    extensions.push(javascript())
  }

  // Autocompletion
  if (options.enableAutocompletion) {
    extensions.push(
      autocompletion({
        override: [pacCompletions],
        maxRenderedOptions: 20,
        activateOnTyping: true,
        closeOnBlur: true,
        defaultKeymap: true,
        tooltipClass: () => 'cm-pac-tooltip',
      })
    )
  }

  // Theme
  const theme = options.theme === 'dark' ? darkTheme : lightTheme
  if (options.enableSyntaxHighlighting) {
    extensions.push(createThemeExtension(theme))
  }

  // One Dark theme for dark mode
  if (options.theme === 'dark') {
    extensions.push(oneDark)
  }

  // Custom styling
  extensions.push(
    EditorView.theme({
      '&': {
        fontSize: `${options.fontSize || 14}px`,
      },
      '.cm-editor': {
        borderRadius: '6px',
        border: '1px solid',
        borderColor: theme.isDark ? '#404040' : '#D1D5DB',
      },
      '.cm-focused': {
        outline: 'none',
        borderColor: theme.isDark ? '#569CD6' : '#0000FF',
      },
    })
  )

  // Line wrapping
  if (options.lineWrapping) {
    extensions.push(EditorView.lineWrapping)
  }

  // Read-only mode
  if (options.readOnly) {
    extensions.push(EditorView.editable.of(false))
  }

  // Placeholder
  if (options.placeholder) {
    extensions.push(
      EditorView.theme({
        '.cm-placeholder': {
          color: theme.isDark ? '#858585' : '#999999',
          fontStyle: 'italic',
        },
      })
    )
  }

  // Additional extensions
  if (options.extensions) {
    extensions.push(...options.extensions)
  }

  return extensions
}
