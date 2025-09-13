<script lang="ts">
  import { onMount } from 'svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { type DropItem, type ProxyConfig } from '@/interfaces'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import ProxyConfigModal from '@/components/ProxyConfig/ProxyConfigModal.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DropTarget from '@/components/DragDrop/DropTarget.svelte'
  import { StorageService } from '@/services/StorageService'

  const showStorage = false
  let showEditor = $state(false)
  let editingScriptId = $state<string | null>(null)
  let dropError = $state<string | null>(null)
  let storageStats = $state<{
    syncUsed: number
    syncQuota: number
    localUsed: number
    localQuota: number
  } | null>(null)
  let settings = $derived($settingsStore)

  let dragType = $state<'QUICK_SWITCH' | 'OPTIONS' | ''>('')

  onMount(async () => {
    await settingsStore.init()
    refreshStorageStats()
  })

  async function refreshStorageStats() {
    if (showStorage) {
      storageStats = await StorageService.getStorageStats()
    }
  }

  async function handleQuickSwitchToggle(checked: boolean) {
    await settingsStore.quickSwitchToggle(checked)
  }

  async function handleDisableProxyOnStartupToggle(checked: boolean) {
    await settingsStore.updateSettings({ disableProxyOnStartup: checked })
  }

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }

  async function handleScriptSave(script: Omit<ProxyConfig, 'id'>) {
    await settingsStore.updatePACScript(script, editingScriptId)
    showEditor = false

    // Refresh storage stats after saving
    refreshStorageStats()
  }

  async function handleDrop(
    item: DropItem,
    pageType: 'QUICK_SWITCH' | 'OPTIONS'
  ) {
    // Handle the drop action
    const { dataType, dataId: scriptId } = item

    let isScriptQuickSwitch = null
    if (dataType === 'QUICK_SWITCH' && pageType === 'OPTIONS') {
      isScriptQuickSwitch = false
    } else if (dataType === 'OPTIONS' && pageType === 'QUICK_SWITCH') {
      isScriptQuickSwitch = true
    }

    if (isScriptQuickSwitch !== null) {
      await settingsStore.updateScriptQuickSwitch(scriptId, isScriptQuickSwitch)
    }
  }
</script>

<div
  id="options-container"
  class="container mx-auto max-w-7xl px-4 py-8"
  role="region"
>
  <!-- Header Section -->
  <header class="mb-8 flex items-center justify-between gap-4">
    <h1 class="text-2xl font-bold text-primary">
      {I18nService.getMessage('extName')}
    </h1>
    <FlexGroup
      direction="horizontal"
      childrenGap="sm"
      alignItems="center"
      justifyContent="between"
    >
      <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
      <Button color="primary" onclick={() => openEditor()}
        >{I18nService.getMessage('addNewScript')}</Button
      >
    </FlexGroup>
  </header>
  <section class="mb-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
    <FlexGroup
      direction="horizontal"
      childrenGap="lg"
      alignItems="center"
      justifyContent="between"
    >
      <label class="text-lg font-medium" for="quickSwitchToggle">
        {I18nService.getMessage('quickSwitchMode')}
      </label>
      <ToggleSwitch
        checked={settings.quickSwitchEnabled}
        onchange={handleQuickSwitchToggle}
      />
    </FlexGroup>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {I18nService.getMessage('quickSwitchDescription')}
    </p>
  </section>

  <section class="mb-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
    <FlexGroup
      direction="horizontal"
      childrenGap="lg"
      alignItems="center"
      justifyContent="between"
    >
      <label class="text-lg font-medium" for="disableProxyOnStartupToggle">
        {I18nService.getMessage('disableProxyOnStartup')}
      </label>
      <ToggleSwitch
        checked={settings.disableProxyOnStartup}
        onchange={handleDisableProxyOnStartupToggle}
      />
    </FlexGroup>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {I18nService.getMessage('disableProxyOnStartupDescription')}
    </p>
  </section>

  <DropTarget onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}>
    <section
      data-drag-type={dragType}
      data-page-type="QUICK_SWITCH"
      class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
    >
      <!-- Quick Scripts Dropzone -->
      <div class="relative rounded-lg transition-colors">
        <div
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-800/80 z-10"
          data-overlay
        >
          <p class="text-xl font-medium">
            {I18nService.getMessage('dropToAddQuickScripts')}
          </p>
        </div>

        <ScriptList
          pageType="QUICK_SWITCH"
          title={I18nService.getMessage('quickPacScripts')}
          bind:dragType
        />
      </div>
    </section>
  </DropTarget>
  <DropTarget onDrop={(item) => handleDrop(item, 'OPTIONS')}>
    <section
      data-drag-type={dragType}
      data-page-type="OPTIONS"
      class="relative mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
    >
      <div
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-800/80 z-10"
        data-overlay
      >
        <p class="text-xl font-medium text-red-600 dark:text-red-400">
          {I18nService.getMessage('dropToRemoveQuickScripts')}
        </p>
      </div>

      <div role="list">
        <ScriptList
          pageType="OPTIONS"
          onScriptEdit={(scriptId) => openEditor(scriptId)}
          bind:dragType
          title={I18nService.getMessage('allProxyConfigs')}
        />
      </div>
    </section>
  </DropTarget>

  <!-- Error Message -->
  {#if dropError}
    <div
      class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200"
    >
      <p>{dropError}</p>
    </div>
  {/if}

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

  <!-- Storage Stats -->
  {#if storageStats}
    <section
      class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 flex flex-row justify-around gap-2"
    >
      <p>
        {I18nService.getMessage('syncStorage')}: {Math.round(storageStats.syncUsed / 1024)}KB / {Math.round(
          storageStats.syncQuota / 1024
        )}KB
      </p>
      <p>
        {I18nService.getMessage('localStorage')}: {Math.round(storageStats.localUsed / 1024)}KB / {Math.round(
          storageStats.localQuota / 1024 / 1024
        )}MB
      </p>
    </section>
  {/if}
</div>
