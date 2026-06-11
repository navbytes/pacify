<script lang="ts">
import { tick } from 'svelte'
import { cubicOut } from 'svelte/easing'
import { slide } from 'svelte/transition'
import type { ProxyConfig, ProxyMode, ProxyServer, ProxySettings } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { toastStore } from '@/stores/toastStore'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { getRandomProxyColor } from '@/utils/colors'
import { fetchPacViaBackground } from '@/utils/fetchPac'
import { Globe, Power, Radar, Settings, X, Zap } from '@/utils/icons'
import { modalFocus } from '@/utils/modalFocus'
import Button from '../Button.svelte'
import Text from '../Text.svelte'
import BasicSettings from './BasicSettings.svelte'
import ConnectionTypeSelect from './ConnectionTypeSelect.svelte'
import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
import PACScriptSettings from './PACScriptSettings.svelte'

interface Props {
  proxyConfig?: ProxyConfig
  onSave: (config: Omit<ProxyConfig, 'id'>, activate: boolean) => Promise<void>
  onCancel: () => void
  // Picking "Route by site" in the connection-type dropdown hands off to the
  // rule-based routing editor (item 10). Only offered when creating.
  onSwitchToRouting?: () => void
}

let { proxyConfig = undefined, onSave, onCancel, onSwitchToRouting }: Props = $props()

// Which footer verb was pressed: "Save" (false) or "Save & Turn On" (true).
let activateOnSave = $state(false)

const DEFAULT_PROXY_CONFIG: ProxyServer = {
  scheme: 'http',
  host: '',
  port: '',
  username: '',
  password: '',
}

// Basic Settings
let name = $state<string>('')
// Use existing color for editing, random color for new proxies
let color = $state<string>('')
let badgeLabel = $state<string>('')
let isActive = $state<boolean>(false)
let quickSwitch = $state<boolean>(false)

// Proxy Mode
let proxyMode = $state<ProxyMode>('fixed_servers')

// PAC Script Settings
let editorContent = $state<string>('')
let pacUrl = $state<string>('')
let pacMandatory = $state<boolean>(false)
let updateInterval = $state<number>(0)
let lastFetched = $state<number | undefined>(undefined)

$effect(() => {
  // Initialize state from proxyConfig
  name = proxyConfig?.name || ''
  color = proxyConfig?.color || getRandomProxyColor()
  badgeLabel = proxyConfig?.badgeLabel || ''
  isActive = proxyConfig?.isActive || false
  quickSwitch = proxyConfig?.quickSwitch || false
  proxyMode = proxyConfig?.mode || 'fixed_servers'
  editorContent = proxyConfig?.pacScript?.data || ''
  pacUrl = proxyConfig?.pacScript?.url || ''
  pacMandatory = proxyConfig?.pacScript?.mandatory || false
  updateInterval = proxyConfig?.pacScript?.updateInterval || 0
  lastFetched = proxyConfig?.pacScript?.lastFetched

  // Initialize manual proxy settings
  // Merge existing configs with defaults to ensure all fields (including username/password) are present
  proxySettings = {
    singleProxy: { ...DEFAULT_PROXY_CONFIG, ...proxyConfig?.rules?.singleProxy },
    proxyForHttp: { ...DEFAULT_PROXY_CONFIG, ...proxyConfig?.rules?.proxyForHttp },
    proxyForHttps: { ...DEFAULT_PROXY_CONFIG, ...proxyConfig?.rules?.proxyForHttps },
    proxyForFtp: { ...DEFAULT_PROXY_CONFIG, ...proxyConfig?.rules?.proxyForFtp },
    fallbackProxy: { ...DEFAULT_PROXY_CONFIG, ...proxyConfig?.rules?.fallbackProxy },
    bypassList: proxyConfig?.rules?.bypassList || [],
  }
  useSharedProxy = proxyConfig?.rules?.singleProxy !== undefined ? true : !proxyConfig?.rules
  // Initialize bypassListContent directly from proxyConfig to avoid reading from proxySettings
  bypassListContent = (proxyConfig?.rules?.bypassList || []).join('\n')
})

