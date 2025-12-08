<script lang="ts">
  import type { ProxyConfig, ProxyMode } from '@/interfaces'
  import { Search, X, Filter } from 'lucide-svelte'
  import Button from './Button.svelte'

  /**
   * ProxySearch Component
   * Phase 2: User Experience
   *
   * Filters proxies by name, mode, color, and quick switch status
   */

  interface Props {
    proxies: ProxyConfig[]
    onFiltered: (filtered: ProxyConfig[]) => void
  }

  let { proxies, onFiltered }: Props = $props()

  let searchQuery = $state('')
  let selectedMode = $state<ProxyMode | 'all'>('all')
  let quickSwitchFilter = $state<'all' | 'yes' | 'no'>('all')
  let showFilters = $state(false)

  // Available modes for filter
  const proxyModes: Array<{ value: ProxyMode | 'all'; label: string }> = [
    { value: 'all', label: 'All Modes' },
    { value: 'direct', label: 'Direct Connection' },
    { value: 'fixed_servers', label: 'Manual Proxy' },
    { value: 'pac_script', label: 'PAC Script' },
    { value: 'auto_detect', label: 'Auto Detect' },
    { value: 'system', label: 'System Settings' }
  ]

  // Filter proxies based on search and filters
  let filteredProxies = $derived(() => {
    let result = proxies

    // Text search (name, mode)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(proxy =>
        proxy.name.toLowerCase().includes(query) ||
        proxy.mode.toLowerCase().includes(query)
      )
    }

    // Mode filter
    if (selectedMode !== 'all') {
      result = result.filter(proxy => proxy.mode === selectedMode)
    }

    // Quick switch filter
    if (quickSwitchFilter === 'yes') {
      result = result.filter(proxy => proxy.quickSwitch === true)
    } else if (quickSwitchFilter === 'no') {
      result = result.filter(proxy => !proxy.quickSwitch)
    }

    return result
  })

  // Update parent when filtered results change
  $effect(() => {
    onFiltered(filteredProxies)
  })

  // Clear all filters
  function clearFilters() {
    searchQuery = ''
    selectedMode = 'all'
    quickSwitchFilter = 'all'
  }

  // Check if any filters are active
  let hasActiveFilters = $derived(
    searchQuery.trim() !== '' ||
    selectedMode !== 'all' ||
    quickSwitchFilter !== 'all'
  )

  // Handle keyboard navigation (Ctrl/Cmd+K to focus)
  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      const searchInput = document.getElementById('proxy-search-input') as HTMLInputElement
      searchInput?.focus()
    }
  }

  // Register keyboard shortcut
  $effect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })
</script>

<div class="space-y-3">
  <!-- Search Bar -->
  <div class="relative">
    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <Search size={18} class="text-slate-400 dark:text-slate-500" />
    </div>
    <input
      id="proxy-search-input"
      type="text"
      bind:value={searchQuery}
      placeholder="Search proxies... (Ctrl+K)"
      class="w-full pl-10 pr-24 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-slate-100 dark:placeholder-slate-500"
      aria-label="Search proxies"
    />
    <div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
      {#if hasActiveFilters}
        <Button
          minimal
          color="secondary"
          onclick={clearFilters}
          aria-label="Clear all filters"
          classes="text-xs px-2 py-1"
        >
          {#snippet icon()}<X size={14} />{/snippet}
          Clear
        </Button>
      {/if}
      <Button
        minimal
        color={showFilters ? 'primary' : 'secondary'}
        onclick={() => showFilters = !showFilters}
        aria-label="Toggle filters"
        classes="px-2 py-1"
      >
        {#snippet icon()}<Filter size={16} />{/snippet}
      </Button>
    </div>
  </div>

  <!-- Advanced Filters (collapsible) -->
  {#if showFilters}
    <div class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
      <!-- Mode Filter -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Proxy Mode
        </label>
        <select
          bind:value={selectedMode}
          class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
          aria-label="Filter by proxy mode"
        >
          {#each proxyModes as mode}
            <option value={mode.value}>{mode.label}</option>
          {/each}
        </select>
      </div>

      <!-- Quick Switch Filter -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Quick Switch
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => quickSwitchFilter = 'all'}
            class={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              quickSwitchFilter === 'all'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            aria-pressed={quickSwitchFilter === 'all'}
          >
            All
          </button>
          <button
            type="button"
            onclick={() => quickSwitchFilter = 'yes'}
            class={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              quickSwitchFilter === 'yes'
                ? 'bg-green-500 text-white border-green-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            aria-pressed={quickSwitchFilter === 'yes'}
          >
            Enabled
          </button>
          <button
            type="button"
            onclick={() => quickSwitchFilter = 'no'}
            class={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              quickSwitchFilter === 'no'
                ? 'bg-slate-500 text-white border-slate-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            aria-pressed={quickSwitchFilter === 'no'}
          >
            Disabled
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Showing <span class="font-semibold">{filteredProxies.length}</span> of <span class="font-semibold">{proxies.length}</span> proxies
        </p>
      </div>
    </div>
  {:else if hasActiveFilters}
    <!-- Quick results count when filters closed -->
    <p class="text-xs text-slate-500 dark:text-slate-400 italic">
      {filteredProxies.length} of {proxies.length} proxies shown
    </p>
  {/if}
</div>
