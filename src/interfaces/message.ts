import type { ProxyConfig } from './settings'

export type StoreMessageType =
  | 'SCRIPTS_UPDATED'
  | 'SCRIPTS_ADDED'
  | 'PROXY_STATUS_CHANGED'
  | 'SETTINGS_UPDATED'

export interface StoreMessage {
  type: StoreMessageType
  payload?: any
}

export type BackgroundMessageType =
  | 'SET_PROXY'
  | 'CLEAR_PROXY'
  | 'SCRIPT_UPDATE'
  | 'QUICK_SWITCH'

export interface BaseMessage {
  type: BackgroundMessageType
}

export interface QuickSwitchMessage extends BaseMessage {
  enabled: boolean
}
export interface SetProxyMessage extends BaseMessage {
  proxy: ProxyConfig
}

export interface SetProxyQuickSwitchMessage extends BaseMessage {
  scriptId: string
}

export type BackgroundMessage =
  | BaseMessage
  | SetProxyMessage
  | SetProxyQuickSwitchMessage
