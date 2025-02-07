<script lang="ts">
  import { onMount } from 'svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import {
    ERROR_TYPES,
    type ListViewType,
    type ProxyConfig,
  } from '@/interfaces'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import { NotifyService } from '@/services/NotifyService'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import ProxyConfigModal from '@/components/ProxyConfig/ProxyConfigModal.svelte'

  // State management using Svelte 5's $state
  let showEditor = $state(false)
  let editingScriptId = $state<string | null>(null)
  let dropError = $state<string | null>(null)
  let settings = $derived($settingsStore)

  onMount(() => {
    settingsStore.init()
  })

  async function handleQuickSwitchToggle(checked: boolean) {
    await settingsStore.quickSwitchToggle(checked)
  }

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }
  // @ts-ignore
  async function handleScriptSave(script: Omit<ProxyConfig, 'id'>) {
    await settingsStore.updatePACScript(script, editingScriptId)
    showEditor = false
  }

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
  class="container mx-auto max-w-7xl px-4 py-8"
  role="region"
  aria-dropeffect="move"
  data-page-type
>
  <!-- Header Section -->
  <header class="mb-8 flex items-center justify-between gap-4">
    <h1 class="text-2xl font-bold text-primary">PACify | The Proxy Manager</h1>
    <FlexGroup
      direction="horizontal"
      childrenGap="sm"
      alignItems="center"
      justifyContent="between"
    >
      <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
      <Button color="primary" on:click={() => openEditor()}
        >Add New Script</Button
      >
    </FlexGroup>
  </header>

  <!-- Settings Section -->
  <section class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <label class="text-lg font-medium" for="quickSwitchToggle">
        Quick Switch Mode
      </label>
      <ToggleSwitch
        checked={settings.quickSwitchEnabled}
        onchange={handleQuickSwitchToggle}
      />
    </div>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      When enabled, clicking the extension icon will cycle through quick-switch
      enabled scripts.
    </p>

    <!-- Quick Scripts Dropzone -->
    <div
      class="quick-scripts-section relative mt-6 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors dark:border-gray-600"
      role="list"
      aria-dropeffect="move"
      ondragleave={handleDragLeave}
      ondrop={handleDrop('QUICK_SWITCH')}
      ondragover={handleDragOver}
    >
      <div
        data-overlay
        class="drop-overlay absolute inset-0 hidden items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-800/80 pointer-events-none"
        class:flex={document
          .getElementById('options-container')
          ?.getAttribute('data-page-type') === 'OPTIONS'}
      >
        <p class="text-lg font-medium">Drop here to add to quick scripts</p>
      </div>

      <ScriptList
        pageType="QUICK_SWITCH"
        title="Quick Pac Scripts"
        onScriptEdit={() => {}}
      />
    </div>
  </section>

  <!-- Error Message -->
  {#if dropError}
    <div
      class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200"
    >
      <p>{dropError}</p>
    </div>
  {/if}

  <!-- All Scripts Dropzone -->
  <div
    class="all-scripts-section relative rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors dark:border-gray-600"
    role="region"
    aria-dropeffect="move"
    ondragleave={handleDragLeave}
    ondrop={handleDrop('OPTIONS')}
    ondragover={handleDragOver}
  >
    <div
      data-overlay
      class="drop-overlay absolute inset-0 hidden items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-800/80 pointer-events-none"
      class:flex={document
        .getElementById('options-container')
        ?.getAttribute('data-page-type') === 'QUICK_SWITCH'}
    >
      <p class="text-lg font-medium text-red-600 dark:text-red-400">
        Drop here to remove from quick scripts
      </p>
    </div>

    <div role="list">
      <ScriptList
        pageType="OPTIONS"
        onScriptEdit={(scriptId) => openEditor(scriptId)}
      />
    </div>
  </div>

  <!-- Script Editor Modal -->
  {#if showEditor}
    <ProxyConfigModal
      proxyConfig={editingScriptId
        ? settings.proxyConfigs.find((s) => s.id === editingScriptId)
        : undefined}
      onSave={handleScriptSave}
      onCancel={() => (showEditor = false)}
    />
  {/if}
</div>
