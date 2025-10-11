import { writable, derived, type Readable } from 'svelte/store'
import { ERROR_TYPES, type ProxyConfig } from '@/interfaces'
import { ChromeService } from '@/services/chrome'
import { withErrorHandling } from '@/utils/errorHandling'

/**
 * Proxy Store - Manages proxy configurations and operations
 * Separated from settings store for better modularity
 */

interface ProxyStoreState {
  configs: ProxyConfig[]
  activeScriptId: string | null
  proxyChangePending: Promise<void> | null
}

function createProxyStore() {
  const { subscribe, set, update } = writable<ProxyStoreState>({
    configs: [],
    activeScriptId: null,
    proxyChangePending: null,
  })

  // Derived store for quick switch scripts
  const quickSwitchScripts: Readable<ProxyConfig[]> = derived({ subscribe }, ($state) =>
    $state.configs.filter((script) => script.quickSwitch)
  )

  // Derived store for active script
  const activeScript: Readable<ProxyConfig | null> = derived(
    { subscribe },
    ($state) => $state.configs.find((script) => script.isActive) || null
  )

  return {
    subscribe,
    quickSwitchScripts,
    activeScript,

    // Initialize proxy configs
    init: (configs: ProxyConfig[], activeScriptId: string | null) => {
      set({
        configs,
        activeScriptId,
        proxyChangePending: null,
      })
    },

    // Add or update a proxy config
    upsertConfig: (config: Omit<ProxyConfig, 'id'>, scriptId: string | null): string => {
      let newId = scriptId

      update((state) => {
        if (scriptId) {
          // Update existing
          return {
            ...state,
            configs: state.configs.map((s) =>
              s.id === scriptId ? { ...config, id: scriptId } : s
            ),
          }
        } else {
          // Add new
          newId = crypto.randomUUID()
          const newScript = { ...config, id: newId }
          return {
            ...state,
            configs: [...state.configs, newScript],
          }
        }
      })

      return newId!
    },

    // Delete a proxy config
    deleteConfig: (scriptId: string): boolean => {
      let wasActive = false

      update((state) => {
        wasActive = state.activeScriptId === scriptId
        return {
          ...state,
          configs: state.configs.filter((s) => s.id !== scriptId),
          activeScriptId: wasActive ? null : state.activeScriptId,
        }
      })

      return wasActive
    },

    // Update quick switch status
    updateQuickSwitch: (scriptId: string, quickSwitch: boolean) => {
      update((state) => ({
        ...state,
        configs: state.configs.map((s) => (s.id === scriptId ? { ...s, quickSwitch } : s)),
      }))
    },

    // Set active proxy with mutex to prevent race conditions
    setActive: withErrorHandling(async (id: string, isActive: boolean): Promise<void> => {
      let pendingPromise: Promise<void> | null = null

      // Get current pending promise
      update((state) => {
        pendingPromise = state.proxyChangePending
        return state
      })

      // Wait for any pending proxy change
      if (pendingPromise) {
        console.log('Waiting for pending proxy change to complete...')
        await pendingPromise
      }

      // Create and store new promise
      const changePromise = (async () => {
        // Update local state
        let activeConfig: ProxyConfig | null = null

        update((state) => {
          const configs = state.configs.map((script) => ({
            ...script,
            isActive: script.id === id ? isActive : false,
          }))

          activeConfig = configs.find((s) => s.id === id) || null

          return {
            ...state,
            configs,
            activeScriptId: isActive ? id : null,
          }
        })

        // Send to background
        if (isActive && activeConfig) {
          await ChromeService.sendMessage({
            type: 'SET_PROXY',
            proxy: activeConfig,
          })
        } else {
          await ChromeService.sendMessage({
            type: 'CLEAR_PROXY',
          })
        }
      })()

      // Store promise
      update((state) => ({
        ...state,
        proxyChangePending: changePromise,
      }))

      try {
        await changePromise
      } finally {
        // Clear promise
        update((state) => ({
          ...state,
          proxyChangePending: null,
        }))
      }
    }, ERROR_TYPES.SAVE_SETTINGS),

    // Get current state (for external use)
    getState: (): ProxyStoreState => {
      let currentState: ProxyStoreState = {
        configs: [],
        activeScriptId: null,
        proxyChangePending: null,
      }
      const unsubscribe = subscribe((state) => {
        currentState = state
      })
      unsubscribe()
      return currentState
    },
  }
}

export const proxyStore = createProxyStore()
