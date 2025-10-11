<script lang="ts">
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import { type ProxyConfig, type ListViewType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { ShieldCheck, Pencil, Trash } from 'lucide-svelte'
  import Button from './Button.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import ConfirmDialog from './ConfirmDialog.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DraggableItem from './DragDrop/DraggableItem.svelte'
  import {
    getProxyModeLabel,
    getProxyModeIcon,
    getProxyModeColor,
    getProxyDescription,
  } from '@/utils/proxyModeHelpers'
  import Text from './Text.svelte'

  interface Props {
    proxy: ProxyConfig
    pageType?: ListViewType
    dragType?: string
    onScriptEdit: (scriptId: string) => void
  }

  let { proxy, pageType = 'POPUP', onScriptEdit, dragType = $bindable() }: Props = $props()

  let modeColors = $derived(getProxyModeColor(proxy.mode))
  let ModeIcon = $derived(getProxyModeIcon(proxy.mode))
  let modeLabel = $derived(getProxyModeLabel(proxy.mode))
  let proxyDesc = $derived(getProxyDescription(proxy.mode, proxy))
  let showDeleteDialog = $state(false)

  async function handleSetProxy(isActive: boolean, scriptId?: string) {
    if (!scriptId) return
    await settingsStore.setProxy(scriptId, isActive)
    const message = isActive
      ? I18nService.getMessage('proxyEnabled', proxy.name)
      : I18nService.getMessage('proxyDisabled', proxy.name)
    toastStore.show(message, isActive ? 'success' : 'info')
  }

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    onScriptEdit(scriptId)
  }

  function confirmDelete() {
    showDeleteDialog = true
  }

  async function handleScriptDelete() {
    if (!proxy.id) return
    await settingsStore.deletePACScript(proxy.id)
    const message = I18nService.getMessage('proxyDeleted', proxy.name)
    toastStore.show(message, 'success')
  }
</script>

<DraggableItem
  name={proxy.name || ''}
  id={proxy.id || ''}
  dataType={pageType}
  disabled={pageType === 'POPUP'}
  bind:dragType
>
  <div
    class={`
      relative p-4 rounded-lg transition-all duration-200 border-l-4
      ${pageType === 'QUICK_SWITCH' ? 'border-y-2 border-r-2 border-dashed' : 'border-y-2 border-r-2 border-solid'}
      ${
        proxy.isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-y-blue-500 border-r-blue-500 shadow-lg ring-2 ring-blue-500/20'
          : 'bg-white dark:bg-slate-800 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 hover:shadow-md'
      }
      ${pageType !== 'POPUP' ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
    `}
    style={`border-left-color: ${proxy.color}`}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleSetProxy(!proxy.isActive, proxy.id)
      }
    }}
  >
    <!-- Active indicator badge -->
    {#if proxy.isActive}
      <div
        class="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10 animate-pulse"
      >
        <ShieldCheck size={16} class="text-white" />
      </div>
    {/if}

    <!-- Main content -->
    <div class="flex flex-col gap-3">
      <!-- Top row: Name and Toggle -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <!-- Proxy name with inline icon for POPUP -->
          {#if pageType === 'POPUP'}
            <div class="flex items-center gap-2">
              <Text color="muted">
                <ModeIcon size={18} />
              </Text>
              <Text weight="semibold" truncate>
                {proxy.name}
              </Text>
            </div>
          {:else}
            <div class="flex items-center gap-2 mb-1">
              <Text weight="semibold" truncate>
                {proxy.name}
              </Text>
            </div>
          {/if}
        </div>

        <!-- Toggle and actions -->
        <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
          <ToggleSwitch
            checked={proxy.isActive}
            onchange={(checked) => handleSetProxy(checked, proxy.id)}
            aria-label={I18nService.getMessage(
              proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
              proxy.name
            )}
          />
          {#if pageType === 'OPTIONS'}
            <Button
              color="primary"
              minimal
              onclick={() => openEditor(proxy.id)}
              aria-label={I18nService.getMessage('editConfiguration', proxy.name)}
            >
              {#snippet icon()}<Pencil />{/snippet}
            </Button>
            <Button
              color="error"
              minimal
              onclick={confirmDelete}
              aria-label={I18nService.getMessage('deleteConfiguration', proxy.name)}
              classes="hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              {#snippet icon()}<Trash class="text-red-600 dark:text-red-400" />{/snippet}
            </Button>
          {/if}
        </FlexGroup>
      </div>

      <!-- Mode badge for OPTIONS view -->
      {#if pageType !== 'POPUP'}
        <FlexGroup direction="vertical" childrenGap="xs" alignItems="start">
          <!-- Mode badge -->
          <Text
            size="xs"
            weight="medium"
            color="inherit"
            classes={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${modeColors.bg} ${modeColors.text} ${modeColors.border}`}
          >
            <ModeIcon size={14} />
            <Text>{modeLabel}</Text>
          </Text>

          <!-- Description below badge -->
          {#if proxyDesc}
            <Text size="xs" color="muted" classes="leading-relaxed">
              {proxyDesc}
            </Text>
          {/if}
        </FlexGroup>
      {/if}
    </div>
  </div>
</DraggableItem>

<ConfirmDialog
  bind:open={showDeleteDialog}
  title={I18nService.getMessage('deleteProxyTitle')}
  message={I18nService.getMessage('deleteProxyMessage', proxy.name)}
  confirmLabel={I18nService.getMessage('delete')}
  cancelLabel={I18nService.getMessage('cancel')}
  variant="danger"
  onConfirm={handleScriptDelete}
  onCancel={() => {}}
/>
