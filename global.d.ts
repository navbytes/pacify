declare module 'monaco-editor' {
  export * from 'monaco-editor/esm/vs/editor/editor.api'
}

interface Window {
  require: {
    config: (config: { paths: { [key: string]: string } }) => void
  }
}
