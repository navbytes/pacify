<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import type { ListViewType, ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'

  onMount(() => {
    settingsStore.init()
  })

  let proxyConfigs = $derived($settingsStore.proxyConfigs ?? [])

  interface Props {
    pageType?: ListViewType
    title?: string
    onScriptEdit?: (scriptId: string) => void
  }

  let {
    pageType = 'POPUP',
    title = 'PAC Scripts',
    onScriptEdit,
  }: Props = $props()

  function openEditor(scriptId?: string) {
    if (!scriptId || !onScriptEdit) return
    onScriptEdit(scriptId)
  }

  // Fix: Use $derived to create a derived array instead of a function
  let displayProxyConfigs = $derived<ProxyConfig[]>(
    pageType === 'QUICK_SWITCH'
      ? proxyConfigs.filter((script) => script.quickSwitch)
      : proxyConfigs
  )
</script>

<section class="w-full">
  {#if title !== ''}
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      {title}
    </h2>
  {/if}

  {#if pageType === 'QUICK_SWITCH'}
    <div class="space-y-1 mb-6">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {I18nService.getMessage('dragScriptsHere')}
      </p>
    </div>
  {/if}
  {#if displayProxyConfigs.length > 0}
    <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {#each displayProxyConfigs as proxy (proxy.id)}
        <ScriptItem
          {proxy}
          {pageType}
          onScriptEdit={() => openEditor(proxy.id)}
        />
      {/each}
    </div>
  {:else}
    <div
      class={`
        rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700
        ${pageType === 'POPUP' ? 'p-4' : 'p-8'}
      `}
    >
      <div class="flex flex-col items-center justify-center text-center">
        <div class="mb-2">
          <svg
            class="h-8 w-8 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {#if pageType === 'POPUP'}
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {I18nService.getMessage('noScriptsAvailable')}
          </p>
        {:else if pageType === 'QUICK_SWITCH'}
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {I18nService.getMessage('noQuickSwitchScripts')}
          </p>
        {:else}
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {I18nService.getMessage('noScriptsAvailableOptions')}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</section>

<style lang="postcss">
  .grid > :global(*) {
    @apply transition-all duration-200;
  }
</style>
