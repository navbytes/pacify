import type { AppSettings } from '@/interfaces'

export const DEFAULT_SETTINGS: AppSettings = {
  quickSwitchEnabled: false,
  activeScriptId: null,
  proxyConfigs: [],
  disableProxyOnStartup: false,
  autoReloadOnProxySwitch: true,
}

// Constants for default values
export const DEFAULT_BADGE_COLOR = '#303030'
export const DEFAULT_BADGE_TEXT = 'OFF'
export const POPUP_DISABLED = ''
export const POPUP_ENABLED = 'src/popup/popup.html'

export const TEST_URLS: string[] = ['https://google.com']

export const dragDelim = '__pageType__'
