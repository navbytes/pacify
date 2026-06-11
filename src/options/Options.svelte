<script lang="ts">
import type { Component } from 'svelte'
import { onMount } from 'svelte'
import LoadingSpinner from '@/components/common/LoadingSpinner.svelte'
import ImportModal from '@/components/ImportModal.svelte'
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.svelte'
import OnboardingModal from '@/components/Onboarding/OnboardingModal.svelte'
import Tab from '@/components/Tabs/Tab.svelte'
import TabList from '@/components/Tabs/TabList.svelte'
import TabPanel from '@/components/Tabs/TabPanel.svelte'
import Tabs from '@/components/Tabs/Tabs.svelte'
import Text from '@/components/Text.svelte'
import ThemeToggle from '@/components/ThemeToggle.svelte'
import Toast from '@/components/Toast.svelte'
import type { ProxyConfig } from '@/interfaces'
import { diagnosticsService } from '@/services/DiagnosticsService'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import {
  hasAuthPermissions,
  proxyConfigHasCredentials,
  requestAuthPermissions,
} from '@/utils/authPermissions'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Activity, Cable, Keyboard, Settings } from '@/utils/icons'
import { isAutoProxy } from '@/utils/proxyModeHelpers'
import DiagnosticsTab from './DiagnosticsTab.svelte'
import ProxyConfigsTab from './ProxyConfigsTab.svelte'
import SettingsTab from './SettingsTab.svelte'

