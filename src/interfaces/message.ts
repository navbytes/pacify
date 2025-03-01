import type { ProxyConfig } from './settings'

export type BackgroundMessageType =
  | 'SET_PROXY'
  | 'CLEAR_PROXY'
  | 'SCRIPT_UPDATE'
  | 'QUICK_SWITCH'

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

export interface SetProxyQuickSwitchMessage extends BaseMessage {
  type: 'SCRIPT_UPDATE'
  scriptId: string
}

export interface ClearProxyMessage extends BaseMessage {
  type: 'CLEAR_PROXY'
}

export type BackgroundMessage =
  | QuickSwitchMessage
  | SetProxyMessage
  | SetProxyQuickSwitchMessage
  | ClearProxyMessage

export type MessageResponseHandler<T = unknown> = (response: T) => void

// For improved type safety in message handling
export function isMessageType<T extends BackgroundMessage>(
  message: BackgroundMessage,
  type: T['type']
): message is Extract<BackgroundMessage, { type: typeof type }> {
  return message.type === type
}
