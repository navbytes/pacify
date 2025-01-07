<script lang="ts">
  import { onMount } from 'svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptEditor from '@/components/ScriptEditor.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import { ERROR_TYPES, type PACScript, type ListViewType } from '@/interfaces'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import { NotifyService } from '@/services/NotifyService'

  onMount(async () => {
    settingsStore.init()
  })

  // Subscribe to settings store
  let settings = $derived($settingsStore)

  let showEditor = $state(false)
  let editingScriptId: string | null = $state(null)

  async function handleQuickSwitchToggle(checked: boolean) {
    console.table({ checked })
    await settingsStore.quickSwitchToggle(checked)
  }

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }

  async function handleScriptSave(script: Omit<PACScript, 'id'>) {
    await settingsStore.updatePACScript(script, editingScriptId)
    showEditor = false
  }

  let dropError: string | null = $state(null)

  const getDragData = (ev: DragEvent) => {
    const id = ev.dataTransfer?.getData('text/plain')
    const [pageType, scriptId] = id?.split(dragDelim) || []

    if (!id || !scriptId || !pageType) {
      throw new Error('Invalid data')
    }
    return { pageType, scriptId }
  }

  const handleDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  function handleDragLeave(ev: DragEvent) {
    ev.preventDefault()
    return false
  }

  // Handle drop
  const handleDrop = (type: ListViewType) => async (ev: DragEvent) => {
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
    <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
    <div class="header-actions">
      <button
        id="addScriptBtn"
        class="button primary"
        onclick={() => openEditor()}
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
        isChecked={settings.quickSwitchEnabled}
        onToggle={handleQuickSwitchToggle}
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
      ondragleave={handleDragLeave}
      ondrop={handleDrop('QUICK_SWITCH')}
      ondragover={handleDragOver}
    >
      <div class="drop-overlay">
        <p>Drop here to add to quick scripts</p>
      </div>
      <ScriptList
        pageType="QUICK_SWITCH"
        title="Quick Pac Scripts"
        onScriptEdit={() => {}}
      />
      <p class="small-description">
        Please drag an existing PAC script from below here to enable quick
        switch.
      </p>
      <p class="small-description">
        To remove a script please drag and drop it to the list below this
        section.
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
    ondragleave={handleDragLeave}
    ondrop={handleDrop('OPTIONS')}
    ondragover={handleDragOver}
  >
    <div class="drop-overlay">
      <p>Drop here to remove from quick scripts</p>
    </div>
    <div class="script-list" role="list">
      <ScriptList
        pageType="OPTIONS"
        onScriptEdit={(scriptId) => openEditor(scriptId)}
      />
    </div>
  </div>

  {#if showEditor}
    <ScriptEditor
      script={editingScriptId
        ? settings.pacScripts.find((s) => s.id === editingScriptId)
        : undefined}
      onSave={handleScriptSave}
      onCancel={() => (showEditor = false)}
    />
  {/if}
</div>
