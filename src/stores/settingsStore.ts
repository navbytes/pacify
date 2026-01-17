import { derived, writable } from 'svelte/store'
import { DEFAULT_SETTINGS } from '@/constants/app'
import { type AppSettings, ERROR_TYPES, type ProxyConfig } from '@/interfaces'
import { ChromeService } from '@/services/chrome'
import { logger } from '@/services/LoggerService'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'
import { StorageService } from '@/services/StorageService'
import { debounce } from '@/utils/debounce'
import { withErrorHandling } from '@/utils/errorHandling'

function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>(DEFAULT_SETTINGS)

  // Mutex to prevent concurrent proxy changes
  let proxyChangePending: Promise<void> | null = null

  // Create a derived store for quick switch scripts
  const quickSwitchScripts = derived({ subscribe }, ($settings) =>
    $settings.proxyConfigs.filter((script) => script.quickSwitch)
  )

  // Create a derived store for active script
  const activeScript = derived(
    { subscribe },
    ($settings) => $settings.proxyConfigs.find((script) => script.isActive) || null
  )

  // Function to save settings and return a promise
  async function saveSettings(settings: AppSettings): Promise<void> {
    await StorageService.saveSettings(settings)
  }

  // Debounced function only for non-critical updates
  const debouncedSaveSettings = debounce(saveSettings, 500)

  // Utility function to handle settings changes without immediate messaging requirements
  const handleSettingsChange = (
    callback: (settings: AppSettings) => AppSettings,
    useDebounce = true
  ) => {
    return update((settings) => {
      const newSettings = callback(settings)

      // Use debounced or immediate save based on param
      if (useDebounce) {
        debouncedSaveSettings(newSettings)
      } else {
        // Handle errors instead of using void
        saveSettings(newSettings).catch((error) => {
          logger.error('Failed to save settings immediately:', error)
          // Error is already handled by withErrorHandling wrapper
        })
      }

      return newSettings
    })
  }

  // For changes that need immediate action after saving
  const handleSettingsChangeAndWait = async (
    callback: (settings: AppSettings) => AppSettings
  ): Promise<AppSettings> => {
    let newSettings: AppSettings = DEFAULT_SETTINGS

    update((settings) => {
      newSettings = callback(settings)
      return newSettings
    })

    // Save immediately and wait for completion
    await saveSettings(newSettings)
    return newSettings
  }

  return {
    subscribe,
    quickSwitchScripts,
    activeScript,

    load: withErrorHandling(async () => {
      const settings = await StorageService.getSettings()
      set(settings)
    }, ERROR_TYPES.LOAD_SETTINGS),

    updateSettings: withErrorHandling(async (partialSettings: Partial<AppSettings>) => {
      handleSettingsChange((settings) => ({
        ...settings,
        ...partialSettings,
      }))
    }, ERROR_TYPES.SAVE_SETTINGS),

    updatePACScript: withErrorHandling(
      async (script: Omit<ProxyConfig, 'id'>, scriptId: string | null) => {
        // Use immediate save without debounce for critical proxy operations
        const updatedSettings = await handleSettingsChangeAndWait((settings) => {
          if (scriptId) {
            // Update existing script
            return {
              ...settings,
              proxyConfigs: settings.proxyConfigs.map((s) =>
                s.id === scriptId ? { ...script, id: scriptId } : s
              ),
            }
          } else {
            // Add new script
            const newScript = { ...script, id: crypto.randomUUID() }
            return {
              ...settings,
              proxyConfigs: [...settings.proxyConfigs, newScript],
            }
          }
        })

        // Get the actual scriptId (either the one passed in or the new one created)
        const actualScriptId =
          scriptId ||
          updatedSettings.proxyConfigs.find((s) => !scriptId && s.name === script.name)?.id ||
          ''

        // Send message to background to update PAC refresh alarms
        await ChromeService.sendMessage({
          type: 'SCRIPT_UPDATE',
          scriptId: actualScriptId,
        })

        // Check if this edit affects an active Auto-Proxy config
        // If the edited proxy is referenced by the currently active Auto-Proxy, regenerate and re-apply PAC
        if (scriptId && updatedSettings.activeScriptId) {
          const activeConfig = updatedSettings.proxyConfigs.find(
            (p) => p.id === updatedSettings.activeScriptId
          )

          if (activeConfig?.autoProxy) {
            // Check if the edited proxy is referenced by this Auto-Proxy's rules or fallback
            const isReferencedInRules = activeConfig.autoProxy.rules.some(
              (rule) => rule.proxyType === 'existing' && rule.proxyId === scriptId
            )
            const isReferencedInFallback =
              activeConfig.autoProxy.fallbackType === 'existing' &&
              activeConfig.autoProxy.fallbackProxyId === scriptId

            if (isReferencedInRules || isReferencedInFallback) {
              // Regenerate PAC script with updated proxy config
              const generatedPAC = PACScriptGenerator.generate(
                activeConfig.autoProxy,
                updatedSettings.proxyConfigs
              )
              const proxyToSend = {
                ...activeConfig,
                pacScript: { data: generatedPAC },
                mode: 'pac_script' as const,
              }
              logger.info(
                'Regenerating PAC script for active Auto-Proxy after referenced proxy update:',
                activeConfig.name
              )
              await ChromeService.sendMessage({
                type: 'SET_PROXY',
                proxy: proxyToSend,
              })
            }
          }
        }

        return updatedSettings
      },
      ERROR_TYPES.SAVE_SCRIPT
    ),

    updateScriptQuickSwitch: withErrorHandling(async (scriptId: string, quickSwitch: boolean) => {
      if (!scriptId) return

      // First save the changes and wait for them to complete
      const updatedSettings = await handleSettingsChangeAndWait((settings) => ({
        ...settings,
        proxyConfigs: settings.proxyConfigs.map((s) =>
          s.id === scriptId ? { ...s, quickSwitch } : s
        ),
      }))

      // Only after settings are saved, send the message
      await ChromeService.sendMessage({
        type: 'SCRIPT_UPDATE',
        scriptId,
      })

      return updatedSettings
    }, ERROR_TYPES.SAVE_SCRIPT),

    deletePACScript: withErrorHandling(async (scriptId: string) => {
      // Check if the script being deleted is currently active
      const settings = await StorageService.getSettings()
      const wasActive = settings.activeScriptId === scriptId

      // Save without debounce to make sure changes are persisted before UI updates
      handleSettingsChange((currentSettings) => {
        // Remove the proxy config
        let proxyConfigs = currentSettings.proxyConfigs.filter((s) => s.id !== scriptId)

        // Cascade cleanup: Remove orphaned references from Auto-Proxy configs
        proxyConfigs = proxyConfigs.map((config) => {
          if (!config.autoProxy) return config

          // Remove rules that reference the deleted proxy
          const cleanedRules = config.autoProxy.rules
            .filter((rule) => !(rule.proxyType === 'existing' && rule.proxyId === scriptId))
            .map((rule, index) => ({ ...rule, priority: index })) // Recalculate priorities

          // Clean fallback if it references the deleted proxy
          let fallbackType = config.autoProxy.fallbackType
          let fallbackProxyId = config.autoProxy.fallbackProxyId
          if (fallbackType === 'existing' && fallbackProxyId === scriptId) {
            fallbackType = 'direct'
            fallbackProxyId = undefined
          }

          return {
            ...config,
            autoProxy: {
              ...config.autoProxy,
              rules: cleanedRules,
              fallbackType,
              fallbackProxyId,
            },
          }
        })

        const newSettings = {
          ...currentSettings,
          proxyConfigs,
        }

        // Clear activeScriptId if it was deleted
        if (currentSettings.activeScriptId === scriptId) {
          newSettings.activeScriptId = null
        }

        return newSettings
      }, false) // false = don't use debounce

      // If the deleted script was active, clear Chrome's proxy
      if (wasActive) {
        logger.info('Deleted script was active, clearing Chrome proxy')
        await ChromeService.sendMessage({
          type: 'CLEAR_PROXY',
        })
      }
    }, ERROR_TYPES.DELETE_SCRIPT),

    quickSwitchToggle: withErrorHandling(async (enabled: boolean) => {
      // First save the changes and wait for them to complete
      const updatedSettings = await handleSettingsChangeAndWait((settings) => ({
        ...settings,
        quickSwitchEnabled: enabled,
      }))

      // Only after settings are saved, send the message
      await ChromeService.sendMessage({
        type: 'QUICK_SWITCH',
        enabled,
      })

      return updatedSettings
    }, ERROR_TYPES.SAVE_SETTINGS),

    setProxy: withErrorHandling(async (id: string, isActive: boolean) => {
      // Wait for any pending proxy change to complete (prevent race conditions)
      if (proxyChangePending) {
        logger.info('Waiting for pending proxy change to complete...')
        await proxyChangePending
      }

      // Create new proxy change promise and store it
      proxyChangePending = (async () => {
        // First save the changes and wait for completion
        const savedSettings = await handleSettingsChangeAndWait((settings) => {
          const proxyConfigs = settings.proxyConfigs.map((script) => ({
            ...script,
            isActive: script.id === id ? isActive : false,
          }))

          return {
            ...settings,
            proxyConfigs,
            activeScriptId: isActive ? id : null,
          }
        })

        // Use the saved settings directly instead of re-fetching (Fix #7)
        const activeScript = savedSettings.proxyConfigs.find((s) => s.id === id)

        if (!activeScript) return

        // Send the appropriate message based on the active state
        if (isActive && activeScript) {
          // Check if this is an Auto-Proxy config and generate PAC script
          let proxyToSend = activeScript
          if (activeScript.autoProxy) {
            const generatedPAC = PACScriptGenerator.generate(
              activeScript.autoProxy,
              savedSettings.proxyConfigs
            )
            // Create a copy with the generated PAC script
            proxyToSend = {
              ...activeScript,
              pacScript: { data: generatedPAC },
              mode: 'pac_script',
            }
            logger.info('Generated PAC script for Auto-Proxy config:', activeScript.name)
          }

          await ChromeService.sendMessage({
            type: 'SET_PROXY',
            proxy: proxyToSend,
          })
        } else {
          await ChromeService.sendMessage({
            type: 'CLEAR_PROXY',
          })
        }
      })()

      try {
        await proxyChangePending
      } finally {
        proxyChangePending = null
      }
    }, ERROR_TYPES.SAVE_SETTINGS),

    reloadSettings: withErrorHandling(async () => {
      await StorageService.invalidateCache()
      const settings = await StorageService.getSettings()
      set(settings)
    }, ERROR_TYPES.LOAD_SETTINGS),

    init: withErrorHandling(async () => {
      await StorageService.migrateStorage()
      await StorageService.invalidateCache()
      const settings = await StorageService.getSettings()
      set(settings)
    }, ERROR_TYPES.INITIALIZATION),
  }
}

export const settingsStore = createSettingsStore()
