<script lang="ts">
  import type { ProxyStats, ProxyConfig } from '@/interfaces'
  import { ProxyStatsService } from '@/services/ProxyStatsService'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import Button from './Button.svelte'
  import Card from './Card.svelte'
  import { TrendingUp, Clock, BarChart3, Trash2 } from 'lucide-svelte'

  /**
   * ProxyStatsDashboard - Usage statistics overview
   * Phase 2: User Experience
   */

  let allStats = $state<Record<string, ProxyStats>>({})
  let mostUsed = $state<Array<{ proxyId: string; stats: ProxyStats }>>([])
  let unusedProxies = $state<string[]>([])
  let loading = $state(true)
  let settings = $derived($settingsStore)

  // Load stats
  async function loadStats() {
    loading = true
    try {
      allStats = await ProxyStatsService.getAllStats()
      mostUsed = await ProxyStatsService.getMostUsedProxies(5)
      unusedProxies = await ProxyStatsService.getUnusedProxies(30) // 30 days
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      loading = false
    }
  }

  // Clear all stats
  async function handleClearAllStats() {
    if (confirm('Are you sure you want to clear all usage statistics? This cannot be undone.')) {
      try {
        await ProxyStatsService.clearAllStats()
        toastStore.show('All statistics cleared', 'success')
        await loadStats()
      } catch (error) {
        toastStore.show('Failed to clear statistics', 'error')
      }
    }
  }

  // Get proxy name by ID
  function getProxyName(proxyId: string): string {
    const proxy = settings.proxyConfigs.find(p => p.id === proxyId)
    return proxy?.name || 'Unknown'
  }

  // Get proxy by ID
  function getProxy(proxyId: string): ProxyConfig | undefined {
    return settings.proxyConfigs.find(p => p.id === proxyId)
  }

  // Calculate total stats
  let totalStats = $derived(() => {
    const stats = Object.values(allStats)
    return {
      totalActivations: stats.reduce((sum, s) => sum + s.activationCount, 0),
      totalActiveTime: stats.reduce((sum, s) => sum + s.totalActiveTime, 0),
      proxiesTracked: stats.length
    }
  })

  // Load stats when component mounts
  $effect(() => {
    loadStats()
  })
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total Activations -->
      <Card classes="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
            <TrendingUp size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Total Activations</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalStats.totalActivations}
            </p>
          </div>
        </div>
      </Card>

      <!-- Total Active Time -->
      <Card classes="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-500 dark:bg-green-600 rounded-lg">
            <Clock size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Total Active Time</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {ProxyStatsService.formatDuration(totalStats.totalActiveTime)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Proxies Tracked -->
      <Card classes="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-500 dark:bg-purple-600 rounded-lg">
            <BarChart3 size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Proxies Tracked</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalStats.proxiesTracked}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Most Used Proxies -->
    {#if mostUsed.length > 0}
      <Card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Most Used Proxies
          </h3>
        </div>

        <div class="space-y-3">
          {#each mostUsed as { proxyId, stats }, index}
            {@const proxy = getProxy(proxyId)}
            {#if proxy}
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full font-semibold text-sm">
                  {index + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      style="background-color: {proxy.color}"
                    ></div>
                    <p class="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {proxy.name}
                    </p>
                  </div>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {ProxyStatsService.getUsageSummary(stats)}
                  </p>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Unused Proxies -->
    {#if unusedProxies.length > 0}
      <Card classes="border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">⚠️</span>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Unused Proxies (30+ days)
          </h3>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">
          The following proxies haven't been used in over 30 days. Consider removing them to keep your list organized.
        </p>
        <div class="flex flex-wrap gap-2">
          {#each unusedProxies as proxyId}
            {@const proxy = getProxy(proxyId)}
            {#if proxy}
              <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm">
                <div class="w-2 h-2 rounded-full" style="background-color: {proxy.color}"></div>
                {proxy.name}
              </span>
            {/if}
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Actions -->
    <div class="flex justify-between items-center pt-4">
      <p class="text-sm text-slate-500 dark:text-slate-400 italic">
        Statistics are stored locally on your device only.
      </p>
      <Button color="error" minimal onclick={handleClearAllStats}>
        {#snippet icon()}<Trash2 size={16} />{/snippet}
        Clear All Stats
      </Button>
    </div>
  </div>
{/if}
