<script lang="ts">
  import BasicSettings from './BasicSettings.svelte'
  import ProxyModeSelector from './ProxyModeSelector.svelte'
  import PACScriptSettings from './PACScriptSettings.svelte'
  import ManualProxyConfiguration from './ManualProxyConfiguration.svelte'
  import ActionButtons from './ActionButtons.svelte'

  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import type {
    ProxyConfig,
    ProxyMode,
    ProxySettings,
    ProxyServer,
  } from '@/interfaces'
  import { Globe, Radar, Settings, Zap } from 'lucide-svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  export let proxyConfig: ProxyConfig | undefined
  export let onSave: (config: Omit<ProxyConfig, 'id'>) => Promise<void>
  export let onCancel: () => void

  const DEFAULT_PROXY_CONFIG: ProxyServer = {
    scheme: 'http',
    host: '',
    port: '',
  }

  // Basic Settings
  let name: string = proxyConfig?.name || ''
  let color: string = proxyConfig?.color || 'gray'
  let isActive: boolean = proxyConfig?.isActive || false

  // Proxy Mode
  let proxyMode: ProxyMode = proxyConfig?.mode || 'system'

  // PAC Script Settings
  let editorContent: string = proxyConfig?.pacScript?.data || ''
  let pacUrl: string = ''
  let pacMandatory: boolean = false

  // Manual Proxy Settings
  let proxySettings: ProxySettings = {
    singleProxy: proxyConfig?.rules?.singleProxy ?? { ...DEFAULT_PROXY_CONFIG },
    proxyForHttp: proxyConfig?.rules?.proxyForHttp ?? {
      ...DEFAULT_PROXY_CONFIG,
    },
    proxyForHttps: proxyConfig?.rules?.proxyForHttps ?? {
      ...DEFAULT_PROXY_CONFIG,
    },
    proxyForFtp: proxyConfig?.rules?.proxyForFtp ?? { ...DEFAULT_PROXY_CONFIG },
    fallbackProxy: proxyConfig?.rules?.fallbackProxy ?? {
      ...DEFAULT_PROXY_CONFIG,
    },
    bypassList: proxyConfig?.rules?.bypassList || [],
  }
  let useSharedProxy: boolean = true
  if (proxyConfig?.rules) {
    if (proxyConfig?.rules.singleProxy) {
      useSharedProxy = true
    } else {
      useSharedProxy = false
    }
  }
  let bypassListContent: string = proxySettings.bypassList.join('\n')

  // Other state variables
  let errorMessage: string = ''
  let isSubmitting: boolean = false

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
      }

      if (proxyMode === 'pac_script') {
        config.pacScript = {
          url: pacUrl,
          data: pacUrl ? '' : editorContent.trim(),
          mandatory: pacMandatory,
        }
      } else if (proxyMode === 'fixed_servers') {
        config.rules = {
          bypassList: bypassListContent
            .split('\n')
            .filter((line) => line.trim()),
        }

        if (useSharedProxy) {
          config.rules.singleProxy = proxySettings.singleProxy
        } else {
          if (proxySettings.proxyForHttp.host)
            config.rules.proxyForHttp = proxySettings.proxyForHttp
          if (proxySettings.proxyForHttps.host)
            config.rules.proxyForHttps = proxySettings.proxyForHttps
          if (proxySettings.proxyForFtp.host)
            config.rules.proxyForFtp = proxySettings.proxyForFtp
          if (proxySettings.fallbackProxy.host)
            config.rules.fallbackProxy = proxySettings.fallbackProxy
        }
      }

      await onSave(config)
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : I18nService.getMessage('invalidConfiguration')
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
>
  <div
    class={`
      bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col
      transition-all duration-300 ease-in-out overflow-y-auto
      w-full max-w-4xl min-h-[50vh] max-h-[90vh]
    `}
    role="dialog"
    aria-labelledby="editor-title"
  >
    <form class="flex flex-col flex-1" on:submit={handleSubmit}>
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {I18nService.getMessage('proxyConfiguration')}
        </h2>
      </div>
      <div class="px-6 py-4 space-y-6 flex-1">
        <div
          class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            <p class="text-slate-600 dark:text-slate-400">
              <Globe size={20} class="inline-block" />
              {I18nService.getMessage('systemProxy')}
            </p>
          </div>
        {:else if proxyMode === 'direct'}
          <div
            id="systemProxy"
            class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <p class="text-slate-600 dark:text-slate-400">
              <Zap size={20} class="inline-block" />
              {I18nService.getMessage('directModeHelp')}
            </p>
          </div>
        {:else if proxyMode === 'auto_detect'}
          <div
            id="systemProxy"
            class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <p class="text-slate-600 dark:text-slate-400">
              <Radar size={20} class="inline-block" />
              {I18nService.getMessage('autoDetectModeHelp')}
            </p>
          </div>
        {:else if proxyMode === 'pac_script'}
          <PACScriptSettings bind:pacUrl bind:pacMandatory bind:editorContent />
        {:else if proxyMode === 'fixed_servers'}
          <ManualProxyConfiguration
            bind:useSharedProxy
            bind:proxySettings
            bind:bypassListContent
          />
        {/if}

        <!-- Error Message -->
        {#if errorMessage}
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
  :global(body.modal-open) {
    @apply overflow-hidden;
  }

  :global(.monaco-editor) {
    @apply rounded-md overflow-hidden;
  }

  :global(.monaco-editor .margin) {
    @apply bg-gray-100 dark:bg-gray-800;
  }
</style>
