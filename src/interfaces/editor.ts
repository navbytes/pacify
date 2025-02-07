import type { ProxyConfig } from './settings'

export interface EditorOptions {
  container: HTMLElement
  onSave: (scriptData: ProxyConfig) => void
  onClose: () => void
}

export interface FormState {
  name: string
  color: string
  quickSwitch: boolean
  scriptContent: string
}
