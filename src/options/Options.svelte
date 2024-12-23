<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptEditor from '@/components/ScriptEditor.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import { ERROR_TYPES, type PageType } from '@/interfaces'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import { NotifyService } from '@/services/NotifyService'

  onMount(async () => {
    settingsStore.init()
  })

  // Subscribe to settings store
  $: settings = $settingsStore

  let showEditor = false
  let editingScriptId: string | null = null

  async function handleQuickSwitchToggle(e: CustomEvent) {
    await settingsStore.quickSwitchToggle(e.detail.checked)
  }

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }

  async function handleScriptSave(e: CustomEvent) {
    await settingsStore.updatePACScript(e.detail.script, editingScriptId)
    showEditor = false
  }

  let dropError: string | null = null

  const getDragData = (ev: DragEvent) => {
    const id = ev.dataTransfer?.getData('text/plain')
    const [pageType, scriptId] = id?.split(dragDelim) || []

    if (!id || !scriptId || !pageType) {
      throw new Error('Invalid data')
    }
    return { pageType, scriptId }
  }

  const handleDragOver = (type: PageType) => (ev: DragEvent) => {
    ev.preventDefault()
  }

  function handleDragLeave(ev: DragEvent) {
    ev.preventDefault()
    return false
  }

  // Handle drop
  const handleDrop = (type: PageType) => async (ev: DragEvent) => {
    ev.preventDefault()
    document
      .getElementById('options-container')
      ?.setAttribute('data-page-type', '')
    dropError = null

    try {
      const { pageType, scriptId } = getDragData(ev)
      if (type === 'OPTIONS' && pageType === 'QUICK_SWITCH') {
        await settingsStore.updateScriptQuickSwitch(scriptId, false)
      } else if (type === 'QUICK_SWITCH' && pageType === 'OPTIONS') {
        await settingsStore.updateScriptQuickSwitch(scriptId, true)
      }
    } catch (error) {
      NotifyService.error(ERROR_TYPES.DROP, error)
      dropError = 'drop_handling_error'
    }
  }
</script>

<div
  id="options-container"
  class="container"
  role="region"
  aria-dropeffect="move"
>
  <header class="header">
    <h1 class="title">PACify Settings</h1>
    <BackupRestore on:restore={() => settingsStore.reloadSettings()} />
    <div class="header-actions">
      <button
        id="addScriptBtn"
        class="button primary"
        on:click={() => openEditor()}
      >
        Add New Script
      </button>
    </div>
  </header>

  <section class="settings-section">
    <div class="setting-item flex">
      <label class="switch-label" for="quickSwitchToggle">
        <span>Quick Switch Mode</span>
      </label>
      <ToggleSwitch
        checked={settings.quickSwitchEnabled}
        on:change={handleQuickSwitchToggle}
      />
    </div>
    <p class="setting-description">
      When enabled, clicking the extension icon will cycle through quick-switch
      enabled scripts.
    </p>

    <div
      class="quick-scripts-section script-list dropzone"
      role="list"
      aria-dropeffect="move"
      on:dragleave={handleDragLeave}
      on:drop={handleDrop('QUICK_SWITCH')}
      on:dragover={handleDragOver('QUICK_SWITCH')}
    >
      <div class="drop-overlay">
        <p>Drop here to add to quick scripts</p>
      </div>
      <ScriptList pageType="QUICK_SWITCH" title="Quick Pac Scripts" />
      <p class="small-description">
        Please drag an existing PAC script from below here to enable quick
        switch. To remove a script please drag and drop it to the list below
        this section.
      </p>
    </div>
  </section>
  {#if dropError}
    <div class="drop-error">
      <p>{dropError}</p>
    </div>
  {/if}

  <div
    class="all-scripts-section dropzone"
    role="region"
    aria-dropeffect="move"
    on:dragleave={handleDragLeave}
    on:drop={handleDrop('OPTIONS')}
    on:dragover={handleDragOver('OPTIONS')}
  >
    <div class="drop-overlay">
      <p>Drop here to remove from quick scripts</p>
    </div>
    <div class="script-list" role="list">
      <ScriptList
        pageType="OPTIONS"
        on:handleScriptEdit={(event) => openEditor(event.detail.scriptId)}
      />
    </div>
  </div>

  {#if showEditor}
    <ScriptEditor
      script={editingScriptId
        ? settings.pacScripts.find((s) => s.id === editingScriptId)
        : undefined}
      on:save={handleScriptSave}
      on:close={() => (showEditor = false)}
    />
  {/if}
</div>
