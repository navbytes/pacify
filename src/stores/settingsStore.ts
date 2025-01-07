import { writable } from 'svelte/store'
import {
  ERROR_TYPES,
  type AppSettings,
  type BaseMessage,
  type PACScript,
  type QuickSwitchMessage,
  type SetProxyMessage,
} from '@/interfaces'
import { DEFAULT_SETTINGS } from '@/constants/app'
import { SettingsReader } from '@/services/SettingsReader'
import { SettingsWriter } from '@/services/SettingsWriter'
import { ChromeService } from '@/services/ChromeService'
import { NotifyService } from '@/services/NotifyService'

function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>(DEFAULT_SETTINGS)

  return {
    subscribe,
    set,
    update,
    async load() {
      try {
        const settings = await SettingsReader.getSettings()
        set(settings)
      } catch (error) {
        NotifyService.error(ERROR_TYPES.LOAD_SETTINGS, error)
      }
    },
    async updateSettings(partialSettings: Partial<AppSettings>) {
      const settings = await SettingsReader.getSettings()
      const newSettings = { ...settings, ...partialSettings }
      await SettingsWriter.saveSettings(newSettings)
      set(newSettings)
    },
    async updatePACScript(
      script: Omit<PACScript, 'id'>,
      scriptId: string | null
    ) {
      try {
        if (scriptId) {
          await SettingsWriter.updatePACScript({
            ...script,
            id: scriptId,
          })
        } else {
          await SettingsWriter.addPACScript(script)
        }
        this.reloadSettings()
      } catch (error) {
        NotifyService.error(ERROR_TYPES.SAVE_SCRIPT, error)
      }
    },
    async updateScriptQuickSwitch(scriptId: string, quickSwitch: boolean) {
      if (scriptId) {
        await SettingsWriter.updateScriptQuickSwitch(scriptId, quickSwitch)
      }
      this.reloadSettings()
    },
    async deletePACScript(scriptId: string) {
      try {
        await SettingsWriter.deletePACScript(scriptId)
        this.reloadSettings()
      } catch (error) {
        NotifyService.error(ERROR_TYPES.DELETE_SCRIPT, error)
      }
    },
    async quickSwitchToggle(enabled: boolean) {
      await SettingsWriter.toggleQuickSwitch(enabled)
      this.reloadSettings()

      await ChromeService.sendMessage<QuickSwitchMessage>({
        type: 'QUICK_SWITCH',
        enabled,
      })
    },
    async proxyToggle(scriptId: string, isActive: boolean) {
      const settings = await SettingsReader.getSettings()
      const updatedScripts = settings.pacScripts.map((script) => ({
        ...script,
        isActive: script.id === scriptId ? isActive : false,
      }))

      await SettingsWriter.updateAllScripts(updatedScripts)

      this.reloadSettings()

      if (isActive) {
        const activeScript = updatedScripts.find((s) => s.id === scriptId)
        if (activeScript) {
          await ChromeService.sendMessage<SetProxyMessage>({
            type: 'SET_PROXY',
            name: activeScript.name,
            script: activeScript.script,
            color: activeScript.color,
          })
        }
      } else {
        await ChromeService.sendMessage<BaseMessage>({
          type: 'CLEAR_PROXY',
        })
      }
    },
    async reloadSettings() {
      const settings = await SettingsReader.getSettings()
      update(() => settings)
    },
    init() {
      // Load initial data
      this.load()
    },
  }
}

export const settingsStore = createSettingsStore()