async function handlePacRefresh() {
  if (!pacUrl) return

  try {
    const data = await fetchPacViaBackground(pacUrl)
    editorContent = data
    lastFetched = Date.now()

    // For existing scripts, immediately persist the lastFetched timestamp
    // This ensures the background alarm system uses the correct timestamp
    if (proxyConfig?.id) {
      const updatedConfig: ProxyConfig = {
        ...proxyConfig,
        pacScript: {
          ...proxyConfig.pacScript,
          data,
          lastFetched,
        },
      }
      await SettingsWriter.updatePACScript(updatedConfig)
    }

    // Show success message
    const successMsg =
      I18nService.getMessage('pacScriptRefreshed') || 'PAC script refreshed successfully'
    toastStore.show(successMsg, 'success')
  } catch (error) {
    logger.error('Error refreshing PAC script:', error)
    const errorMsg =
      I18nService.getMessage('pacScriptRefreshFailed') || 'Failed to refresh PAC script'
    toastStore.show(errorMsg, 'error')
  }
}

// Manual Proxy Settings
let proxySettings = $state<ProxySettings>({
  singleProxy: { ...DEFAULT_PROXY_CONFIG },
  proxyForHttp: { ...DEFAULT_PROXY_CONFIG },
  proxyForHttps: { ...DEFAULT_PROXY_CONFIG },
  proxyForFtp: { ...DEFAULT_PROXY_CONFIG },
  fallbackProxy: { ...DEFAULT_PROXY_CONFIG },
  bypassList: [],
})
let useSharedProxy = $state<boolean>(true)
let bypassListContent = $state<string>('')

// Other state variables
let errorMessage = $state<string>('')
let isSubmitting = $state<boolean>(false)

