<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import type { ListViewType } from '@/interfaces'

  onMount(async () => {
    settingsStore.init()
  })

  // Subscribe to scripts store
  let pacScripts = $derived($settingsStore.pacScripts)

  interface Props {
    pageType?: ListViewType
    title?: string
    onScriptEdit: (scriptId: string) => void
  }

  let {
    pageType = 'POPUP',
    title = 'PAC Scripts',
    onScriptEdit,
  }: Props = $props()

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    onScriptEdit(scriptId)
  }
</script>

<main class="scripts-section">
  <h2>{title}</h2>
  {#if pacScripts.length > 0}
    <div
      class="scripts-list {pageType === 'QUICK_SWITCH' ? 'quick-script' : ''}"
    >
      {#each pacScripts as script (script.id)}
        {#if pageType !== 'QUICK_SWITCH' || script.quickSwitch}
          <ScriptItem
            {script}
            {pageType}
            onScriptEdit={() => openEditor(script.id)}
          />
        {/if}
      {/each}
    </div>
  {:else}
    <!-- No Scripts Available -->
    <div class={`no-scripts ${pageType}`}>
      No PAC scripts available. Add your first script to get started.
    </div>
  {/if}
</main>

<style>
  @import '../styles/script-list.css';
</style>
