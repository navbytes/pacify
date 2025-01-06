<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import type { PageType } from '@/interfaces'

  onMount(async () => {
    settingsStore.init()
  })

  // Subscribe to scripts store
  $: pacScripts = $settingsStore.pacScripts

  type ScriptEditEvent = {
    scriptId: string
  }

  // Create a typed dispatch
  const dispatch = createEventDispatcher<{
    handleScriptEdit: ScriptEditEvent
  }>()

  // export let scripts: PACScript[] = []
  export let pageType: PageType = 'POPUP'
  export let title = 'PAC Scripts'

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    dispatch('handleScriptEdit', { scriptId })
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
            on:handleScriptEdit={() => openEditor(script.id)}
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