async function handleSubmit(event: Event) {
  event.preventDefault()
  if (isSubmitting) return
  errorMessage = ''

  if (!name.trim()) {
    errorMessage = I18nService.getMessage('nameRequired')
    tick().then(() => {
      document
        .querySelector('[data-error-message]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }

  try {
    isSubmitting = true

    const config: ProxyConfig = {
      mode: proxyMode as ProxyMode,
      name: name.trim(),
      color,
      badgeLabel: badgeLabel.trim() || undefined,
      isActive,
      quickSwitch,
    }

    if (proxyMode === 'pac_script') {
      // If using PAC URL, fetch the script if it hasn't been fetched yet or URL changed
      if (pacUrl) {
        const urlChanged = proxyConfig?.pacScript?.url !== pacUrl
        const needsInitialFetch = !lastFetched || urlChanged

        if (needsInitialFetch) {
          try {
            const data = await fetchPacViaBackground(pacUrl)
            editorContent = data
            lastFetched = Date.now()
          } catch (error) {
            logger.error('Error fetching PAC script:', error)
            errorMessage =
              I18nService.getMessage('pacScriptFetchError') || 'Failed to fetch PAC script from URL'
            tick().then(() => {
              document
                .querySelector('[data-error-message]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            })
            // Error is shown in modal via errorMessage, no need for toast notification
            return // Don't save if fetch fails
          }
        }
      }

      config.pacScript = {
        url: pacUrl,
        data: pacUrl ? editorContent.trim() : editorContent.trim(),
        mandatory: pacMandatory,
        updateInterval: pacUrl ? updateInterval : undefined,
        lastFetched: pacUrl ? lastFetched : undefined,
      }
    } else if (proxyMode === 'fixed_servers') {
      config.rules = {
        bypassList: bypassListContent.split('\n').filter((line) => line.trim()),
      }

      if (useSharedProxy) {
        // For single proxy, we need to ensure the proxy has at least a host
        if (proxySettings.singleProxy?.host?.trim()) {
          config.rules.singleProxy = proxySettings.singleProxy
        } else {
          // If no host is provided, but we're in fixed_servers mode with useSharedProxy,
          // we still need to save the configuration (it might be intentionally empty)
          config.rules.singleProxy = proxySettings.singleProxy
        }
      } else {
        // For individual proxies, add only those with hosts
        if (proxySettings.proxyForHttp?.host?.trim())
          config.rules.proxyForHttp = proxySettings.proxyForHttp
        if (proxySettings.proxyForHttps?.host?.trim())
          config.rules.proxyForHttps = proxySettings.proxyForHttps
        if (proxySettings.proxyForFtp?.host?.trim())
          config.rules.proxyForFtp = proxySettings.proxyForFtp
        if (proxySettings.fallbackProxy?.host?.trim())
          config.rules.fallbackProxy = proxySettings.fallbackProxy
      }
    }

    await onSave(config, activateOnSave)
  } catch (error) {
    logger.error('Error saving proxy configuration:', error)
    errorMessage =
      error instanceof Error ? error.message : I18nService.getMessage('invalidConfiguration')
    tick().then(() => {
      document
        .querySelector('[data-error-message]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  } finally {
    isSubmitting = false
  }
}

function handleClose() {
  onCancel()
}

function handleKeydown(event: KeyboardEvent) {
  // Focus trapping is handled by the shared `modalFocus` action.
  if (event.key === 'Escape') {
    handleClose()
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<div
  class={cn(modalVariants.overlay(), flexPatterns.center)}
  data-testid="proxy-config-modal"
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="editor-title"
  tabindex="-1"
>
  <!-- Modal Content -->
  <div
    class={cn(
      modalVariants.content({ size: 'xl' }),
      'mx-4 animate-scale-in flex flex-col max-h-[90vh] overflow-hidden'
    )}
    use:modalFocus
    tabindex="-1"
  >
    <!-- Accent bar for editor identity -->
    <div class="h-1 shrink-0 bg-linear-to-r from-blue-500 to-indigo-500"></div>

    <form class={cn(flexPatterns.col, 'flex-1 min-h-0 relative')} onsubmit={handleSubmit}>
      <!-- Header -->
      <div class="relative px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- Icon badge -->
            <div
              class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40"
            >
              <Settings size={20} class="text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2
                id="editor-title"
                class="text-xl font-bold text-slate-800 dark:text-slate-100"
                data-testid="modal-title"
              >
                {proxyConfig ? I18nService.getMessage('editProxy') || 'Edit Proxy' : I18nService.getMessage('proxyConfiguration')}
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-300 mt-0.5">
                {proxyConfig
                    ? `Editing: ${proxyConfig.name}`
                    : I18nService.getMessage('createProxySubtitle')}
              </p>
            </div>
          </div>

          <!-- Close button -->
          <Button
            type="button"
            onclick={handleClose}
            color="ghost"
            variant="minimal"
            aria-label={I18nService.getMessage('close')}
            classes="p-2 min-w-11 min-h-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            data-testid="modal-close-btn"
          >
            {#snippet icon()}
              <X size={20} />
            {/snippet}
          </Button>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <!-- Basic Settings Section -->
        <div class="relative overflow-hidden rounded-xl">
          <div
            class="absolute inset-0 bg-linear-to-br from-slate-50 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/50 dark:to-slate-800/50"
          ></div>
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-slate-400 to-slate-500"
          ></div>

          <div class="relative p-4 border border-slate-200/50 dark:border-slate-700/30 rounded-xl">
            <div class="flex items-center gap-2 mb-4">
              <div class="relative">
                <div
                  class="relative p-1.5 rounded-lg bg-linear-to-br from-slate-500 to-slate-600 shadow-sm"
                >
                  <Settings size={14} class="text-white" />
                </div>
              </div>
              <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
                {I18nService.getMessage('basicSettings')}
              </Text>
            </div>
            <BasicSettings bind:name bind:color bind:badgeLabel bind:isActive />
          </div>
        </div>

        <!-- Connection type — de-jargoned "what kind of proxy" (item 9/10) -->
        <div>
          <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {I18nService.getMessage('connectionType')}
            <span class="text-red-500">*</span>
          </span>
          <ConnectionTypeSelect
            bind:value={proxyMode}
            onRouteBySite={proxyConfig ? undefined : onSwitchToRouting}
          />
        </div>

        <!-- Mode-specific Configuration -->
        {#key proxyMode}
          <div transition:slide={{ duration: 200, easing: cubicOut }}>
            {#if proxyMode === 'system'}
              <div class="relative overflow-hidden rounded-xl">
                <div
                  class="absolute inset-0 bg-linear-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-800/30"
                ></div>
                <div
                  class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-slate-400 to-slate-500"
                ></div>
                <div class="relative p-5 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Globe size={20} class="text-slate-600 dark:text-slate-300" />
                    </div>
                    <Text as="p" color="muted">{I18nService.getMessage('systemProxy')}</Text>
                  </div>
                </div>
              </div>
            {:else if proxyMode === 'direct'}
              <div class="relative overflow-hidden rounded-xl">
                <div
                  class="absolute inset-0 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20"
                ></div>
                <div
                  class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-cyan-500"
                ></div>
                <div class="relative p-5 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Zap size={20} class="text-blue-600 dark:text-blue-400" />
                    </div>
                    <Text as="p" color="muted">{I18nService.getMessage('directModeHelp')}</Text>
                  </div>
                </div>
              </div>
            {:else if proxyMode === 'auto_detect'}
              <div class="relative overflow-hidden rounded-xl">
                <div
                  class="absolute inset-0 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20"
                ></div>
                <div
                  class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-indigo-500"
                ></div>
                <div class="relative p-5 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Radar size={20} class="text-blue-600 dark:text-blue-400" />
                    </div>
                    <Text as="p" color="muted">{I18nService.getMessage('autoDetectModeHelp')}</Text>
                  </div>
                </div>
              </div>
            {:else if proxyMode === 'pac_script'}
              <PACScriptSettings
                bind:pacUrl
                bind:pacMandatory
                bind:editorContent
                bind:updateInterval
                bind:lastFetched
                onRefresh={handlePacRefresh}
              />
            {:else if proxyMode === 'fixed_servers'}
              <ManualProxyConfiguration
                bind:useSharedProxy
                bind:proxySettings
                bind:bypassListContent
              />
            {/if}
          </div>
        {/key}
      </div>

      <!-- Error Message -->
      {#if errorMessage}
        <div
          class="relative mx-6 mb-4 overflow-hidden rounded-xl"
          data-error-message
          role="alert"
          transition:slide={{ duration: 200 }}
        >
          <div
            class="absolute inset-0 bg-linear-to-r from-red-500/10 to-rose-500/10 dark:from-red-500/5 dark:to-rose-500/5"
          ></div>
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-500 to-rose-500"
          ></div>
          <div
            class="relative flex items-start gap-3 p-4 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div class="shrink-0 p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
              <svg
                class="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <Text as="p" size="sm" classes="text-red-700 dark:text-red-300 font-medium">
              {errorMessage}
            </Text>
          </div>
        </div>
      {/if}

      <!-- Footer with Actions -->
      <div
        class="relative px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
      >
        <div class="flex items-center justify-end gap-3">
          <Button
            type="button"
            onclick={handleClose}
            color="secondary"
            classes="px-5"
            data-testid="modal-cancel-btn"
          >
            {I18nService.getMessage('cancel')}
          </Button>

          <!-- "Save" persists without changing the active proxy (escape hatch
               for building a proxy you don't want on yet). -->
          <Button
            type="submit"
            onclick={() => (activateOnSave = false)}
            disabled={isSubmitting}
            color="secondary"
            classes="px-5"
            data-testid="modal-save-btn"
          >
            {I18nService.getMessage('save')}
          </Button>

          <!-- "Save & Turn On" persists then activates (item 11). -->
          <Button
            type="submit"
            onclick={() => (activateOnSave = true)}
            disabled={isSubmitting}
            variant="gradient"
            gradient="blue"
            classes="px-6"
            data-testid="modal-save-activate-btn"
          >
            {#snippet icon()}
              {#if isSubmitting}
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              {:else}
                <Power size={16} />
              {/if}
            {/snippet}
            {I18nService.getMessage('saveAndTurnOn') || 'Save & Turn On'}
          </Button>
        </div>
      </div>
    </form>
  </div>
</div>

<style lang="postcss">
@import "tailwindcss" reference;

/* Note: Global styles for modal body scroll lock and CodeMirror editor
     are defined in app.css to avoid Lightning CSS warnings about :global() syntax */

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
