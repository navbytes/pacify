import type { PACScript } from './settings'

export interface EditorOptions {
  container: HTMLElement
  onSave: (scriptData: PACScript) => void
  onClose: () => void
}

export type PageType = 'POPUP' | 'OPTIONS' | 'QUICK_SWITCH'
