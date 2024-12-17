export interface PACScript {
  id: string
  name: string
  script: string
  color: string
  isActive: boolean
  quickSwitch?: boolean
}

export interface AppSettings {
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  pacScripts: PACScript[]
  searchTerm?: string
}

export interface Settings {
  notifications: boolean
}
