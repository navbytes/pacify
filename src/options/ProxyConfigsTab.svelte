<script lang="ts">
import { slide } from 'svelte/transition'
import Button from '@/components/Button.svelte'
import DropZone from '@/components/DropZone.svelte'
import IconButton from '@/components/IconButton.svelte'
// biome-ignore lint/style/useImportType: Used as Svelte component in template
import SearchBar from '@/components/ProxyConfigs/SearchBar.svelte'
import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
import ScriptList from '@/components/ScriptList.svelte'
import Text from '@/components/Text.svelte'
import ToggleSwitch from '@/components/ToggleSwitch.svelte'
import Tooltip from '@/components/Tooltip.svelte'
import ViewModeSwitcher from '@/components/ViewModeSwitcher.svelte'
import type { DropItem, ViewMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { Cable, CircleQuestionMark, GitBranch, Search, Zap } from '@/utils/icons'
import { colors } from '@/utils/theme'

interface Props {
  onOpenEditor: (scriptId?: string) => void
  onOpenAutoProxyEditor: () => void
}

let { onOpenEditor, onOpenAutoProxyEditor }: Props = $props()

let settings = $derived($settingsStore)
let dragType = $state<'QUICK_SWITCH' | 'OPTIONS' | ''>('')
let dropError = $state<string | null>(null)
let searchQuery = $state('')
let showSearch = $state(false)
let hasProxies = $derived(settings.proxyConfigs.length > 0)

// Quick Switch proxies are never filtered by search
let quickSwitchProxies = $derived(settings.proxyConfigs.filter((p) => p.quickSwitch))

// All proxies filtered by search query (includes quick switch proxies)
let regularProxies = $derived(
  settings.proxyConfigs.filter((p) => {
    if (!searchQuery.trim()) return true // No search, show all
    const query = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(query) || p.mode?.toLowerCase().includes(query)
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
// Note: Some shortcuts may conflict with browser/OS shortcuts (e.g., Cmd+N on macOS)
// We check for input focus to avoid interfering with typing
function handleKeydown(event: KeyboardEvent) {
  // Ignore shortcuts if user is typing in an input field
  const target = event.target as HTMLElement
  const isInputField =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  // Ctrl/Cmd+K to toggle search
  // Note: May conflict with browser's "Insert Link" on some platforms
  if (!isInputField && (event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    toggleSearch()
  }

  // Escape to hide search and clear
  if (event.key === 'Escape' && showSearch) {
    event.preventDefault()
    toggleSearch()
  }

  // Ctrl/Cmd+N to create new proxy
  // Note: May conflict with browser's "New Window" (especially Cmd+N on macOS)
  if (!isInputField && (event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    onOpenEditor()
  }

  // Number keys 1-9 to toggle quick switch proxies
  // Only works for proxies in the Quick Switch section
  if (!isInputField && event.key >= '1' && event.key <= '9') {
    const index = parseInt(event.key, 10) - 1
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

async function handleViewModeChange(mode: ViewMode) {
  await settingsStore.updateSettings({ viewMode: mode })
}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="py-6 space-y-8">
  {#if hasProxies && settings.showQuickSettings}
    <!-- Quick Switch Configs Section -->
    <div>
      <SectionHeader
        icon={Zap}
        title={I18nService.getMessage('quickSwitchConfigsTitle')}
        description={I18nService.getMessage('quickSwitchConfigsDescription')}
        count={quickSwitchProxies.length}
        iconColor="purple"
      >
        {#snippet rightContent()}
          <div class="flex items-center min-h-11">
            <Tooltip text={I18nService.getMessage('tooltipQuickSwitchMode')} position="left">
              <CircleQuestionMark size={16} class={colors.icon.muted} />
            </Tooltip>
          </div>
          <ToggleSwitch
            id="sectionToggle-quick-switch"
            checked={settings.quickSwitchEnabled}
            onchange={handleQuickSwitchToggle}
            aria-label="Toggle Quick Switch"
          />
        {/snippet}
      </SectionHeader>

      <DropZone
        color="blue"
        overlayMessage={I18nService.getMessage('dropToAddQuickScripts')}
        pageType="QUICK_SWITCH"
        bind:dragType
        onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}
      >
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
            disableDrag={false}
            bind:dragType
          />
        {/if}
      </DropZone>
    </div>
  {/if}

  <!-- All Proxy Configs Section -->
  <div>
    <SectionHeader
      icon={Cable}
      title={I18nService.getMessage('allProxyConfigsTitle')}
      description={I18nService.getMessage('allProxyConfigsDescription')}
      count={regularProxies.length}
      iconColor="slate"
    >
      {#snippet rightContent()}
        <!-- View Mode Switcher -->
        <ViewModeSwitcher viewMode={settings.viewMode} onViewModeChange={handleViewModeChange} />

        <!-- Search Toggle Button -->
        <IconButton
          icon={Search}
          label={showSearch ? 'Hide search' : 'Show search (Ctrl+K)'}
          active={showSearch}
          onclick={toggleSearch}
        />

        <!-- Add Auto-Proxy Button -->
        <Tooltip
          text={I18nService.getMessage('addAutoProxyTooltip') || 'Create URL-based routing rules'}
          position="bottom"
        >
          <Button variant="gradient" gradient="orange" onclick={onOpenAutoProxyEditor} data-testid="add-auto-proxy-btn">
            {#snippet icon()}
              <GitBranch size={16} />
            {/snippet}
            {I18nService.getMessage('addAutoProxy') || 'Add Auto-Proxy'}
          </Button>
        </Tooltip>

        <!-- Add New Script Button -->
        <Tooltip text={I18nService.getMessage('tooltipKeyboardShortcut')} position="bottom">
          <Button data-testid="add-new-script-btn" color="primary" onclick={() => onOpenEditor()}>
            {I18nService.getMessage('addNewScript')}
          </Button>
        </Tooltip>
      {/snippet}
    </SectionHeader>

    <!-- Search Bar (only for All Proxy Configs) -->
    {#if showSearch}
      <div transition:slide={{ duration: 200 }} class="mb-4">
        <SearchBar bind:this={searchBarRef} bind:searchQuery onsearch={handleSearch} />
      </div>
    {/if}

    <DropZone
      color="red"
      overlayMessage={I18nService.getMessage('dropToRemoveQuickScripts')}
      pageType="OPTIONS"
      bind:dragType
      onDrop={(item) => handleDrop(item, 'OPTIONS')}
    >
      <div role="list">
        <ScriptList
          pageType="OPTIONS"
          proxies={regularProxies}
          onScriptEdit={(scriptId) => onOpenEditor(scriptId)}
          disableDrag={!settings.showQuickSettings}
          viewMode={settings.viewMode}
          bind:dragType
          title=""
        />
      </div>
    </DropZone>
  </div>

  {#if dropError}
    <div class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200">
      <Text as="p">{dropError}</Text>
    </div>
  {/if}
</div>
