<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import EmptyState from './EmptyState.svelte'
  import ProxySearch from './ProxySearch.svelte'
  import type { ListViewType, ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'
  import { Globe, Zap } from 'lucide-svelte'

  // Note: settingsStore.init() is called by parent component (Popup.svelte)
  // No need to initialize again here to avoid duplicate storage reads
  let proxyConfigs = $derived($settingsStore.proxyConfigs ?? [])

  interface Props {
    pageType?: ListViewType
    title: string
    onScriptEdit?: (scriptId: string) => void
    dragType?: string
    showSearch?: boolean // Phase 2: Show search bar
  }

  let { pageType = 'POPUP', title, onScriptEdit, dragType = $bindable(), showSearch = false }: Props = $props()

  function openEditor(scriptId?: string) {
    if (!scriptId || !onScriptEdit) return
    onScriptEdit(scriptId)
  }

  // Base proxy configs (filtered by quick switch if needed)
  let baseProxyConfigs = $derived<ProxyConfig[]>(
    pageType === 'QUICK_SWITCH' ? proxyConfigs.filter((script) => script.quickSwitch) : proxyConfigs
  )

  // Phase 2: Filtered proxy configs (after search/filter)
  let filteredProxyConfigs = $state<ProxyConfig[]>([])

  // Display the filtered results if search is enabled, otherwise show base configs
  let displayProxyConfigs = $derived<ProxyConfig[]>(
    showSearch && filteredProxyConfigs.length >= 0 ? filteredProxyConfigs : baseProxyConfigs
  )

  // Initialize filtered results to base configs
  $effect(() => {
    if (!showSearch) {
      filteredProxyConfigs = baseProxyConfigs
    }
  })
</script>

<section class="w-full">
  {#if title !== ''}
    <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </h2>
  {/if}

  <!-- Phase 2: Search bar (OPTIONS view only) -->
  {#if showSearch && pageType === 'OPTIONS' && baseProxyConfigs.length > 0}
    <div class="mb-6">
      <ProxySearch
        proxies={baseProxyConfigs}
        onFiltered={(filtered) => filteredProxyConfigs = filtered}
      />
    </div>
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
    />
  {:else if pageType === 'QUICK_SWITCH'}
    <EmptyState
      title={I18nService.getMessage('noQuickSwitchTitle')}
      description={I18nService.getMessage('noQuickSwitchScripts')}
      icon={Zap}
    />
  {:else}
    <EmptyState
      title={I18nService.getMessage('noProxyConfigsTitle')}
      description={I18nService.getMessage('noScriptsAvailableOptions')}
      actionLabel={I18nService.getMessage('addFirstProxyAction')}
      onAction={() => onScriptEdit?.('')}
      icon={Globe}
    />
  {/if}
</section>

<style lang="postcss">
  @import 'tailwindcss' reference;

  .grid > :global(*) {
    @apply transition-all duration-200;
  }
</style>
