import type { ComponentType } from 'svelte'

export interface TabItem {
  id: string
  label: string
  icon?: ComponentType
  disabled?: boolean
  badge?: number | string
}

export interface TabsContext {
  activeTab: string
  registerTab: (id: string) => void
  unregisterTab: (id: string) => void
  setActiveTab: (id: string) => void
  isTabActive: (id: string) => boolean
}
