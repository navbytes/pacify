<script lang="ts">
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { type ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'
  import { StorageService } from '@/services/StorageService'
  import StatsCard from '@/components/StatsCard.svelte'
  import Text from '@/components/Text.svelte'
  import Card from '@/components/Card.svelte'
  import ProgressBar from '@/components/ProgressBar.svelte'
  import {
    Cable,
    Zap,
    Bug,
    BookOpen,
    ExternalLink,
    Activity,
    Clock,
    Lightbulb,
    Github,
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

<div class="py-6 space-y-6">
  <!-- Quick Stats Dashboard -->
  <div>
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
      {I18nService.getMessage('quickStatsTitle')}
    </h2>
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
  </div>

  <!-- Extension Info -->
  <div>
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
      {I18nService.getMessage('aboutExtensionInfo')}
    </h2>
  </div>
  <Card>
    <div class="space-y-2">
      <div class="flex items-baseline gap-2">
        <Text size="sm" weight="medium" color="muted">{I18nService.getMessage('versionLabel')}</Text
        >
        <Text size="2xl" weight="bold">1.10.0</Text>
      </div>
      <Text as="p" size="sm" color="muted">
        {I18nService.getMessage('extensionDescription')}
      </Text>
    </div>
  </Card>

  <!-- Help & Resources -->
  <div>
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
      {I18nService.getMessage('aboutHelpResources')}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        ><a
          href="https://github.com/navbytes/pacify"
          target="_blank"
          rel="noopener noreferrer"
          class="flex p-2 gap-3"
        >
          <div class="flex flex-1 items-center gap-3">
            <Github size={20} class="text-blue-600 dark:text-blue-400" />
            <span>{I18nService.getMessage('aboutViewOnGithub')}</span>
          </div>
          <ExternalLink size={16} class="text-blue-600 dark:text-blue-400" />
        </a></Card
      >
      <Card
        ><a
          href="https://github.com/navbytes/pacify/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="flex p-2 gap-3"
        >
          <div class="flex flex-1 items-center gap-3">
            <Bug size={20} class="text-blue-600 dark:text-blue-400" />
            <span>{I18nService.getMessage('aboutReportIssue')}</span>
          </div>
          <ExternalLink size={16} class="text-blue-600 dark:text-blue-400" />
        </a></Card
      >
      <Card
        ><a
          href="https://github.com/navbytes/pacify/issues/new?labels=enhancement&template=feature_request.md"
          target="_blank"
          rel="noopener noreferrer"
          class="flex p-2 gap-3"
        >
          <div class="flex flex-1 items-center gap-3">
            <Lightbulb size={20} class="text-blue-600 dark:text-blue-400" />
            <span>{I18nService.getMessage('aboutFeatureRequest')}</span>
          </div>
          <ExternalLink size={16} class="text-blue-600 dark:text-blue-400" />
        </a></Card
      >
      <Card
        ><a
          href="https://github.com/navbytes/pacify#readme"
          target="_blank"
          rel="noopener noreferrer"
          class="flex p-2 gap-3"
        >
          <div class="flex flex-1 items-center gap-3">
            <BookOpen size={20} class="text-blue-600 dark:text-blue-400" />
            <span>{I18nService.getMessage('aboutDocumentation')}</span>
          </div>
          <ExternalLink size={16} class="text-blue-600 dark:text-blue-400" />
        </a></Card
      >
    </div>
  </div>

  <!-- Diagnostics -->
  {#if storageStats}
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
      {I18nService.getMessage('aboutDiagnostics')}
    </h2>
    <div class="grid grid-cols-2 gap-4">
      <Card>
        <!-- Sync Storage -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-300">
              {I18nService.getMessage('syncStorage')}
            </span>
            <span class="text-slate-500 dark:text-slate-400">
              {Math.round(storageStats.syncUsed / 1024)}KB / {Math.round(
                storageStats.syncQuota / 1024
              )}KB
            </span>
          </div>
          <ProgressBar
            value={storageStats.syncUsed}
            max={storageStats.syncQuota}
            size="md"
            showPercentage={false}
          />
        </div>
      </Card>
      <Card>
        <!-- Local Storage -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-300">
              {I18nService.getMessage('localStorage')}
            </span>
            <span class="text-slate-500 dark:text-slate-400">
              {Math.round(storageStats.localUsed / 1024)}KB / {Math.round(
                storageStats.localQuota / 1024 / 1024
              )}MB
            </span>
          </div>
          <ProgressBar
            value={storageStats.localUsed}
            max={storageStats.localQuota}
            size="md"
            showPercentage={false}
          />
        </div>
      </Card>
    </div>
  {/if}
</div>
