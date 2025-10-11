import { writable } from 'svelte/store'

/**
 * App Settings Store - Manages application-level settings
 * Separated from proxy configurations for better modularity
 */

interface AppSettingsState {
  quickSwitchEnabled: boolean
  disableProxyOnStartup: boolean
  theme?: 'light' | 'dark' | 'auto'
  language?: string
}

const DEFAULT_APP_SETTINGS: AppSettingsState = {
  quickSwitchEnabled: false,
  disableProxyOnStartup: false,
  theme: 'auto',
  language: 'en',
}

function createAppSettingsStore() {
  const { subscribe, set, update } = writable<AppSettingsState>(DEFAULT_APP_SETTINGS)

  return {
    subscribe,

    // Initialize settings
    init: (settings: Partial<AppSettingsState>) => {
      set({ ...DEFAULT_APP_SETTINGS, ...settings })
    },

    // Update specific setting
    updateSetting: <K extends keyof AppSettingsState>(key: K, value: AppSettingsState[K]) => {
      update((state) => ({
        ...state,
        [key]: value,
      }))
    },

    // Update multiple settings
    updateSettings: (settings: Partial<AppSettingsState>) => {
      update((state) => ({
        ...state,
        ...settings,
      }))
    },

    // Toggle quick switch
    toggleQuickSwitch: (enabled: boolean) => {
      update((state) => ({
        ...state,
        quickSwitchEnabled: enabled,
      }))
    },

    // Get current state
    getState: (): AppSettingsState => {
      let currentState = DEFAULT_APP_SETTINGS
      const unsubscribe = subscribe((state) => {
        currentState = state
      })
      unsubscribe()
      return currentState
    },

    // Reset to defaults
    reset: () => {
      set(DEFAULT_APP_SETTINGS)
    },
  }
}

export const appSettingsStore = createAppSettingsStore()
