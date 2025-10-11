<script lang="ts">
  import { onMount } from 'svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type DropItem, type ProxyConfig } from '@/interfaces'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import ProxyConfigModal from '@/components/ProxyConfig/ProxyConfigModal.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DropTarget from '@/components/DragDrop/DropTarget.svelte'
  import { StorageService } from '@/services/StorageService'
  import Tabs from '@/components/Tabs/Tabs.svelte'
  import TabList from '@/components/Tabs/TabList.svelte'
  import Tab from '@/components/Tabs/Tab.svelte'
  import TabPanel from '@/components/Tabs/TabPanel.svelte'
  import Toast from '@/components/Toast.svelte'
  import EmptyState from '@/components/EmptyState.svelte'
  import ConfirmDialog from '@/components/ConfirmDialog.svelte'
  import ProgressBar from '@/components/ProgressBar.svelte'
  import StatsCard from '@/components/StatsCard.svelte'
  import Text from '@/components/Text.svelte'
  import {
    Cable,
    Settings,
    Info,
    Zap,
    Shield,
    Database,
    Download,
    Upload,
    Github,
    Bug,
    BookOpen,
    ExternalLink,
    Activity,
    Clock,
  } from 'lucide-svelte'

  const showStorage = true
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
  let activeTab = $state('proxy-configs')

  // Derived stats for dashboard
  let totalProxies = $derived(settings.proxyConfigs.length)
  let quickSwitchProxies = $derived(
    settings.proxyConfigs.filter((p: ProxyConfig) => p.quickSwitch).length
  )
  let activeProxy = $derived(settings.proxyConfigs.find((p: ProxyConfig) => p.isActive))
  let lastUsedProxy = $derived(
    settings.proxyConfigs.find((p: ProxyConfig) => p.id === settings.activeScriptId) || activeProxy
  )

  onMount(async () => {
    await settingsStore.init()
    refreshStorageStats()

    // Load saved active tab
    const saved = await chrome.storage.local.get('options.activeTab')
    if (saved['options.activeTab']) {
      activeTab = saved['options.activeTab']
    }
  })

  // Save active tab when it changes
  $effect(() => {
    if (activeTab) {
      chrome.storage.local.set({ 'options.activeTab': activeTab })
    }
  })

  async function refreshStorageStats() {
    if (showStorage) {
      storageStats = await StorageService.getStorageStats()
    }
  }

  async function handleQuickSwitchToggle(checked: boolean) {
    await settingsStore.quickSwitchToggle(checked)
    toastStore.show(
      checked
        ? I18nService.getMessage('quickSwitchEnabled') || 'Quick Switch Mode enabled'
        : I18nService.getMessage('quickSwitchDisabled') || 'Quick Switch Mode disabled',
      'success'
    )
  }

  async function handleDisableProxyOnStartupToggle(checked: boolean) {
    await settingsStore.updateSettings({ disableProxyOnStartup: checked })
    toastStore.show(
      checked
        ? 'Proxy will be disabled on browser startup'
        : 'Proxy state will persist on browser startup',
      'success'
    )
  }

  function openEditor(scriptId?: string) {
    editingScriptId = scriptId || null
    showEditor = true
  }

  async function handleScriptSave(script: Omit<ProxyConfig, 'id'>) {
    await settingsStore.updatePACScript(script, editingScriptId)
    showEditor = false

    // Show success toast
    toastStore.show(
      editingScriptId
        ? `Proxy "${script.name}" updated successfully`
        : `Proxy "${script.name}" created successfully`,
      'success'
    )

    // Refresh storage stats after saving
    refreshStorageStats()
  }

  async function handleDrop(item: DropItem, pageType: 'QUICK_SWITCH' | 'OPTIONS') {
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

<div id="options-container" class="container mx-auto max-w-7xl px-4 py-8" role="region">
  <!-- Header Section -->
  <header class="mb-6">
    <FlexGroup alignItems="center" justifyContent="between" childrenGap="md">
      <h1 class="text-2xl font-bold text-primary" data-testid="page-title">
        {I18nService.getMessage('extName')}
      </h1>
      {#if activeTab === 'proxy-configs'}
        <Button data-testid="add-new-script-btn" color="primary" onclick={() => openEditor()}
          >{I18nService.getMessage('addNewScript')}</Button
        >
      {/if}
    </FlexGroup>
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
      <div class="py-6 space-y-8">
        <!-- Quick Switch Mode Toggle Card -->
        <section class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <div class="flex-1">
              <Text as="label" weight="semibold" id="quickSwitchToggle">
                {I18nService.getMessage('quickSwitchMode')}
              </Text>
              <Text as="p" size="sm" color="muted" classes="mt-1">
                {I18nService.getMessage('quickSwitchDescription')}
              </Text>
              {#if settings.quickSwitchEnabled}
                <Text
                  as="p"
                  size="xs"
                  weight="medium"
                  classes="mt-2 text-blue-600 dark:text-blue-400"
                >
                  ✓ Enabled – Click the extension icon to switch quickly
                </Text>
              {/if}
            </div>
            <ToggleSwitch
              id="quickSwitchToggle"
              checked={settings.quickSwitchEnabled}
              onchange={handleQuickSwitchToggle}
              aria-label="Toggle quick switch mode"
            />
          </FlexGroup>
        </section>

        <!-- Quick Switch Configs Section -->
        <div>
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick Switch Configs
            </h3>
            <Text as="p" size="sm" color="muted" classes="mt-1">
              Drag proxies here for fast toggling from the extension popup
            </Text>
          </div>

          <DropTarget onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}>
            <section
              data-drag-type={dragType}
              data-page-type="QUICK_SWITCH"
              class="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 transition-colors hover:border-blue-400 dark:hover:border-blue-600"
            >
              <!-- Quick Scripts Dropzone -->
              <div class="relative rounded-lg transition-colors">
                <div
                  class="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/80 z-10"
                  data-overlay
                >
                  <Text as="p" size="xl" weight="medium" classes="text-blue-700 dark:text-blue-300">
                    {I18nService.getMessage('dropToAddQuickScripts')}
                  </Text>
                </div>

                <ScriptList pageType="QUICK_SWITCH" title="" bind:dragType />
              </div>
            </section>
          </DropTarget>
        </div>

        <!-- All Proxy Configs Section -->
        <div>
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              All Proxy Configs
            </h3>
            <Text as="p" size="sm" color="muted" classes="mt-1">
              Complete list of available proxy configurations
            </Text>
          </div>

          <DropTarget onDrop={(item) => handleDrop(item, 'OPTIONS')}>
            <section
              data-drag-type={dragType}
              data-page-type="OPTIONS"
              class="relative rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 border-2 border-transparent transition-colors"
            >
              <div
                class="absolute inset-0 flex items-center justify-center rounded-lg bg-red-100/90 dark:bg-red-900/90 z-10"
                data-overlay
              >
                <Text as="p" size="xl" weight="medium" classes="text-red-700 dark:text-red-300">
                  {I18nService.getMessage('dropToRemoveQuickScripts')}
                </Text>
              </div>

              <div role="list">
                <ScriptList
                  pageType="OPTIONS"
                  onScriptEdit={(scriptId) => openEditor(scriptId)}
                  bind:dragType
                  title=""
                />
              </div>
            </section>
          </DropTarget>
        </div>

        <!-- Error Message -->
        {#if dropError}
          <div
            class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200"
          >
            <Text as="p">{dropError}</Text>
          </div>
        {/if}
      </div>
    </TabPanel>

    <!-- Tab 2: Settings -->
    <TabPanel id="settings">
      <div class="py-6 space-y-8">
        <!-- Proxy Behavior Section (Primary) -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {I18nService.getMessage('settingsProxyBehavior')}
          </h2>

          <section
            class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 ring-2 ring-blue-500/10 dark:ring-blue-400/10"
          >
            <FlexGroup
              direction="horizontal"
              childrenGap="lg"
              alignItems="center"
              justifyContent="between"
            >
              <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
                <div class="flex-shrink-0 mt-1">
                  <div
                    class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  >
                    <Shield size={20} />
                  </div>
                </div>
                <div class="flex-1">
                  <label
                    class="text-base font-semibold cursor-pointer"
                    for="disableProxyOnStartupToggle"
                  >
                    {I18nService.getMessage('disableProxyOnStartup')}
                  </label>
                  <Text as="p" size="sm" color="muted" classes="mt-1">
                    {I18nService.getMessage('disableProxyOnStartupDescription')}
                  </Text>
                </div>
              </FlexGroup>
              <ToggleSwitch
                id="disableProxyOnStartupToggle"
                checked={settings.disableProxyOnStartup}
                onchange={handleDisableProxyOnStartupToggle}
                aria-label="Toggle disable proxy on startup"
              />
            </FlexGroup>
          </section>
        </div>

        <!-- Data Management Section -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {I18nService.getMessage('settingsDataManagement')}
          </h2>

          <section class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
          </section>
        </div>
      </div>
    </TabPanel>

    <!-- Tab 3: About -->
    <TabPanel id="about">
      <div class="py-6 space-y-6">
        <!-- Quick Stats Dashboard -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Stats</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Proxies" value={totalProxies} icon={Cable} color="blue" />
            <StatsCard title="Quick Switch" value={quickSwitchProxies} icon={Zap} color="purple" />
            <StatsCard
              title="Active Proxy"
              value={activeProxy?.name || 'None'}
              icon={Activity}
              color="green"
            />
            <StatsCard
              title="Last Used"
              value={lastUsedProxy?.name || 'None'}
              icon={Clock}
              color="orange"
            />
          </div>
        </div>

        <!-- Extension Info -->
        <section class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
          <FlexGroup
            alignItems="center"
            childrenGap="xs"
            classes="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4"
          >
            <Info size={20} />
            <h2>{I18nService.getMessage('aboutExtensionInfo')}</h2>
          </FlexGroup>
          <div class="space-y-3">
            <FlexGroup alignItems="baseline" childrenGap="xs">
              <Text size="sm" weight="medium" color="muted">Version:</Text>
              <Text size="2xl" weight="bold">1.9.1</Text>
            </FlexGroup>
            <Text as="p" size="sm" color="muted">
              Chrome Extension for managing PAC (Proxy Auto-Config) scripts
            </Text>
          </div>
        </section>

        <!-- Help & Resources -->
        <section class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {I18nService.getMessage('aboutHelpResources')}
          </h2>
          <div class="space-y-3">
            <a
              href="https://github.com/navbytes/pacify"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline transition-colors block"
            >
              <FlexGroup alignItems="center" childrenGap="xs">
                <Github size={20} />
                <Text>{I18nService.getMessage('aboutViewOnGithub')}</Text>
                <ExternalLink size={16} class="ml-auto" />
              </FlexGroup>
            </a>
            <a
              href="https://github.com/navbytes/pacify/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline transition-colors block"
            >
              <FlexGroup alignItems="center" childrenGap="xs">
                <Bug size={20} />
                <Text>{I18nService.getMessage('aboutReportIssue')}</Text>
                <ExternalLink size={16} class="ml-auto" />
              </FlexGroup>
            </a>
            <a
              href="https://github.com/navbytes/pacify#readme"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline transition-colors block"
            >
              <FlexGroup alignItems="center" childrenGap="xs">
                <BookOpen size={20} />
                <Text>{I18nService.getMessage('aboutDocumentation')}</Text>
                <ExternalLink size={16} class="ml-auto" />
              </FlexGroup>
            </a>
          </div>
        </section>

        <!-- Diagnostics -->
        {#if storageStats}
          <section class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {I18nService.getMessage('aboutDiagnostics')}
            </h2>
            <div class="space-y-6">
              <!-- Sync Storage -->
              <div class="space-y-2">
                <FlexGroup alignItems="center" justifyContent="between" classes="text-sm">
                  <Text weight="medium" classes="text-slate-700 dark:text-slate-300">
                    {I18nService.getMessage('syncStorage')}
                  </Text>
                  <Text color="muted">
                    {Math.round(storageStats.syncUsed / 1024)}KB / {Math.round(
                      storageStats.syncQuota / 1024
                    )}KB
                  </Text>
                </FlexGroup>
                <ProgressBar value={storageStats.syncUsed} max={storageStats.syncQuota} size="md" />
              </div>

              <!-- Local Storage -->
              <div class="space-y-2">
                <FlexGroup alignItems="center" justifyContent="between" classes="text-sm">
                  <Text weight="medium" classes="text-slate-700 dark:text-slate-300">
                    {I18nService.getMessage('localStorage')}
                  </Text>
                  <Text color="muted">
                    {Math.round(storageStats.localUsed / 1024)}KB / {Math.round(
                      storageStats.localQuota / 1024 / 1024
                    )}MB
                  </Text>
                </FlexGroup>
                <ProgressBar
                  value={storageStats.localUsed}
                  max={storageStats.localQuota}
                  size="md"
                />
              </div>
            </div>
          </section>
        {/if}
      </div>
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
