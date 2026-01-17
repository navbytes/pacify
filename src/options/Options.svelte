<script lang="ts">
import type { Component } from 'svelte'
import { onMount } from 'svelte'
import Tab from '@/components/Tabs/Tab.svelte'
import TabList from '@/components/Tabs/TabList.svelte'
import TabPanel from '@/components/Tabs/TabPanel.svelte'
import Tabs from '@/components/Tabs/Tabs.svelte'
import ThemeToggle from '@/components/ThemeToggle.svelte'
import Toast from '@/components/Toast.svelte'
import type { ProxyConfig } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { Cable, Settings } from '@/utils/icons'
import { isAutoProxy } from '@/utils/proxyModeHelpers'
import ProxyConfigsTab from './ProxyConfigsTab.svelte'
import SettingsTab from './SettingsTab.svelte'

let showEditor = $state(false)
let showAutoProxyEditor = $state(false)
let editingScriptId = $state<string | null>(null)
let settings = $derived($settingsStore)
let activeTab = $state('proxy-configs')

// Dynamic import for ProxyConfigModal - only load when needed
// biome-ignore lint/suspicious/noExplicitAny: Dynamic Svelte component types need any for flexibility
let ProxyConfigModal = $state<Component<any> | null>(null)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic Svelte component types need any for flexibility
let AutoProxyModal = $state<Component<any> | null>(null)
let isLoadingModal = $state(false)
let isLoadingAutoProxyModal = $state(false)