let showEditor = $state(false)
let showAutoProxyEditor = $state(false)
let showOnboarding = $state(false)
let showKeyboardShortcuts = $state(false)
let showImport = $state(false)
let editingScriptId = $state<string | null>(null)
let settings = $derived($settingsStore)
let activeTab = $state('proxy-configs')
let unreadDiagnosticCount = $state(0)

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

    // Load unread diagnostic count
    unreadDiagnosticCount = await diagnosticsService.getUnreadCount()

    // Load saved active tab
    const saved = await chrome.storage.local.get('options.activeTab')
    if (saved['options.activeTab'] && typeof saved['options.activeTab'] === 'string') {
      activeTab = saved['options.activeTab']
    }

    // Check if we should show onboarding (first run)
    const onboardingData = await chrome.storage.local.get('pacify.showOnboarding')
    if (onboardingData['pacify.showOnboarding'] === true) {
      showOnboarding = true
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
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    const isInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    // Ctrl+N or Cmd+N to add new proxy (only on Proxy Configs tab)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && activeTab === 'proxy-configs') {
      e.preventDefault()
      openEditor()
    }

    // ? to show keyboard shortcuts (not in inputs)
    if (e.key === '?' && !isInput && !showEditor && !showAutoProxyEditor && !showOnboarding) {
      e.preventDefault()
      showKeyboardShortcuts = true
    }

    // Escape closes the keyboard-shortcuts overlay here. The editor modals
    // (ProxyConfig / AutoProxy) handle their own Escape so their exit
    // animation plays; handling them here too would unmount them instantly.
    if (e.key === 'Escape' && showKeyboardShortcuts) {
      e.preventDefault()
      showKeyboardShortcuts = false
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

// Refresh unread diagnostic count when switching to diagnostics tab
$effect(() => {
  if (activeTab === 'diagnostics') {
    diagnosticsService
      .getUnreadCount()
      .then((count) => {
        unreadDiagnosticCount = count
      })
      .catch((error) => {
        logger.error('Failed to get unread diagnostic count:', error)
      })
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

/**
 * After saving a proxy config that contains credentials, ask for the optional
 * webRequest + webRequestAuthProvider permissions if not already granted.
 * Must run after the modal closes (user-gesture context is still valid within
 * the same event-loop turn as the save button click).
 */
async function maybeRequestAuthPermissions(config: Omit<ProxyConfig, 'id'>): Promise<void> {
  if (!proxyConfigHasCredentials(config)) return
  if (await hasAuthPermissions()) return
  const granted = await requestAuthPermissions()
  if (!granted) {
    toastStore.show(
      'Credentials saved. Grant the network permission to auto-supply them — otherwise Chrome will prompt you.',
      'info'
    )
  }
}

async function handleScriptSave(script: Omit<ProxyConfig, 'id'>, activate: boolean) {
  // Capture before the modal resets it (editingScriptId is module state).
  const savedScriptId = editingScriptId
  // Close modal immediately (keeps user-gesture context for the permission request below)
  showEditor = false

  // Request optional auth permissions if this config has credentials. Runs in
  // the click's user-gesture turn. Whether granted or denied, "Save & Turn On"
  // still activates below (the proxy works; Chrome falls back to its own auth
  // dialog) — so the verb's promise is always kept.
  await maybeRequestAuthPermissions(script)

  // Save in background
  settingsStore
    .updatePACScript(script, savedScriptId)
    .then(async (updated) => {
      // chrome.i18n strips `$1` when no substitution is supplied, so pass the
      // name as a substitution argument (not a post-hoc .replace).
      if (activate) {
        // Resolve the id (existing on edit; freshly generated on create) and
        // turn the proxy on — the single activation path (item 11).
        const id =
          savedScriptId ?? updated?.proxyConfigs.find((c) => c.name === script.name)?.id ?? null
        if (id) await settingsStore.setProxy(id, true)
        toastStore.show(I18nService.getMessage('proxyActivated', script.name), 'success')
      } else {
        toastStore.show(
          I18nService.getMessage(savedScriptId ? 'proxyUpdated' : 'proxyCreated', script.name),
          'success'
        )
      }
    })
    .catch((error) => {
      logger.error('Error in handleScriptSave:', error)
      toastStore.show(I18nService.getMessage('failedToSaveProxy'), 'error')
    })
}

async function handleAutoProxySave(config: Omit<ProxyConfig, 'id'>) {
  // Close modal immediately (keeps user-gesture context for the permission request below)
  showAutoProxyEditor = false

  // Request optional auth permissions if this config has credentials
  await maybeRequestAuthPermissions(config)

  // Save in background
  settingsStore
    .updatePACScript(config, editingScriptId)
    .then(() => {
      const messageKey = editingScriptId ? 'autoProxyUpdated' : 'autoProxyCreated'
      toastStore.show(I18nService.getMessage(messageKey, config.name), 'success')
    })
    .catch((error) => {
      logger.error('Error in handleAutoProxySave:', error)
      toastStore.show(I18nService.getMessage('failedToSaveProxy'), 'error')
    })
}

async function handleOnboardingComplete() {
  // Mark onboarding as complete
  await chrome.storage.local.set({ 'pacify.showOnboarding': false })
  showOnboarding = false
}

function handleOnboardingCreateProxy() {
  // Open the proxy editor after onboarding
  openEditor()
}

function openImport() {
  activeTab = 'proxy-configs'
  showImport = true
}

async function handleImported() {
  await settingsStore.reloadSettings()
  activeTab = 'proxy-configs'
}
</script>

{#snippet loadingModal(label: string)}
  <div
    class={cn(modalVariants.overlay(), flexPatterns.center)}
    role="dialog"
    aria-modal="true"
    aria-label={label}
  >
    <div class={cn(modalVariants.content({ size: 'sm' }), 'mx-4')}>
      <div class="flex items-center gap-4 px-6 py-5">
        <LoadingSpinner size="md" />
        <Text size="lg" weight="medium">{label}</Text>
      </div>
    </div>
  </div>
{/snippet}

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
                class="relative p-2 rounded-xl bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg border border-white/50 dark:border-slate-700/50"
              >
                <img src="/icons/icon48.png" alt="PACify" class="w-10 h-10 shrink-0">
              </div>
            </div>
            <div class="min-w-0">
              <h1
                class="text-2xl font-bold bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight"
                data-testid="page-title"
              >
                PACify
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">
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

            <!-- Keyboard Shortcuts Button -->
            <button
              type="button"
              onclick={() => (showKeyboardShortcuts = true)}
              class="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={I18nService.getMessage('keyboardShortcuts') || 'Keyboard Shortcuts'}
              title={I18nService.getMessage('keyboardShortcuts') || 'Keyboard Shortcuts'}
            >
              <Keyboard size={20} />
            </button>

            <!-- Theme Toggle -->
            <ThemeToggle />

            <TabList>
              <Tab id="proxy-configs" icon={Cable}>{I18nService.getMessage('tabProxyConfigs')}</Tab>
              <Tab id="settings" icon={Settings}>{I18nService.getMessage('tabSettings')}</Tab>
              <Tab
                id="diagnostics"
                icon={Activity}
                badge={unreadDiagnosticCount > 0 ? unreadDiagnosticCount : undefined}
              >
                {I18nService.getMessage('tabDiagnostics') || 'Diagnostics'}
              </Tab>
            </TabList>
          </div>
        </div>
      </div>
    </header>

    <!-- Tab 1: Proxy Configs -->
    <TabPanel id="proxy-configs">
      <ProxyConfigsTab onOpenEditor={handleOpenEditor} onOpenImport={openImport} />
    </TabPanel>

    <!-- Tab 2: Settings -->
    <TabPanel id="settings">
      <SettingsTab bind:activeTab />
    </TabPanel>

    <!-- Tab 3: Diagnostics -->
    <TabPanel id="diagnostics">
      <DiagnosticsTab />
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
        onSwitchToRouting={() => {
          // Hand off "Route by site" to the rule-based routing editor (item 10).
          showEditor = false
          openAutoProxyEditor()
        }}
      />
    {:else if isLoadingModal}
      {@render loadingModal(I18nService.getMessage('loadingEditor'))}
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
      {@render loadingModal(I18nService.getMessage('loadingAutoProxyEditor'))}
    {/if}
  {/if}

  <!-- Onboarding Modal -->
  <OnboardingModal
    bind:open={showOnboarding}
    onComplete={handleOnboardingComplete}
    onCreateProxy={handleOnboardingCreateProxy}
    onImport={openImport}
  />

  <!-- Import Modal (onboarding / empty-state entry point) -->
  {#if showImport}
    <ImportModal onClose={() => (showImport = false)} onImported={handleImported} />
  {/if}

  <!-- Keyboard Shortcuts Modal -->
  <KeyboardShortcutsModal
    bind:open={showKeyboardShortcuts}
    onClose={() => (showKeyboardShortcuts = false)}
  />

  <!-- Toast Notifications -->
  <Toast />
</div>
