<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type DropItem } from '@/interfaces'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DropTarget from '@/components/DragDrop/DropTarget.svelte'
  import Text from '@/components/Text.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import Card from '@/components/Card.svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import {
    Cable,
    Zap,
    CircleQuestionMark,
    Search,
    X,
    Keyboard,
    ChevronDown,
    ChevronUp,
  } from 'lucide-svelte'

  interface Props {
    onOpenEditor: (scriptId?: string) => void
  }

  let { onOpenEditor }: Props = $props()

  let settings = $derived($settingsStore)
  let dragType = $state<'QUICK_SWITCH' | 'OPTIONS' | ''>('')
  let dropError = $state<string | null>(null)
  let searchQuery = $state('')
  let hasProxies = $derived(settings.proxyConfigs.length > 0)

  // Filter proxies based on search query
  let filteredProxies = $derived(
    settings.proxyConfigs.filter((p) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(query) || (p.mode && p.mode.toLowerCase().includes(query))
      )
    })
  )

  let quickSwitchProxies = $derived(filteredProxies.filter((p) => p.quickSwitch))
  let regularProxies = $derived(filteredProxies.filter((p) => !p.quickSwitch))
  let searchInputRef = $state<HTMLInputElement>()
  let showKeyboardHints = $state(false)

  // Keyboard shortcuts handler
  function handleKeydown(event: KeyboardEvent) {
    // Ctrl/Cmd+K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      searchInputRef?.focus()
    }

    // Escape to clear search
    if (event.key === 'Escape' && searchQuery) {
      event.preventDefault()
      searchQuery = ''
      searchInputRef?.blur()
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

<svelte:window on:keydown={handleKeydown} />

<div class="py-6 space-y-8">
  {#if hasProxies}
    <!-- Search/Filter Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} class="text-slate-400 dark:text-slate-500" />
      </div>
      <input
        bind:this={searchInputRef}
        bind:value={searchQuery}
        type="text"
        placeholder="Search proxies... (Ctrl+K)"
        class="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
      />
      {#if searchQuery}
        <button
          type="button"
          onclick={() => {
            searchQuery = ''
            searchInputRef?.focus()
          }}
          class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <X size={18} class="text-slate-400 dark:text-slate-500" />
        </button>
      {/if}
    </div>

    <!-- Keyboard Shortcuts Hints Card -->
    <Card classes="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
      <button
        type="button"
        onclick={() => (showKeyboardHints = !showKeyboardHints)}
        class="w-full flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2">
          <Keyboard size={18} class="text-blue-600 dark:text-blue-400" />
          <Text weight="semibold" classes="text-blue-900 dark:text-blue-100">
            Keyboard Shortcuts
          </Text>
        </div>
        {#if showKeyboardHints}
          <ChevronUp size={18} class="text-blue-600 dark:text-blue-400" />
        {:else}
          <ChevronDown size={18} class="text-blue-600 dark:text-blue-400" />
        {/if}
      </button>

      {#if showKeyboardHints}
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex items-center justify-between py-1.5">
            <Text size="sm" color="muted">Focus search</Text>
            <kbd
              class="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded shadow-sm"
            >
              Ctrl/Cmd+K
            </kbd>
          </div>
          <div class="flex items-center justify-between py-1.5">
            <Text size="sm" color="muted">New proxy</Text>
            <kbd
              class="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded shadow-sm"
            >
              Ctrl/Cmd+N
            </kbd>
          </div>
          <div class="flex items-center justify-between py-1.5">
            <Text size="sm" color="muted">Clear search</Text>
            <kbd
              class="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded shadow-sm"
            >
              Escape
            </kbd>
          </div>
          <div class="flex items-center justify-between py-1.5">
            <Text size="sm" color="muted">Toggle proxy 1-9</Text>
            <kbd
              class="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded shadow-sm"
            >
              1-9
            </kbd>
          </div>
        </div>
      {/if}
    </Card>

    <!-- Quick Switch Mode Toggle Card -->
    <Card
      classes="hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
    >
      <FlexGroup
        direction="horizontal"
        childrenGap="lg"
        alignItems="center"
        justifyContent="between"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <Text as="label" weight="semibold" id="quickSwitchToggle">
              {I18nService.getMessage('quickSwitchMode')}
            </Text>
            <Tooltip text={I18nService.getMessage('tooltipQuickSwitchMode')} position="top">
              <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
            </Tooltip>
          </div>
          <Text as="p" size="sm" color="muted" classes="mt-1">
            {I18nService.getMessage('quickSwitchDescription')}
          </Text>
          {#if settings.quickSwitchEnabled}
            <Text as="p" size="xs" weight="medium" classes="mt-2 text-blue-600 dark:text-blue-400">
              {I18nService.getMessage('quickSwitchEnabledStatus')}
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
    </Card>

    <!-- Quick Switch Configs Section -->
    <div>
      <div
        class="mb-6 pb-2 border-b border-purple-200 dark:border-purple-800 flex items-center gap-2"
      >
        <div
          class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg flex items-center justify-center shadow-md"
        >
          <svelte:component this={Zap} size={16} class="text-white" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {I18nService.getMessage('quickSwitchConfigsTitle')}
            </h2>
            <span
              class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            >
              {quickSwitchProxies.length}
            </span>
          </div>
          <Text as="p" size="xs" color="muted" classes="mt-0.5">
            {I18nService.getMessage('quickSwitchConfigsDescription')}
          </Text>
        </div>
      </div>

      <DropTarget onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}>
        <section
          data-drag-type={dragType}
          data-page-type="QUICK_SWITCH"
          class="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md"
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

            {#if hasProxies && settings.proxyConfigs.filter((p) => p.quickSwitch).length === 0}
              <!-- Hint when Quick Switch is empty but proxies exist -->
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
    <div
      class="mb-6 pb-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-md"
        >
          <svelte:component this={Cable} size={16} class="text-white" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {I18nService.getMessage('allProxyConfigsTitle')}
            </h2>
            <span
              class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
            >
              {regularProxies.length}
            </span>
          </div>
          <Text as="p" size="xs" color="muted" classes="mt-0.5">
            {I18nService.getMessage('allProxyConfigsDescription')}
          </Text>
        </div>
      </div>
      <!-- Add New Script Button (Header Action) -->
      <Tooltip text={I18nService.getMessage('tooltipKeyboardShortcut')} position="bottom">
        <Button data-testid="add-new-script-btn" color="primary" onclick={() => onOpenEditor()}
          >{I18nService.getMessage('addNewScript')}</Button
        >
      </Tooltip>
    </div>

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

  <!-- Error Message -->
  {#if dropError}
    <div class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200">
      <Text as="p">{dropError}</Text>
    </div>
  {/if}
</div>
