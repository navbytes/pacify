/**
 * Refactored Settings Store - Coordinator for app settings and proxy configs
 * This store coordinates between appSettingsStore and proxyStore
 */

import { ERROR_TYPES, type AppSettings } from '@/interfaces'
import { StorageService } from '@/services/StorageService'
import { ChromeService } from '@/services/chrome'
import { withErrorHandling } from '@/utils/errorHandling'
import { debounce } from '@/utils/debounce'
import { proxyStore } from './proxyStore'
import { appSettingsStore } from './appSettingsStore'

/**
 * Unified settings coordinator
 * Manages persistence and synchronization between stores
 */
function createSettingsCoordinator() {
  // Debounced save function
  const debouncedSave = debounce(async (settings: AppSettings) => {
    await StorageService.saveSettings(settings)
  }, 500)

  // Save settings immediately
  async function saveSettingsNow(settings: AppSettings): Promise<void> {
    await StorageService.saveSettings(settings)
  }

  // Get combined settings from both stores
  function getCombinedSettings(): AppSettings {
    const proxyState = proxyStore.getState()
    const appSettings = appSettingsStore.getState()

    return {
      proxyConfigs: proxyState.configs,
      activeScriptId: proxyState.activeScriptId,
      quickSwitchEnabled: appSettings.quickSwitchEnabled,
      disableProxyOnStartup: appSettings.disableProxyOnStartup,
      autoReloadOnProxySwitch: appSettings.autoReloadOnProxySwitch ?? true,
    }
  }

  // Save with optional debounce
  function save(useDebounce = true): void {
    const settings = getCombinedSettings()
    if (useDebounce) {
      debouncedSave(settings)
    } else {
      saveSettingsNow(settings).catch((error) => {
        console.error('Failed to save settings:', error)
      })
    }
  }

  return {
    // Re-export derived stores for backward compatibility
    quickSwitchScripts: proxyStore.quickSwitchScripts,
    activeScript: proxyStore.activeScript,

    // Load settings from storage
    load: withErrorHandling(async () => {
      const settings = await StorageService.getSettings()
      proxyStore.init(settings.proxyConfigs, settings.activeScriptId || null)
      appSettingsStore.init({
        quickSwitchEnabled: settings.quickSwitchEnabled,
        disableProxyOnStartup: settings.disableProxyOnStartup,
        autoReloadOnProxySwitch: settings.autoReloadOnProxySwitch ?? true,
      })
    }, ERROR_TYPES.LOAD_SETTINGS),

    // Initialize on app start
    init: withErrorHandling(async () => {
      await StorageService.migrateStorage()
      await StorageService.invalidateCache()
      const settings = await StorageService.getSettings()
      proxyStore.init(settings.proxyConfigs, settings.activeScriptId || null)
      appSettingsStore.init({
        quickSwitchEnabled: settings.quickSwitchEnabled,
        disableProxyOnStartup: settings.disableProxyOnStartup,
        autoReloadOnProxySwitch: settings.autoReloadOnProxySwitch ?? true,
      })
    }, ERROR_TYPES.INITIALIZATION),

    // Reload settings
    reloadSettings: withErrorHandling(async () => {
      await StorageService.invalidateCache()
      const settings = await StorageService.getSettings()
      proxyStore.init(settings.proxyConfigs, settings.activeScriptId || null)
      appSettingsStore.init({
        quickSwitchEnabled: settings.quickSwitchEnabled,
        disableProxyOnStartup: settings.disableProxyOnStartup,
        autoReloadOnProxySwitch: settings.autoReloadOnProxySwitch ?? true,
      })
    }, ERROR_TYPES.LOAD_SETTINGS),

    // Update app settings
    updateSettings: withErrorHandling(async (partialSettings: Partial<AppSettings>) => {
      if (partialSettings.quickSwitchEnabled !== undefined) {
        appSettingsStore.toggleQuickSwitch(partialSettings.quickSwitchEnabled)
      }
      if (partialSettings.disableProxyOnStartup !== undefined) {
        appSettingsStore.updateSetting(
          'disableProxyOnStartup',
          partialSettings.disableProxyOnStartup
        )
      }
      save(true)
    }, ERROR_TYPES.SAVE_SETTINGS),

    // Proxy config operations
    updatePACScript: withErrorHandling(
      async (script: Omit<import('@/interfaces').ProxyConfig, 'id'>, scriptId: string | null) => {
        proxyStore.upsertConfig(script, scriptId)
        save(true)
      },
      ERROR_TYPES.SAVE_SCRIPT
    ),

    deletePACScript: withErrorHandling(async (scriptId: string) => {
      const wasActive = proxyStore.deleteConfig(scriptId)
      save(false) // Don't debounce deletions

      if (wasActive) {
        console.log('Deleted script was active, clearing Chrome proxy')
        await ChromeService.sendMessage({
          type: 'CLEAR_PROXY',
        })
      }
    }, ERROR_TYPES.DELETE_SCRIPT),

    updateScriptQuickSwitch: withErrorHandling(async (scriptId: string, quickSwitch: boolean) => {
      if (!scriptId) return

      proxyStore.updateQuickSwitch(scriptId, quickSwitch)
      await saveSettingsNow(getCombinedSettings())

      await ChromeService.sendMessage({
        type: 'SCRIPT_UPDATE',
        scriptId,
      })
    }, ERROR_TYPES.SAVE_SCRIPT),

    setProxy: async (id: string, isActive: boolean) => {
      await proxyStore.setActive(id, isActive)
      save(false) // Save immediately, no debounce
    },

    quickSwitchToggle: withErrorHandling(async (enabled: boolean) => {
      appSettingsStore.toggleQuickSwitch(enabled)
      await saveSettingsNow(getCombinedSettings())

      await ChromeService.sendMessage({
        type: 'QUICK_SWITCH',
        enabled,
      })
    }, ERROR_TYPES.SAVE_SETTINGS),
  }
}

export const settingsStore = createSettingsCoordinator()
