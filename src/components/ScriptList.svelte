<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import EmptyState from './EmptyState.svelte'
  import type { ListViewType, ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'
  import { Globe, Zap } from '@/utils/icons'

  // Note: settingsStore.init() is called by parent component (Popup.svelte)
  // No need to initialize again here to avoid duplicate storage reads
  let proxyConfigsFromStore = $derived($settingsStore.proxyConfigs ?? [])

  interface Props {
    pageType?: ListViewType
    title: string
    onScriptEdit?: (scriptId: string) => void
    dragType?: string
    proxies?: ProxyConfig[] // Optional filtered proxies list
  }

  let { pageType = 'POPUP', title, onScriptEdit, dragType = $bindable(), proxies }: Props = $props()

  // Use provided proxies or fall back to store
  let proxyConfigs = $derived(proxies ?? proxyConfigsFromStore)

  function openEditor(scriptId?: string) {
    if (!scriptId || !onScriptEdit) return
    onScriptEdit(scriptId)
  }

  // Fix: Use $derived to create a derived array instead of a function
  let displayProxyConfigs = $derived<ProxyConfig[]>(
    pageType === 'QUICK_SWITCH'
      ? proxyConfigs.filter((script) => script.quickSwitch)
      : pageType === 'POPUP'
        ? [...proxyConfigs].sort((a, b) => {
            // Sort Quick Switch proxies to the top
            if (a.quickSwitch && !b.quickSwitch) return -1
            if (!a.quickSwitch && b.quickSwitch) return 1
            return 0
          })
        : proxyConfigs
  )
</script>

<section class="w-full">
  {#if title !== ''}
    <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </h2>
  {/if}

  {#if displayProxyConfigs.length > 0}
    <div
      class={`
      ${pageType === 'POPUP' ? 'flex flex-col gap-4' : 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
    `}
    >
      {#each displayProxyConfigs as proxy (proxy.id)}
        <ScriptItem {proxy} {pageType} bind:dragType onScriptEdit={() => openEditor(proxy.id)} />
      {/each}
    </div>
  {:else if pageType === 'POPUP'}
    <EmptyState
      title={I18nService.getMessage('noProxiesTitle')}
      description={I18nService.getMessage('noScriptsAvailable')}
      icon={Globe}
      compact
    />
  {:else if pageType === 'QUICK_SWITCH'}
    <EmptyState
      title={I18nService.getMessage('noQuickSwitchTitle') || 'No Quick Switch proxies'}
      description={I18nService.getMessage('noQuickSwitchScripts') ||
        'Add proxies to Quick Switch for faster access'}
      icon={Zap}
      iconSize={48}
      compact
    />
  {:else}
    <EmptyState
      title={I18nService.getMessage('noProxyConfigsTitle') || 'No proxy configurations'}
      description={I18nService.getMessage('noScriptsAvailableOptions') ||
        'Create your first proxy configuration to get started'}
      actionLabel={I18nService.getMessage('addFirstProxyAction') || 'Add Proxy'}
      onAction={() => onScriptEdit?.('')}
      icon={Globe}
      iconSize={56}
    />
  {/if}
</section>

<style lang="postcss">
  @import 'tailwindcss' reference;

  .grid > :global(*) {
    @apply transition-all duration-200;
  }
</style>
