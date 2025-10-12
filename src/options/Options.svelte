<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type ProxyConfig } from '@/interfaces'
  import ProxyConfigModal from '@/components/ProxyConfig/ProxyConfigModal.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Tabs from '@/components/Tabs/Tabs.svelte'
  import TabList from '@/components/Tabs/TabList.svelte'
  import Tab from '@/components/Tabs/Tab.svelte'
  import TabPanel from '@/components/Tabs/TabPanel.svelte'
  import Toast from '@/components/Toast.svelte'
  import ProxyConfigsTab from './ProxyConfigsTab.svelte'
  import SettingsTab from './SettingsTab.svelte'
  import AboutTab from './AboutTab.svelte'
  import { Cable, Settings, Info } from 'lucide-svelte'

  let showEditor = $state(false)
  let editingScriptId = $state<string | null>(null)
  let settings = $derived($settingsStore)
  let activeTab = $state('proxy-configs')

  onMount(() => {
    const init = async () => {
      await settingsStore.init()

      // Load saved active tab
      const saved = await chrome.storage.local.get('options.activeTab')
      if (saved['options.activeTab']) {
        activeTab = saved['options.activeTab']
      }
    }

    init()

    // Keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to add new proxy (only on Proxy Configs tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && activeTab === 'proxy-configs') {
        e.preventDefault()
        openEditor()
      }
      // Escape to close modal
      if (e.key === 'Escape' && showEditor) {
        e.preventDefault()
        showEditor = false
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  // Save active tab when it changes
  $effect(() => {
    if (activeTab) {
      chrome.storage.local.set({ 'options.activeTab': activeTab })
    }
  })

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }

  async function handleScriptSave(script: Omit<ProxyConfig, 'id'>) {
    console.log('handleScriptSave called with:', script)
    console.log('showEditor before save:', showEditor)

    // Close modal immediately
    showEditor = false
    console.log('Modal closed immediately')

    // Save in background
    settingsStore
      .updatePACScript(script, editingScriptId)
      .then((result) => {
        console.log('updatePACScript result:', result)

        // Show success toast
        toastStore.show(
          editingScriptId
            ? I18nService.getMessage('proxyUpdated').replace('$1', script.name)
            : I18nService.getMessage('proxyCreated').replace('$1', script.name),
          'success'
        )
      })
      .catch((error) => {
        console.error('Error in handleScriptSave:', error)
        // Show error toast
        toastStore.show(I18nService.getMessage('failedToSaveProxy'), 'error')
      })
  }
</script>

<div id="options-container" class="container mx-auto max-w-7xl px-4 py-8" role="region">
  <!-- Header Section -->
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-primary" data-testid="page-title">
      {I18nService.getMessage('extName')}
    </h1>
  </header>

  <!-- Tabs Container -->
  <Tabs bind:activeTab variant="underline">
    <TabList>
      <Tab id="proxy-configs" icon={Cable}>
        {I18nService.getMessage('tabProxyConfigs')}
      </Tab>
      <Tab id="settings" icon={Settings}>
        {I18nService.getMessage('tabSettings')}
      </Tab>
      <Tab id="about" icon={Info}>
        {I18nService.getMessage('tabAbout')}
      </Tab>
    </TabList>

    <!-- Tab 1: Proxy Configs -->
    <TabPanel id="proxy-configs">
      <ProxyConfigsTab onOpenEditor={openEditor} />
    </TabPanel>

    <!-- Tab 2: Settings -->
    <TabPanel id="settings">
      <SettingsTab />
    </TabPanel>

    <!-- Tab 3: About -->
    <TabPanel id="about">
      <AboutTab />
    </TabPanel>
  </Tabs>

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

  <!-- Toast Notifications -->
  <Toast />
</div>
