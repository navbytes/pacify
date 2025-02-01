<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import type { ListViewType, PACScript } from '@/interfaces'

  onMount(() => {
    settingsStore.init()
  })

  let pacScripts = $derived($settingsStore.pacScripts)

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
  let displayScripts = $derived<PACScript[]>(
    pageType === 'QUICK_SWITCH'
      ? pacScripts.filter((script) => script.quickSwitch)
      : pacScripts
  )
</script>

<section class="w-full">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
      {title}
    </h2>

    {#if pageType === 'QUICK_SWITCH'}
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {displayScripts.length} scripts
      </span>
    {/if}
  </div>

  {#if displayScripts.length > 0}
    <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {#each displayScripts as script (script.id)}
        <ScriptItem
          {script}
          {pageType}
          onScriptEdit={() => openEditor(script.id)}
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
            No PAC scripts available. Add your first script to get started.
          </p>
        {:else if pageType === 'QUICK_SWITCH'}
          <p class="text-sm text-gray-600 dark:text-gray-400">
            No quick switch scripts configured. Drag scripts here to enable
            quick switching.
          </p>
        {:else}
          <p class="text-sm text-gray-600 dark:text-gray-400">
            No scripts available. Click "Add New Script" to create your first
            PAC script.
          </p>
        {/if}
      </div>
    </div>
  {/if}

  {#if pageType === 'QUICK_SWITCH' && displayScripts.length > 0}
    <div class="mt-4 space-y-1">
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Drag scripts here to enable quick switching
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Click the extension icon to cycle through these scripts
      </p>
    </div>
  {/if}
</section>

<style lang="postcss">
  .grid > :global(*) {
    @apply transition-all duration-200;
  }
</style>
