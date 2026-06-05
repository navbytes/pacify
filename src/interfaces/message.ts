import type { ProxyConfig } from './settings'

export type BackgroundMessageType =
  | 'SET_PROXY'
  | 'CLEAR_PROXY'
  | 'SCRIPT_UPDATE'
  | 'QUICK_SWITCH'
  | 'REFRESH_SUBSCRIPTION'
  | 'FETCH_SUBSCRIPTION'
  | 'FETCH_PAC'

export interface BaseMessage {
  type: BackgroundMessageType
}

export interface QuickSwitchMessage extends BaseMessage {
  type: 'QUICK_SWITCH'
  enabled: boolean
}

export interface SetProxyMessage extends BaseMessage {
  type: 'SET_PROXY'
  proxy: ProxyConfig
}

export interface ScriptUpdateMessage extends BaseMessage {
  type: 'SCRIPT_UPDATE'
  scriptId: string
}

export interface ClearProxyMessage extends BaseMessage {
  type: 'CLEAR_PROXY'
}

export interface RefreshSubscriptionMessage extends BaseMessage {
  type: 'REFRESH_SUBSCRIPTION'
  proxyId: string
  subscriptionId: string
}

export interface FetchSubscriptionMessage extends BaseMessage {
  type: 'FETCH_SUBSCRIPTION'
  url: string
  format: string
}

export interface FetchPacMessage extends BaseMessage {
  type: 'FETCH_PAC'
  url: string
}

export type BackgroundMessage =
  | QuickSwitchMessage
  | SetProxyMessage
  | ScriptUpdateMessage
  | ClearProxyMessage
  | RefreshSubscriptionMessage
  | FetchSubscriptionMessage
  | FetchPacMessage

export interface BackgroundMessageResponse {
  success: boolean
  error?: string
}

export type MessageResponseHandler<T = unknown> = (response: T) => void
