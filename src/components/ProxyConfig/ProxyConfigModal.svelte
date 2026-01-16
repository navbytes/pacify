<script lang="ts">
import { cubicOut } from 'svelte/easing'
import { fade, slide } from 'svelte/transition'
import type { ProxyConfig, ProxyMode, ProxyServer, ProxySettings } from '@/interfaces'
import { ERROR_TYPES } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import { NotifyService } from '@/services/NotifyService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { flexPatterns } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { getRandomProxyColor } from '@/utils/colors'
import { Globe, Radar, Settings, Sparkles, X, Zap } from '@/utils/icons'
import Button from '../Button.svelte'
import Text from '../Text.svelte'
import BasicSettings from './BasicSettings.svelte'
import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
import PACScriptSettings from './PACScriptSettings.svelte'
import ProxyModeSelector from './ProxyModeSelector.svelte'

interface Props {
  proxyConfig?: ProxyConfig
  onSave: (config: Omit<ProxyConfig, 'id'>) => Promise<void>
  onCancel: () => void
}

let { proxyConfig = undefined, onSave, onCancel }: Props = $props()

const DEFAULT_PROXY_CONFIG: ProxyServer = {
  scheme: 'http',
  host: '',
  port: '',
}

// Basic Settings
let name = $state<string>('')
// Use existing color for editing, random color for new proxies
let color = $state<string>('')
let isActive = $state<boolean>(false)
let quickSwitch = $state<boolean>(false)

// Proxy Mode
let proxyMode = $state<ProxyMode>('system')

// PAC Script Settings
let editorContent = $state<string>('')
let pacUrl = $state<string>('')
let pacMandatory = $state<boolean>(false)
let updateInterval = $state<number>(0)
let lastFetched = $state<number | undefined>(undefined)

// Animation state
let isVisible = $state(false)

$effect(() => {
  // Initialize state from proxyConfig
  name = proxyConfig?.name || ''
  color = proxyConfig?.color || getRandomProxyColor()
  isActive = proxyConfig?.isActive || false
  quickSwitch = proxyConfig?.quickSwitch || false
  proxyMode = proxyConfig?.mode || 'system'
  editorContent = proxyConfig?.pacScript?.data || ''
  pacUrl = proxyConfig?.pacScript?.url || ''
  pacMandatory = proxyConfig?.pacScript?.mandatory || false
  updateInterval = proxyConfig?.pacScript?.updateInterval || 0
  lastFetched = proxyConfig?.pacScript?.lastFetched

  // Initialize manual proxy settings
  proxySettings = {
    singleProxy: proxyConfig?.rules?.singleProxy || { ...DEFAULT_PROXY_CONFIG },
    proxyForHttp: proxyConfig?.rules?.proxyForHttp || { ...DEFAULT_PROXY_CONFIG },
    proxyForHttps: proxyConfig?.rules?.proxyForHttps || { ...DEFAULT_PROXY_CONFIG },
    proxyForFtp: proxyConfig?.rules?.proxyForFtp || { ...DEFAULT_PROXY_CONFIG },
    fallbackProxy: proxyConfig?.rules?.fallbackProxy || { ...DEFAULT_PROXY_CONFIG },
    bypassList: proxyConfig?.rules?.bypassList || [],
  }
  useSharedProxy = proxyConfig?.rules?.singleProxy !== undefined ? true : !proxyConfig?.rules
  bypassListContent = proxySettings.bypassList.join('\n')

  // Trigger entrance animation
  requestAnimationFrame(() => {
    isVisible = true
  })
})

