export interface MonacoOptions {
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
  language?: string
  theme?: string
  scrollbar?: {
    vertical: 'auto' | 'visible' | 'hidden'
    horizontal: 'auto' | 'visible' | 'hidden'
    useShadows: boolean
    verticalScrollbarSize: number
    horizontalScrollbarSize: number
  }
  formatOnPaste?: boolean
  formatOnType?: boolean
  suggestOnTriggerCharacters?: boolean
  quickSuggestions?: boolean
  fixedOverflowWidgets?: boolean
  hover?: { enabled: boolean; delay: number }
  links?: boolean
  contextmenu?: boolean
  parameterHints?: { enabled: boolean }
  codeLens?: boolean

  // lightbulb: { enabled?: boolean }
  selectionHighlight: boolean
  occurrencesHighlight?: 'off' | 'singleFile' | 'multiFile'

  suggest?: {
    showKeywords: boolean
    showSnippets: boolean
    showClasses: boolean
    showFunctions: boolean
    showConstructors: boolean
    showFields: boolean
    showVariables: boolean
    showInterfaces: boolean
    showModules: boolean
  }
}
