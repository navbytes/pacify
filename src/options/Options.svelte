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
  import { Cable, Settings } from 'lucide-svelte'

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

<div id="options-container" class="container mx-auto max-w-7xl px-4" role="region">
  <!-- Integrated Header with Tabs -->
  <Tabs bind:activeTab variant="buttons">
    <header class="mb-8 -mx-4">
      <!-- Single Row: Branding, Tab Navigation, and Status -->
      <div
        class="flex items-center justify-between px-6 py-5 gap-6 border-b border-slate-100 dark:border-slate-800"
      >
        <!-- Left: App Branding -->
        <div class="flex items-center gap-4 flex-shrink-0 min-w-0">
          <img src="/icons/icon48.png" alt="PACify" class="w-12 h-12 flex-shrink-0" />
          <div class="min-w-0">
            <h1
              class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              data-testid="page-title"
            >
              PACify
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Proxy Manager</p>
          </div>
        </div>

        <!-- Right: Tab Navigation + Status -->
        <div class="flex items-center gap-4 flex-shrink-0">
          <!-- Status Indicator (if active) -->
          {#if settings.proxyConfigs.find((p) => p.isActive)}
            <div
              class="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex-shrink-0 shadow-sm"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              ACTIVE
            </div>
          {/if}

          <TabList>
            <Tab id="proxy-configs" icon={Cable}>
              {I18nService.getMessage('tabProxyConfigs')}
            </Tab>
            <Tab id="settings" icon={Settings}>
              {I18nService.getMessage('tabSettings')}
            </Tab>
          </TabList>
        </div>
      </div>
    </header>

    <!-- Tab 1: Proxy Configs -->
    <TabPanel id="proxy-configs">
      <ProxyConfigsTab onOpenEditor={openEditor} />
    </TabPanel>

    <!-- Tab 2: Settings -->
    <TabPanel id="settings">
      <SettingsTab />
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