async function handlePacRefresh() {
  if (!pacUrl) return

  try {
    const response = await fetch(pacUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.text()
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

    // Show success message (only logs to console in current implementation)
    const successMsg =
      I18nService.getMessage('pacScriptRefreshed') || 'PAC script refreshed successfully'
    console.info(`[SUCCESS] ${successMsg}`)
  } catch (error) {
    logger.error('Error refreshing PAC script:', error)
    NotifyService.error(ERROR_TYPES.VALIDATION, error)
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
    return
  }

  try {
    isSubmitting = true

    const config: ProxyConfig = {
      mode: proxyMode as ProxyMode,
      name: name.trim(),
      color,
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
            const response = await fetch(pacUrl)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.text()
            editorContent = data
            lastFetched = Date.now()
          } catch (error) {
            logger.error('Error fetching PAC script:', error)
            errorMessage =
              I18nService.getMessage('pacScriptFetchError') || 'Failed to fetch PAC script from URL'
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

    await onSave(config)
  } catch (error) {
    logger.error('Error saving proxy configuration:', error)
    errorMessage =
      error instanceof Error ? error.message : I18nService.getMessage('invalidConfiguration')
    NotifyService.error(ERROR_TYPES.VALIDATION, error)
  } finally {
    isSubmitting = false
  }
}

let modalRef = $state<HTMLDivElement>()
let previouslyFocusedElement: HTMLElement | null = null

$effect(() => {
  // Store the previously focused element
  previouslyFocusedElement = document.activeElement as HTMLElement

  // Focus the modal content when it opens
  if (modalRef) {
    const firstInput = modalRef.querySelector('input, textarea, select, button') as HTMLElement
    firstInput?.focus()
  }

  // Return focus when modal closes
  return () => {
    previouslyFocusedElement?.focus()
  }
})

function handleClose() {
  isVisible = false
  setTimeout(onCancel, 200)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose()
  }

  // Trap focus within modal
  if (event.key === 'Tab' && modalRef) {
    const focusableElements = modalRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4"
  data-testid="proxy-config-modal"
  role="presentation"
  transition:fade={{ duration: 200 }}
>
  <!-- Backdrop with blur and gradient -->
  <div
    class="absolute inset-0 transition-all duration-300"
    class:opacity-100={isVisible}
    class:opacity-0={!isVisible}
    onclick={handleClose}
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="-1"
    aria-label="Close modal"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/40 to-slate-900/80 backdrop-blur-md"
    ></div>
  </div>

  <!-- Modal Content -->
  <div
    bind:this={modalRef}
    class="relative w-full max-w-3xl max-h-[90vh] overflow-hidden transition-all duration-300"
    class:scale-100={isVisible}
    class:opacity-100={isVisible}
    class:scale-95={!isVisible}
    class:opacity-0={!isVisible}
    role="dialog"
    aria-labelledby="editor-title"
    aria-modal="true"
  >
    <!-- Glassmorphism container -->
    <div
      class="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden"
    >
      <!-- Top gradient accent -->
      <div
        class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
      ></div>

      <!-- Decorative blur elements -->
      <div
        class="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"
      ></div>

      <form class={cn(flexPatterns.col, 'flex-1 relative')} onsubmit={handleSubmit}>
        <!-- Header -->
        <div class="relative px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <!-- Animated icon -->
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-lg opacity-40 animate-pulse"
                ></div>
                <div
                  class="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
                >
                  <Settings size={24} class="text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h2
                  id="editor-title"
                  class="text-xl font-bold text-slate-800 dark:text-slate-100"
                  data-testid="modal-title"
                >
                  {proxyConfig ? I18nService.getMessage('editProxy') || 'Edit Proxy' : I18nService.getMessage('proxyConfiguration')}
                </h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {proxyConfig ? 'Modify your proxy settings' : 'Configure a new proxy connection'}
                </p>
              </div>
            </div>

            <!-- Close button -->
            <Button
              type="button"
              onclick={handleClose}
              color="ghost"
              variant="minimal"
              aria-label="Close"
              classes="p-2 min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
              class="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-800/50 dark:via-gray-800/50 dark:to-zinc-800/50"
            ></div>
            <div
              class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-400 via-gray-500 to-zinc-400"
            ></div>

            <div
              class="relative p-4 border border-slate-200/50 dark:border-slate-700/30 rounded-xl"
            >
              <div class="flex items-center gap-2 mb-4">
                <div class="relative">
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-slate-400 to-gray-500 rounded-lg blur-md opacity-30"
                  ></div>
                  <div
                    class="relative p-1.5 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 shadow-lg"
                  >
                    <Settings size={14} class="text-white" />
                  </div>
                </div>
                <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
                  {I18nService.getMessage('basicSettings')}
                </Text>
              </div>
              <BasicSettings bind:name bind:color bind:isActive />
            </div>
          </div>

          <!-- Proxy Mode Selection -->
          <ProxyModeSelector bind:proxyMode />

          <!-- Mode-specific Configuration -->
          {#key proxyMode}
            <div transition:slide={{ duration: 200, easing: cubicOut }}>
              {#if proxyMode === 'system'}
                <div class="relative overflow-hidden rounded-xl">
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-800/30"
                  ></div>
                  <div
                    class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-400 to-gray-500"
                  ></div>
                  <div
                    class="relative p-5 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <Globe size={20} class="text-slate-600 dark:text-slate-400" />
                      </div>
                      <Text as="p" color="muted">{I18nService.getMessage('systemProxy')}</Text>
                    </div>
                  </div>
                </div>
              {:else if proxyMode === 'direct'}
                <div class="relative overflow-hidden rounded-xl">
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20"
                  ></div>
                  <div
                    class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
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
                    class="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20"
                  ></div>
                  <div
                    class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  ></div>
                  <div
                    class="relative p-5 border border-purple-200 dark:border-purple-800 rounded-xl"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                        <Radar size={20} class="text-purple-600 dark:text-purple-400" />
                      </div>
                      <Text as="p" color="muted">
                        {I18nService.getMessage('autoDetectModeHelp')}
                      </Text>
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
            transition:slide={{ duration: 200 }}
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 dark:from-red-500/5 dark:to-rose-500/5"
            ></div>
            <div
              class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-500"
            ></div>
            <div
              class="relative flex items-start gap-3 p-4 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div class="flex-shrink-0 p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
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
            <Button type="button" onclick={handleClose} color="secondary" classes="px-5">
              {I18nService.getMessage('cancel')}
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="gradient"
              gradient="blue"
              classes="px-6"
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
                  <Sparkles size={16} />
                {/if}
              {/snippet}
              {I18nService.getMessage('save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

<style lang="postcss">
@import "tailwindcss" reference;

/* Note: Global styles for modal body scroll lock and CodeMirror editor
     are defined in app.css to avoid Lightning CSS warnings about :global() syntax */
</style>
