<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type DropItem } from '@/interfaces'
  import Button from '@/components/Button.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DropTarget from '@/components/DragDrop/DropTarget.svelte'
  import Text from '@/components/Text.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import SearchBar from '@/components/ProxyConfigs/SearchBar.svelte'
  import KeyboardShortcutsCard from '@/components/ProxyConfigs/KeyboardShortcutsCard.svelte'
  import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
  import { Cable, Zap, Search } from '@/utils/icons'
  import { slide } from 'svelte/transition'

  interface Props {
    onOpenEditor: (scriptId?: string) => void
  }

  let { onOpenEditor }: Props = $props()

  let settings = $derived($settingsStore)
  let dragType = $state<'QUICK_SWITCH' | 'OPTIONS' | ''>('')
  let dropError = $state<string | null>(null)
  let searchQuery = $state('')
  let showSearch = $state(false)
  let hasProxies = $derived(settings.proxyConfigs.length > 0)

  // Quick Switch proxies are never filtered by search
  let quickSwitchProxies = $derived(settings.proxyConfigs.filter((p) => p.quickSwitch))

  // Only filter regular proxies based on search query
  let regularProxies = $derived(
    settings.proxyConfigs.filter((p) => {
      if (p.quickSwitch) return false // Exclude quick switch proxies
      if (!searchQuery.trim()) return true // No search, show all
      const query = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(query) || (p.mode && p.mode.toLowerCase().includes(query))
      )
    })
  )

  let searchBarRef = $state<SearchBar>()

  // Toggle search visibility
  function toggleSearch() {
    showSearch = !showSearch
    if (showSearch) {
      // Auto-focus when showing
      setTimeout(() => searchBarRef?.focus(), 100)
    } else {
      // Clear search when hiding
      searchQuery = ''
    }
  }

  // Keyboard shortcuts handler
  function handleKeydown(event: KeyboardEvent) {
    // Ctrl/Cmd+K to toggle search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      toggleSearch()
    }

    // Escape to hide search and clear
    if (event.key === 'Escape' && showSearch) {
      event.preventDefault()
      toggleSearch()
    }

    // Ctrl/Cmd+N to create new proxy
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault()
      onOpenEditor()
    }

    // Number keys 1-9 to toggle quick switch proxies
    if (event.key >= '1' && event.key <= '9') {
      const index = parseInt(event.key) - 1
      if (index < quickSwitchProxies.length) {
        event.preventDefault()
        const proxy = quickSwitchProxies[index]
        if (!proxy.id) return // Skip if no ID
        const newState = !proxy.isActive
        settingsStore.setProxy(proxy.id, newState)
        toastStore.show(
          newState
            ? `${I18nService.getMessage('proxyActivated') || 'Activated'}: ${proxy.name}`
            : `${I18nService.getMessage('proxyDeactivated') || 'Deactivated'}: ${proxy.name}`,
          'success'
        )
      }
    }
  }

  async function handleQuickSwitchToggle(checked: boolean) {
    await settingsStore.quickSwitchToggle(checked)
    toastStore.show(
      checked
        ? I18nService.getMessage('quickSwitchEnabled')
        : I18nService.getMessage('quickSwitchDisabled'),
      'success'
    )
  }

  async function handleDrop(item: DropItem, pageType: 'QUICK_SWITCH' | 'OPTIONS') {
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

  function handleSearch(query: string) {
    searchQuery = query
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="py-6 space-y-8">
  {#if hasProxies}
    <KeyboardShortcutsCard />

    <!-- Quick Switch Configs Section -->
    <div>
      <SectionHeader
        icon={Zap}
        title={I18nService.getMessage('quickSwitchConfigsTitle')}
        description={I18nService.getMessage('quickSwitchConfigsDescription')}
        count={quickSwitchProxies.length}
        iconColor="purple"
        showToggle={true}
        toggleChecked={settings.quickSwitchEnabled}
        toggleTooltip={I18nService.getMessage('tooltipQuickSwitchMode')}
        ontoggle={handleQuickSwitchToggle}
      />

      <DropTarget onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}>
        <section
          data-drag-type={dragType}
          data-page-type="QUICK_SWITCH"
          class="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md"
        >
          <div class="relative rounded-lg transition-colors">
            <div
              class="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/80 z-10"
              data-overlay
            >
              <Text as="p" size="xl" weight="medium" classes="text-blue-700 dark:text-blue-300">
                {I18nService.getMessage('dropToAddQuickScripts')}
              </Text>
            </div>

            {#if hasProxies && settings.proxyConfigs.filter((p) => p.quickSwitch).length === 0}
              <div class="text-center py-8">
                <Text as="p" size="sm" color="muted" classes="mb-2">
                  {I18nService.getMessage('quickSwitchEmptyHint') ||
                    'Drag proxy configurations here for quick access'}
                </Text>
                <Text as="p" size="xs" color="muted">
                  {I18nService.getMessage('quickSwitchEmptySubHint') ||
                    'Proxies added here will appear in Quick Switch mode'}
                </Text>
              </div>
            {:else}
              <ScriptList
                pageType="QUICK_SWITCH"
                title=""
                proxies={quickSwitchProxies}
                bind:dragType
              />
            {/if}
          </div>
        </section>
      </DropTarget>
    </div>
  {/if}

  <!-- All Proxy Configs Section -->
  <div>
    <div class="mb-6 pb-2 flex justify-between items-center">
      <div class="flex-1">
        <SectionHeader
          icon={Cable}
          title={I18nService.getMessage('allProxyConfigsTitle')}
          description={I18nService.getMessage('allProxyConfigsDescription')}
          count={regularProxies.length}
          iconColor="slate"
        />
      </div>
      <div class="flex gap-2 items-center">
        <!-- Search Toggle Button -->
        <Tooltip text={showSearch ? 'Hide search' : 'Show search (Ctrl+K)'} position="bottom">
          <button
            type="button"
            onclick={toggleSearch}
            class="p-2.5 rounded-lg transition-all duration-150 {showSearch
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}"
            aria-label={showSearch ? 'Hide search' : 'Show search'}
          >
            <Search size={18} />
          </button>
        </Tooltip>

        <!-- Add New Script Button -->
        <Tooltip text={I18nService.getMessage('tooltipKeyboardShortcut')} position="bottom">
          <Button data-testid="add-new-script-btn" color="primary" onclick={() => onOpenEditor()}
            >{I18nService.getMessage('addNewScript')}</Button
          >
        </Tooltip>
      </div>
    </div>

    <!-- Search Bar (only for All Proxy Configs) -->
    {#if showSearch}
      <div transition:slide={{ duration: 200 }} class="mb-4">
        <SearchBar bind:this={searchBarRef} bind:searchQuery onsearch={handleSearch} />
      </div>
    {/if}

    <DropTarget onDrop={(item) => handleDrop(item, 'OPTIONS')}>
      <section
        data-drag-type={dragType}
        data-page-type="OPTIONS"
        class="relative rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 border-2 border-transparent transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700"
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
            proxies={regularProxies}
            onScriptEdit={(scriptId) => onOpenEditor(scriptId)}
            bind:dragType
            title=""
          />
        </div>
      </section>
    </DropTarget>
  </div>

  {#if dropError}
    <div class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200">
      <Text as="p">{dropError}</Text>
    </div>
  {/if}
</div>
