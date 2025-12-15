<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type ProxyConfig } from '@/interfaces'
  import type { ComponentType } from 'svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Tabs from '@/components/Tabs/Tabs.svelte'
  import TabList from '@/components/Tabs/TabList.svelte'
  import Tab from '@/components/Tabs/Tab.svelte'
  import TabPanel from '@/components/Tabs/TabPanel.svelte'
  import Toast from '@/components/Toast.svelte'
  import ThemeToggle from '@/components/ThemeToggle.svelte'
  import ProxyConfigsTab from './ProxyConfigsTab.svelte'
  import SettingsTab from './SettingsTab.svelte'
  import { Cable, Settings } from '@/utils/icons'
  import { logger } from '@/services/LoggerService'

  let showEditor = $state(false)
  let editingScriptId = $state<string | null>(null)
  let settings = $derived($settingsStore)
  let activeTab = $state('proxy-configs')

  // Dynamic import for ProxyConfigModal - only load when needed
  let ProxyConfigModal = $state<ComponentType | null>(null)
  let isLoadingModal = $state(false)

  onMount(() => {
    const init = async () => {
      await settingsStore.init()

      // Load saved active tab
      const saved = await chrome.storage.local.get('options.activeTab')
      if (saved['options.activeTab']) {
        activeTab = saved['options.activeTab']
      }

      // Check if we should auto-open the editor (from popup quick add)
      const params = new URLSearchParams(window.location.search)
      if (params.get('action') === 'create') {
        activeTab = 'proxy-configs' // Ensure we're on the right tab
        openEditor() // Auto-open the editor for new proxy
        // Clean up URL parameter
        window.history.replaceState({}, '', window.location.pathname)
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

  async function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true

    // Lazy load the modal component if not already loaded
    if (!ProxyConfigModal && !isLoadingModal) {
      isLoadingModal = true
      try {
        const module = await import('@/components/ProxyConfig/ProxyConfigModal.svelte')
        ProxyConfigModal = module.default
      } catch (error) {
        logger.error('Failed to load ProxyConfigModal:', error)
        toastStore.show('Failed to load editor', 'error')
        showEditor = false
      } finally {
        isLoadingModal = false
      }
    }
  }

  async function handleScriptSave(script: Omit<ProxyConfig, 'id'>) {
    // Close modal immediately
    showEditor = false

    // Save in background
    settingsStore
      .updatePACScript(script, editingScriptId)
      .then(() => {
        // Show success toast
        toastStore.show(
          editingScriptId
            ? I18nService.getMessage('proxyUpdated').replace('$1', script.name)
            : I18nService.getMessage('proxyCreated').replace('$1', script.name),
          'success'
        )
      })
      .catch((error) => {
        logger.error('Error in handleScriptSave:', error)
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
              Active
            </div>
          {/if}

          <!-- Theme Toggle -->
          <ThemeToggle />

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

  <!-- Script Editor Modal (Lazy Loaded) -->
  {#if showEditor}
    {#if ProxyConfigModal}
      <svelte:component
        this={ProxyConfigModal}
        proxyConfig={editingScriptId
          ? settings.proxyConfigs.find((s) => s.id === editingScriptId)
          : undefined}
        onSave={handleScriptSave}
        onCancel={() => (showEditor = false)}
      />
    {:else if isLoadingModal}
      <!-- Loading placeholder -->
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl">
          <p class="text-slate-900 dark:text-slate-100">Loading editor...</p>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Toast Notifications -->
  <Toast />
</div>
