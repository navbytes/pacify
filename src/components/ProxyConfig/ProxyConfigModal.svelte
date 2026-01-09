<script lang="ts">
  import BasicSettings from './BasicSettings.svelte'
  import ProxyModeSelector from './ProxyModeSelector.svelte'
  import PACScriptSettings from './PACScriptSettings.svelte'
  import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
  import ActionButtons from './ActionButtons.svelte'

  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import type { ProxyConfig, ProxyMode, ProxySettings, ProxyServer } from '@/interfaces'
  import { Globe, Radar, Settings, Zap } from '@/utils/icons'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '../Text.svelte'
  import { fade, scale, slide } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { logger } from '@/services/LoggerService'
  import { cn } from '@/utils/cn'
  import { modalVariants, flexPatterns } from '@/utils/classPatterns'
  import { colors } from '@/utils/theme'
  import { SettingsWriter } from '@/services/SettingsWriter'

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
  let name = $state<string>(proxyConfig?.name || '')
  let color = $state<string>(proxyConfig?.color || 'gray')
  let isActive = $state<boolean>(proxyConfig?.isActive || false)
  let quickSwitch = $state<boolean>(proxyConfig?.quickSwitch || false)

  // Proxy Mode
  let proxyMode = $state<ProxyMode>(proxyConfig?.mode || 'system')

  // PAC Script Settings
  let editorContent = $state<string>(proxyConfig?.pacScript?.data || '')
  let pacUrl = $state<string>(proxyConfig?.pacScript?.url || '')
  let pacMandatory = $state<boolean>(proxyConfig?.pacScript?.mandatory || false)
  let updateInterval = $state<number>(proxyConfig?.pacScript?.updateInterval || 0)
  let lastFetched = $state<number | undefined>(proxyConfig?.pacScript?.lastFetched)

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
    singleProxy: proxyConfig?.rules?.singleProxy || { ...DEFAULT_PROXY_CONFIG },
    proxyForHttp: proxyConfig?.rules?.proxyForHttp || {
      ...DEFAULT_PROXY_CONFIG,
    },
    proxyForHttps: proxyConfig?.rules?.proxyForHttps || {
      ...DEFAULT_PROXY_CONFIG,
    },
    proxyForFtp: proxyConfig?.rules?.proxyForFtp || { ...DEFAULT_PROXY_CONFIG },
    fallbackProxy: proxyConfig?.rules?.fallbackProxy || {
      ...DEFAULT_PROXY_CONFIG,
    },
    bypassList: proxyConfig?.rules?.bypassList || [],
  })
  let useSharedProxy = $state<boolean>(
    proxyConfig?.rules?.singleProxy !== undefined ? true : proxyConfig?.rules ? false : true
  )
  let bypassListContent = $derived(proxySettings.bypassList.join('\n'))

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
                I18nService.getMessage('pacScriptFetchError') ||
                'Failed to fetch PAC script from URL'
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

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onCancel()
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
  class={cn(modalVariants.overlay(), flexPatterns.center, 'p-4')}
  data-testid="proxy-config-modal"
  role="presentation"
  transition:fade={{ duration: 200 }}
>
  <div
    bind:this={modalRef}
    class={cn(
      modalVariants.content({ size: 'xl' }),
      flexPatterns.col,
      'overflow-y-auto',
      'min-h-[50vh] max-h-[90vh]'
    )}
    role="dialog"
    aria-labelledby="editor-title"
    aria-modal="true"
    transition:scale={{ duration: 200, start: 0.95, opacity: 0, easing: cubicOut }}
  >
    <form class={cn(flexPatterns.col, 'flex-1')} onsubmit={handleSubmit}>
      <div class={cn(modalVariants.header())}>
        <h2 class={cn('text-xl font-semibold', colors.text.default)} data-testid="modal-title">
          {I18nService.getMessage('proxyConfiguration')}
        </h2>
      </div>
      <div class="px-6 py-4 space-y-4 flex-1">
        <div
          class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          <Settings size={20} />
          {I18nService.getMessage('basicSettings')}
        </div>
        <!-- Basic settings -->
        <BasicSettings bind:name bind:color bind:isActive />

        <!-- Proxy mode selection -->
        <ProxyModeSelector bind:proxyMode />

        <!-- PAC Script Configuration -->
        {#key proxyMode}
          <div transition:slide={{ duration: 200, easing: cubicOut }}>
            {#if proxyMode === 'system'}
              <div
                id="systemProxy"
                class="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 shadow-sm"
              >
                <Text as="p" color="muted">
                  <Globe size={20} class="inline-block mr-2" />
                  {I18nService.getMessage('systemProxy')}
                </Text>
              </div>
            {:else if proxyMode === 'direct'}
              <div
                id="systemProxy"
                class="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200 shadow-sm"
              >
                <Text as="p" color="muted">
                  <Zap size={20} class="inline-block mr-2" />
                  {I18nService.getMessage('directModeHelp')}
                </Text>
              </div>
            {:else if proxyMode === 'auto_detect'}
              <div
                id="systemProxy"
                class="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-200 shadow-sm"
              >
                <Text as="p" color="muted">
                  <Radar size={20} class="inline-block mr-2" />
                  {I18nService.getMessage('autoDetectModeHelp')}
                </Text>
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
          class="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
        >
          <div class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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
            <Text as="p" size="sm" classes="text-red-700 dark:text-red-300 font-medium">
              {errorMessage}
            </Text>
          </div>
        </div>
      {/if}

      <!-- Footer with Actions -->
      <ActionButtons {isSubmitting} {onCancel} />
    </form>
  </div>
</div>

<style lang="postcss">
  @import 'tailwindcss' reference;

  /* Note: Global styles for modal body scroll lock and CodeMirror editor
     are defined in app.css to avoid Lightning CSS warnings about :global() syntax */
</style>