onMount(() => {
  const init = async () => {
    await settingsStore.init()

    // Load saved active tab
    const saved = await chrome.storage.local.get('options.activeTab')
    if (saved['options.activeTab'] && typeof saved['options.activeTab'] === 'string') {
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

async function openAutoProxyEditor(scriptId?: string) {
  editingScriptId = scriptId || null
  showAutoProxyEditor = true

  // Lazy load the AutoProxyModal component if not already loaded
  if (!AutoProxyModal && !isLoadingAutoProxyModal) {
    isLoadingAutoProxyModal = true
    try {
      const module = await import('@/components/AutoProxy/AutoProxyModal.svelte')
      AutoProxyModal = module.default
    } catch (error) {
      logger.error('Failed to load AutoProxyModal:', error)
      toastStore.show('Failed to load Auto-Proxy editor', 'error')
      showAutoProxyEditor = false
    } finally {
      isLoadingAutoProxyModal = false
    }
  }
}

function handleOpenEditor(scriptId?: string) {
  // Check if this is an Auto-Proxy config
  if (scriptId) {
    const config = settings.proxyConfigs.find((p) => p.id === scriptId)
    if (config && isAutoProxy(config)) {
      openAutoProxyEditor(scriptId)
      return
    }
  }
  openEditor(scriptId)
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

async function handleAutoProxySave(config: Omit<ProxyConfig, 'id'>) {
  // Close modal immediately
  showAutoProxyEditor = false

  // Save in background
  settingsStore
    .updatePACScript(config, editingScriptId)
    .then(() => {
      // Show success toast
      const messageKey = editingScriptId ? 'autoProxyUpdated' : 'autoProxyCreated'
      const message =
        I18nService.getMessage(messageKey)?.replace('$1', config.name) ||
        (editingScriptId
          ? `Auto-Proxy '${config.name}' updated`
          : `Auto-Proxy '${config.name}' created`)
      toastStore.show(message, 'success')
    })
    .catch((error) => {
      logger.error('Error in handleAutoProxySave:', error)
      // Show error toast
      toastStore.show(I18nService.getMessage('failedToSaveProxy'), 'error')
    })
}
</script>

<div id="options-container" class="container mx-auto max-w-7xl px-4" role="region">
  <!-- Integrated Header with Tabs -->
  <Tabs bind:activeTab variant="buttons">
    <header class="-mx-6">
      <!-- Gradient background header -->
      <div class="relative overflow-hidden">
        <!-- Single Row: Branding, Tab Navigation, and Status -->
        <div class="relative flex items-center justify-between px-6 py-6 gap-6">
          <!-- Left: App Branding -->
          <div class="flex items-center gap-4 shrink-0 min-w-0">
            <!-- Logo with glow effect -->
            <div class="relative">
              <div
                class="absolute inset-0 bg-linear-to-br from-blue-400 to-purple-500 rounded-xl blur-lg opacity-30"
              ></div>
              <div
                class="relative p-2 rounded-xl bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg border border-white/50 dark:border-slate-700/50"
              >
                <img src="/icons/icon48.png" alt="PACify" class="w-10 h-10 shrink-0">
              </div>
            </div>
            <div class="min-w-0">
              <h1
                class="text-2xl font-bold bg-linear-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent tracking-tight"
                data-testid="page-title"
              >
                PACify
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Proxy Manager
              </p>
            </div>
          </div>

          <!-- Right: Tab Navigation + Status -->
          <div class="flex items-center gap-4 shrink-0">
            <!-- Status Indicator (if active) -->
            {#if settings.proxyConfigs.find((p) => p.isActive)}
              <div
                class="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold shrink-0 border border-green-200 dark:border-green-800 shadow-sm"
              >
                <span class="relative flex h-2.5 w-2.5">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Active
              </div>
            {/if}

            <!-- Theme Toggle -->
            <ThemeToggle />

            <TabList>
              <Tab id="proxy-configs" icon={Cable}>{I18nService.getMessage('tabProxyConfigs')}</Tab>
              <Tab id="settings" icon={Settings}>{I18nService.getMessage('tabSettings')}</Tab>
            </TabList>
          </div>
        </div>
      </div>
    </header>

    <!-- Tab 1: Proxy Configs -->
    <TabPanel id="proxy-configs">
      <ProxyConfigsTab
        onOpenEditor={handleOpenEditor}
        onOpenAutoProxyEditor={() => openAutoProxyEditor()}
      />
    </TabPanel>

    <!-- Tab 2: Settings -->
    <TabPanel id="settings">
      <SettingsTab />
    </TabPanel>
  </Tabs>

  <!-- Script Editor Modal (Lazy Loaded) -->
  {#if showEditor}
    {#if ProxyConfigModal}
      <ProxyConfigModal
        proxyConfig={editingScriptId
          ? settings.proxyConfigs.find((s) => s.id === editingScriptId)
          : undefined}
        onSave={handleScriptSave}
        onCancel={() => (showEditor = false)}
      />
    {:else if isLoadingModal}
      <!-- Loading placeholder with gradient -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-slate-900/80 via-blue-900/40 to-slate-900/80 backdrop-blur-md"
        ></div>
        <div
          class="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50"
        >
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                class="absolute inset-0 bg-linear-to-br from-blue-400 to-purple-500 rounded-xl blur-lg opacity-40 animate-pulse"
              ></div>
              <div class="relative p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-600">
                <svg class="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
            <p class="text-lg font-medium text-slate-800 dark:text-slate-100">Loading editor...</p>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Auto-Proxy Editor Modal (Lazy Loaded) -->
  {#if showAutoProxyEditor}
    {#if AutoProxyModal}
      <AutoProxyModal
        proxyConfig={editingScriptId
          ? settings.proxyConfigs.find((s) => s.id === editingScriptId)
          : undefined}
        availableProxies={settings.proxyConfigs}
        onSave={handleAutoProxySave}
        onCancel={() => (showAutoProxyEditor = false)}
      />
    {:else if isLoadingAutoProxyModal}
      <!-- Loading placeholder with gradient -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-slate-900/80 via-orange-900/40 to-slate-900/80 backdrop-blur-md"
        ></div>
        <div
          class="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50"
        >
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                class="absolute inset-0 bg-linear-to-br from-orange-400 to-amber-500 rounded-xl blur-lg opacity-40 animate-pulse"
              ></div>
              <div class="relative p-3 rounded-xl bg-linear-to-br from-orange-500 to-amber-600">
                <svg class="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
            <p class="text-lg font-medium text-slate-800 dark:text-slate-100">
              Loading Auto-Proxy editor...
            </p>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Toast Notifications -->
  <Toast />
</div>
