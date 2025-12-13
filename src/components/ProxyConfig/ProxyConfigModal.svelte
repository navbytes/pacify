<script lang="ts">
  import BasicSettings from './BasicSettings.svelte'
  import ProxyModeSelector from './ProxyModeSelector.svelte'
  import PACScriptSettings from './PACScriptSettings.svelte'
  import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
  import ActionButtons from './ActionButtons.svelte'

  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import type { ProxyConfig, ProxyMode, ProxySettings, ProxyServer } from '@/interfaces'
  import { Globe, Radar, Settings, Zap } from 'lucide-svelte'
  import { I18nService } from '@/services/i18n/i18nService'
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

      await onSave(config)
    } catch (error) {
      console.error('Error saving proxy configuration:', error)
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
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  data-testid="proxy-config-modal"
  role="presentation"
>
  <div
    bind:this={modalRef}
    class={`
      bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col
      transition-all duration-300 ease-in-out overflow-y-auto
      w-full max-w-4xl min-h-[50vh] max-h-[90vh]
    `}
    role="dialog"
    aria-labelledby="editor-title"
    aria-modal="true"
  >
    <form class="flex flex-col flex-1" onsubmit={handleSubmit}>
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white" data-testid="modal-title">
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

  :global(body.modal-open) {
    @apply overflow-hidden;
  }

  :global(.cm-editor) {
    @apply rounded-md;
    overflow: hidden;
  }

  :global(.cm-editor .cm-scroller) {
    overflow: auto !important;
    max-height: 400px;
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
