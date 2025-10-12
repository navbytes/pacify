<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { type ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'
  import { StorageService } from '@/services/StorageService'
  import StatsCard from '@/components/StatsCard.svelte'
  import AppHeader from '@/components/AppHeader.svelte'
  import LinkCard from '@/components/LinkCard.svelte'
  import StorageCard from '@/components/StorageCard.svelte'
  import {
    Zap,
    Bug,
    BookOpen,
    Activity,
    Clock,
    Lightbulb,
    Github,
    BarChart3,
    HelpCircle,
    Stethoscope,
    Cable,
  } from 'lucide-svelte'

  const showStorage = true

  let storageStats = $state<{
    syncUsed: number
    syncQuota: number
    localUsed: number
    localQuota: number
  } | null>(null)

  let settings = $derived($settingsStore)

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
    refreshStorageStats()
  })

  async function refreshStorageStats() {
    if (showStorage) {
      storageStats = await StorageService.getStorageStats()
    }
  }
</script>

<div class="py-6 space-y-8">
  <!-- Extension Info Header -->
  <AppHeader
    appName="PACify"
    version="1.20.0"
    description={I18nService.getMessage('extensionDescription')}
  />

  <!-- Quick Stats Dashboard -->
  <section>
    <div class="mb-6 pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
      <BarChart3 size={20} class="text-blue-600 dark:text-blue-400" />
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {I18nService.getMessage('quickStatsTitle')}
      </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title={I18nService.getMessage('totalProxies')}
        value={totalProxies}
        icon={Cable}
        color="blue"
        size="large"
        valueColor={totalProxies > 0 ? 'success' : 'muted'}
      />
      <StatsCard
        title={I18nService.getMessage('quickSwitch')}
        value={quickSwitchProxies}
        icon={Zap}
        color="purple"
        valueColor={quickSwitchProxies > 0 ? 'success' : 'muted'}
      />
      <StatsCard
        title={I18nService.getMessage('activeProxy')}
        value={activeProxy?.name || I18nService.getMessage('none')}
        icon={Activity}
        color="green"
        valueColor={activeProxy ? 'success' : 'muted'}
      />
      <StatsCard
        title={I18nService.getMessage('lastUsed')}
        value={lastUsedProxy?.name || I18nService.getMessage('none')}
        icon={Clock}
        color="orange"
        valueColor={lastUsedProxy ? 'default' : 'muted'}
      />
    </div>
  </section>

  <!-- Help & Resources -->
  <section>
    <div class="mb-6 pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
      <HelpCircle size={20} class="text-green-600 dark:text-green-400" />
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {I18nService.getMessage('aboutHelpResources')}
      </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <LinkCard
        href="https://github.com/navbytes/pacify"
        icon={Github}
        label={I18nService.getMessage('aboutViewOnGithub')}
        color="blue"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify/issues"
        icon={Bug}
        label={I18nService.getMessage('aboutReportIssue')}
        color="red"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify/issues/new?labels=enhancement&template=feature_request.md"
        icon={Lightbulb}
        label={I18nService.getMessage('aboutFeatureRequest')}
        color="yellow"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify#readme"
        icon={BookOpen}
        label={I18nService.getMessage('aboutDocumentation')}
        color="green"
      />
    </div>
  </section>

  <!-- Diagnostics -->
  {#if storageStats}
    <section>
      <div
        class="mb-6 pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2"
      >
        <Stethoscope size={20} class="text-purple-600 dark:text-purple-400" />
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {I18nService.getMessage('aboutDiagnostics')}
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StorageCard
          title={I18nService.getMessage('syncStorage')}
          icon={Activity}
          used={storageStats.syncUsed}
          quota={storageStats.syncQuota}
          usedLabel="{Math.round(storageStats.syncUsed / 1024)}KB"
          quotaLabel="{Math.round(storageStats.syncQuota / 1024)}KB"
          color="blue"
        />
        <StorageCard
          title={I18nService.getMessage('localStorage')}
          icon={Activity}
          used={storageStats.localUsed}
          quota={storageStats.localQuota}
          usedLabel="{Math.round(storageStats.localUsed / 1024)}KB"
          quotaLabel="{Math.round(storageStats.localQuota / 1024 / 1024)}MB"
          color="green"
        />
      </div>
    </section>
  {/if}
</div>
