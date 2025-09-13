/**
 * Browser API interfaces for cross-browser compatibility
 * These interfaces abstract browser-specific APIs to allow for easier porting to other browsers
 */

// Notification API
export interface NotificationOptions {
  type: string
  iconUrl: string
  title: string
  message: string
  priority?: number
  requireInteraction?: boolean
  buttons?: any[]
}

export interface NotificationAPI {
  create(id: string, options: NotificationOptions): Promise<string>
  getAll(): Promise<Record<string, boolean>>
  clear(id: string): Promise<boolean>
}

// Storage API
export interface StorageArea {
  get(keys: string | string[] | null): Promise<Record<string, any>>
  set(items: Record<string, any>): Promise<void>
  getBytesInUse?(keys: string | string[] | null): Promise<number>
  QUOTA_BYTES?: number
}

export interface StorageAPI {
  sync: StorageArea
  local: StorageArea
}

// Action/Browser Action API
export interface ActionAPI {
  setBadgeText(details: { text: string }): Promise<void>
  setBadgeBackgroundColor(details: { color: string }): Promise<void>
  setPopup(details: { popup: string }): Promise<void>
  onClicked: {
    addListener(callback: (tab: any) => void): void
    removeListener(callback: (tab: any) => void): void
  }
}

// Runtime API
export interface RuntimeAPI {
  getURL(path: string): string
  sendMessage<T>(message: T): Promise<any>
  openOptionsPage(): void
  onMessage: {
    addListener(
      callback: (message: any, sender: any, sendResponse: any) => boolean | void
    ): void
    removeListener(
      callback: (message: any, sender: any, sendResponse: any) => boolean | void
    ): void
  }
  onStartup: {
    addListener(callback: () => void): void
    removeListener(callback: () => void): void
  }
  onInstalled: {
    addListener(callback: () => void): void
    removeListener(callback: () => void): void
  }
  lastError?: {
    message: string
  }
}

// Tabs API
export interface TabsAPI {
  query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<any[]>
  reload(tabId?: number): Promise<void>
}

// Proxy API
export interface ProxyAPI {
  settings: {
    set(details: any, callback?: () => void): void
    clear(details: any, callback?: () => void): void
    get(details: any, callback?: (config: any) => void): void
  }
}

// Combined Browser API
export interface BrowserAPI {
  notifications: NotificationAPI
  storage: StorageAPI
  action: ActionAPI
  runtime: RuntimeAPI
  tabs: TabsAPI
  proxy: ProxyAPI
}
