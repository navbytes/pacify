/**
 * Monaco PAC Script Completions
 * Separated for code splitting and lazy loading
 */

type MonacoModule = typeof import('monaco-editor/esm/vs/editor/editor.api')

export function getPACCompletions(
  monaco: MonacoModule,
  position: { lineNumber: number; column: number }
) {
  const suggestions = [
    {
      label: 'FindProxyForURL',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: ['function FindProxyForURL(url, host) {', '\t$0', '\treturn "DIRECT";', '}'].join(
        '\n'
      ),
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
    {
      label: 'localHostOrDomainIs',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'localHostOrDomainIs(${1:host}, ${2:hostdom})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Checks if hostname matches or ends with domain',
      detail: '(host: string, hostdom: string) => boolean',
    },
    {
      label: 'isResolvable',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'isResolvable(${1:host})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Checks if hostname can be resolved',
      detail: '(host: string) => boolean',
    },
    {
      label: 'dnsDomainLevels',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'dnsDomainLevels(${1:host})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Returns number of DNS domain levels',
      detail: '(host: string) => number',
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
    {
      label: 'SOCKS4',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '"SOCKS4 ${1:host}:${2:port}"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Use specified SOCKS4 proxy server',
    },
    {
      label: 'SOCKS5',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '"SOCKS5 ${1:host}:${2:port}"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Use specified SOCKS5 proxy server',
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
}
