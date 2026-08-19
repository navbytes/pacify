export interface TabsContext {
  activeTab: string
  registerTab: (id: string) => void
  unregisterTab: (id: string) => void
  setActiveTab: (id: string) => void
  isTabActive: (id: string) => boolean
}
