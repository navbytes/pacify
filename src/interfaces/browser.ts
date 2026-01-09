/**
 * Browser API interfaces for cross-browser compatibility
 * These interfaces abstract browser-specific APIs to allow for easier porting to other browsers
 */

// Notification API
export interface NotificationButton {
  title: string
  iconUrl?: string
}

export interface NotificationOptions {
  type: string
  iconUrl: string
  title: string
  message: string
  priority?: number
  requireInteraction?: boolean
  buttons?: NotificationButton[]
}

export interface NotificationAPI {
  create(id: string, options: NotificationOptions): Promise<string>
  getAll(): Promise<Record<string, boolean>>
  clear(id: string): Promise<boolean>
}

// Storage API
export interface StorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  getBytesInUse?(keys: string | string[] | null): Promise<number>
  QUOTA_BYTES?: number
}

export interface StorageAPI {
  sync: StorageArea
  local: StorageArea
}

export interface Tab {
  id?: number
  index: number
  windowId: number
  highlighted: boolean
  active: boolean
  pinned: boolean
  url?: string
  title?: string
  [key: string]: unknown
}

// Action/Browser Action API
export interface ActionAPI {
  setBadgeText(details: { text: string }): Promise<void>
  setBadgeBackgroundColor(details: { color: string }): Promise<void>
  setPopup(details: { popup: string }): Promise<void>
  onClicked: {
    addListener(callback: (tab: Tab) => void): void
    removeListener(callback: (tab: Tab) => void): void
  }
}

export interface MessageSender {
  tab?: Tab
  frameId?: number
  id?: string
  url?: string
  tlsChannelId?: string
  [key: string]: unknown
}

export type SendResponse = (response?: unknown) => void

// Runtime API
export interface RuntimeAPI {
  getURL(path: string): string
  sendMessage<T>(message: T): Promise<unknown>
  openOptionsPage(params?: Record<string, string>): void
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: MessageSender,
        sendResponse: SendResponse
      ) => boolean | void
    ): void
    removeListener(
      callback: (
        message: unknown,
        sender: MessageSender,
        sendResponse: SendResponse
      ) => boolean | void
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
  query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>
  reload(tabId?: number): Promise<void>
  create(createProperties: { url: string }): Promise<Tab>
}

export interface ProxySettings {
  value: {
    mode: string
    [key: string]: unknown
  }
  levelOfControl: string
  [key: string]: unknown
}

// Proxy API
export interface ProxyAPI {
  settings: {
    set(details: unknown, callback?: () => void): void
    clear(details: unknown, callback?: () => void): void
    get(details: unknown, callback?: (config: ProxySettings) => void): void
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
