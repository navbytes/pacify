<script lang="ts">
  import BasicSettings from './BasicSettings.svelte'
  import ProxyModeSelector from './ProxyModeSelector.svelte'
  import PACScriptSettings from './PACScriptSettings.svelte'
  import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
  import ActionButtons from './ActionButtons.svelte'

  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import type { ProxyConfig, ProxyMode, ProxySettings, ProxyServer, ValidationResult } from '@/interfaces'
  import { Globe, Radar, Settings, Zap, AlertTriangle } from 'lucide-svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import { ProxyValidator } from '@/utils/proxyValidation'
  import Text from '../Text.svelte'

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
  let pacUrl = $state<string>('')
  let pacMandatory = $state<boolean>(false)

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

  // Phase 1: Validation state
  let validationResult = $state<ValidationResult | null>(null)
  let showValidation = $state<boolean>(false)

  async function handleSubmit(event: Event) {
    event.preventDefault()
    if (isSubmitting) return
    errorMessage = ''
    showValidation = true

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
        config.pacScript = {
          url: pacUrl,
          data: pacUrl ? '' : editorContent.trim(),
          mandatory: pacMandatory,
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

      // Phase 1: Validate configuration before saving
      validationResult = ProxyValidator.validateProxyConfig(config)

      if (!validationResult.valid) {
        // Show validation errors
        errorMessage = validationResult.errors.join('\n')
        isSubmitting = false
        return
      }

      // Show warning if there are any (but still allow save)
      if (validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings)
      }

      console.log('Saving config:', JSON.stringify(config, null, 2))
      await onSave(config)
      console.log('onSave completed successfully')
    } catch (error) {
      console.error('Error saving proxy configuration:', error)
      errorMessage =
        error instanceof Error ? error.message : I18nService.getMessage('invalidConfiguration')
      NotifyService.error(ERROR_TYPES.VALIDATION, error)
    } finally {
      isSubmitting = false
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onCancel()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  data-testid="proxy-config-modal"
>
  <div
    class={`
      bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col
      transition-all duration-300 ease-in-out overflow-y-auto
      w-full max-w-4xl min-h-[50vh] max-h-[90vh]
    `}
    role="dialog"
    aria-labelledby="editor-title"
  >
    <form class="flex flex-col flex-1" onsubmit={handleSubmit}>
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white" data-testid="modal-title">
          {I18nService.getMessage('proxyConfiguration')}
        </h2>
      </div>
      <div class="px-6 py-4 space-y-6 flex-1">
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
        {#if proxyMode === 'system'}
          <div
            id="systemProxy"
            class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Text as="p" color="muted">
              <Globe size={20} class="inline-block" />
              {I18nService.getMessage('systemProxy')}
            </Text>
          </div>
        {:else if proxyMode === 'direct'}
          <div
            id="systemProxy"
            class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Text as="p" color="muted">
              <Zap size={20} class="inline-block" />
              {I18nService.getMessage('directModeHelp')}
            </Text>
          </div>
        {:else if proxyMode === 'auto_detect'}
          <div
            id="systemProxy"
            class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Text as="p" color="muted">
              <Radar size={20} class="inline-block" />
              {I18nService.getMessage('autoDetectModeHelp')}
            </Text>
          </div>
        {:else if proxyMode === 'pac_script'}
          <PACScriptSettings bind:pacUrl bind:pacMandatory bind:editorContent />
        {:else if proxyMode === 'fixed_servers'}
          <ManualProxyConfiguration bind:useSharedProxy bind:proxySettings bind:bypassListContent />
        {/if}

        <!-- Validation Results (Phase 1) -->
        {#if showValidation && validationResult}
          {#if validationResult.errors.length > 0}
            <div
              class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              role="alert"
            >
              <div class="flex items-start gap-2">
                <AlertTriangle class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    Validation Errors
                  </h3>
                  <ul class="text-sm text-red-800 dark:text-red-200 space-y-1">
                    {#each validationResult.errors as error}
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 dark:text-red-400">•</span>
                        <span>{error}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/if}

          {#if validationResult.warnings.length > 0}
            <div
              class="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
            >
              <div class="flex items-start gap-2">
                <AlertTriangle class="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Warnings
                  </h3>
                  <ul class="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    {#each validationResult.warnings as warning}
                      <li class="flex items-start gap-2">
                        <span class="text-yellow-600 dark:text-yellow-400">⚠</span>
                        <span>{warning}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/if}
        {/if}

        <!-- Error Message (fallback) -->
        {#if errorMessage && !validationResult}
          <div class="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        {/if}
      </div>

      <!-- Footer with Actions -->
      <ActionButtons {isSubmitting} {onCancel} />
    </form>
  </div>
</div>

<style lang="postcss">
  @import 'tailwindcss' reference;

  :global(body.modal-open) {
    @apply overflow-hidden;
  }

  :global(.cm-editor) {
    @apply rounded-md overflow-hidden;
  }

  :global(.cm-editor.cm-focused) {
    @apply outline-none ring-2 ring-blue-500;
  }

  :global(.cm-scroller) {
    @apply font-mono;
  }

  /* Autocomplete styling */
  :global(.cm-tooltip-autocomplete) {
    @apply bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg;
  }

  :global(.cm-tooltip-autocomplete > ul) {
    @apply max-h-64 overflow-auto p-1;
  }

  :global(.cm-tooltip-autocomplete > ul > li) {
    @apply px-2 py-1 cursor-pointer text-sm;
  }

  :global(.cm-tooltip-autocomplete > ul > li[aria-selected]) {
    @apply bg-blue-500 text-white;
  }

  :global(.cm-completionLabel) {
    @apply font-medium;
  }

  :global(.cm-completionDetail) {
    @apply text-xs text-gray-500 dark:text-gray-400;
  }

  :global(.cm-completionInfo) {
    @apply text-xs text-gray-600 dark:text-gray-300 mt-1;
  }
</style>
