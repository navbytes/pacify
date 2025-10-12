<script lang="ts">
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import { type ProxyConfig, type ListViewType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { ShieldCheck, Pencil, Trash, GripVertical } from 'lucide-svelte'
  import Button from './Button.svelte'
  import ConfirmDialog from './ConfirmDialog.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DraggableItem from './DragDrop/DraggableItem.svelte'
  import {
    getProxyModeLabel,
    getProxyModeIcon,
    getProxyModeColor,
    getProxyDescription,
  } from '@/utils/proxyModeHelpers'

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
      group relative p-5 rounded-lg transition-all duration-200 border-l-4
      ${pageType === 'QUICK_SWITCH' ? 'border-y border-r border-dashed' : 'border-y border-r'}
      ${
        proxy.isActive
          ? 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-800 border-y-blue-200 border-r-blue-200 dark:border-y-blue-800 dark:border-r-blue-800 shadow-md hover:shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-800/30'
          : 'bg-white dark:bg-slate-800 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 hover:shadow-md hover:border-y-slate-300 hover:border-r-slate-300 dark:hover:border-y-slate-600 dark:hover:border-r-slate-600 dark:hover:bg-slate-750 hover:scale-[1.005]'
      }
    `}
    style={`border-left-color: ${proxy.color}`}
    role="button"
    tabindex="0"
    data-testid={`proxy-item-${proxy.name}`}
    onkeydown={pageType === 'OPTIONS'
      ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSetProxy(!proxy.isActive, proxy.id)
          }
        }
      : undefined}
  >
    <!-- Card Header -->
    <div class="flex items-center justify-between gap-2.5 min-w-0 flex-1">
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        {#if pageType !== 'POPUP'}
          <!-- Drag handle (only for OPTIONS and QUICK_SWITCH) -->
          <div
            class="hidden group-hover:flex cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            aria-label="Drag to reorder"
            title="Drag to Quick Switch"
          >
            <GripVertical size={18} strokeWidth={2.5} />
          </div>
        {/if}

        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
          {proxy.name}
        </h3>

        {#if proxy.isActive}
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800"
          >
            <ShieldCheck size={12} />
            Active
          </span>
        {/if}
      </div>

      {#if pageType === 'POPUP' || pageType === 'QUICK_SWITCH'}
        <!-- POPUP & QUICK_SWITCH: Toggle in header -->
        <ToggleSwitch
          checked={proxy.isActive}
          onchange={(checked) => handleSetProxy(checked, proxy.id)}
          aria-label={I18nService.getMessage(
            proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
            proxy.name
          )}
        />
      {/if}
    </div>

    <!-- Card Content (OPTIONS only) -->
    {#if pageType !== 'POPUP'}
      <div class="flex flex-col gap-2 mb-4 mt-3">
        <!-- Mode badge -->
        <div
          class={`inline-flex self-start items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${modeColors.bg} ${modeColors.text} ${modeColors.border}`}
        >
          <ModeIcon size={13} />
          <span>{modeLabel}</span>
        </div>

        <!-- Description -->
        {#if proxyDesc}
          <p class="text-sm text-slate-600 dark:text-slate-400 truncate">
            {proxyDesc}
          </p>
        {/if}
      </div>
    {/if}

    <!-- Card Footer (OPTIONS only) -->
    {#if pageType === 'OPTIONS'}
      <div
        class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700"
      >
        <ToggleSwitch
          checked={proxy.isActive}
          onchange={(checked) => handleSetProxy(checked, proxy.id)}
          aria-label={I18nService.getMessage(
            proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
            proxy.name
          )}
        />

        <div class="flex items-center gap-1">
          <Button
            color="primary"
            minimal
            onclick={() => openEditor(proxy.id)}
            aria-label={I18nService.getMessage('editConfiguration', proxy.name)}
            classes="hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            {#snippet icon()}<Pencil size={16} />{/snippet}
            <span class="text-sm">Edit</span>
          </Button>
          <Button
            color="error"
            minimal
            onclick={confirmDelete}
            aria-label={I18nService.getMessage('deleteConfiguration', proxy.name)}
            classes="hover:bg-red-50 dark:hover:bg-red-950/20"
            data-testid={`delete-proxy-button-${proxy.id}`}
          >
            {#snippet icon()}<Trash size={16} class="text-red-600 dark:text-red-400" />{/snippet}
            <span class="text-sm">Delete</span>
          </Button>
        </div>
      </div>
    {/if}
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
