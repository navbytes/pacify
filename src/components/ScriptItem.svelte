<script lang="ts">
import ToggleSwitch from '@/components/ToggleSwitch.svelte'
import type { ListViewType, ProxyConfig } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { badgePatterns, flexPatterns } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { GripVertical, Pencil, ShieldCheck, Trash } from '@/utils/icons'
import {
  getProxyDescription,
  getProxyModeColor,
  getProxyModeIcon,
  getProxyModeLabel,
} from '@/utils/proxyModeHelpers'
import { colors, transitions } from '@/utils/theme'
import Button from './Button.svelte'
import ConfirmDialog from './ConfirmDialog.svelte'
import DraggableItem from './DragDrop/DraggableItem.svelte'

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
    class={cn(
      'group relative rounded-lg border-l-4 border-y border-r',
      transitions.normal,
      pageType === 'POPUP' ? 'p-2' : 'p-5',
      pageType === 'QUICK_SWITCH' && 'border-dashed',
      proxy.isActive
        ? [
            colors.background.active,
            'border-y-blue-200 border-r-blue-200 dark:border-y-blue-800 dark:border-r-blue-800',
            'shadow-md hover:shadow-lg',
            'ring-1 ring-blue-200/50 dark:ring-blue-800/30',
          ]
        : [
            colors.background.default,
            'border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700',
            'hover:shadow-md hover:scale-[1.005]',
            'hover:border-y-slate-300 hover:border-r-slate-300 dark:hover:border-y-slate-600 dark:hover:border-r-slate-600',
          ]
    )}
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
    <div class={cn(flexPatterns.between, 'gap-2.5 min-w-0 flex-1')}>
      <div class={cn(flexPatterns.centerVertical, 'gap-2.5 min-w-0 flex-1')}>
        {#if pageType !== 'POPUP'}
          <!-- Drag handle (only for OPTIONS and QUICK_SWITCH) -->
          <div
            class={cn(
              'hidden group-hover:flex cursor-grab active:cursor-grabbing',
              colors.icon.muted,
              'hover:text-blue-600 dark:hover:text-blue-400',
              transitions.fast
            )}
            role="button"
            tabindex="0"
            aria-label="Drag to move to Quick Switch"
            title="Drag to Quick Switch"
          >
            <GripVertical size={18} strokeWidth={2.5} />
          </div>
        {/if}

        <!-- Color indicator badge (for colorblind accessibility) -->
        <div
          class="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-800"
          style="background-color: {proxy.color}"
          aria-label="Proxy color: {proxy.color}"
        ></div>

        <!-- Mode icon inline (POPUP only) -->
        {#if pageType === 'POPUP'}
          <ModeIcon size={14} class={cn('flex-shrink-0', modeColors.text)} />
        {/if}

        <h3 class={cn('text-base font-semibold truncate', colors.text.default)}>{proxy.name}</h3>

        {#if proxy.isActive}
          <span
            class={cn(
              badgePatterns.base,
              'font-semibold border',
              colors.success.light,
              colors.success.text,
              colors.success.border,
              'rounded-md'
            )}
            role="status"
            aria-label="This proxy is currently active"
          >
            <ShieldCheck size={12} aria-hidden="true" />
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

    <!-- Card Content -->
    {#if pageType !== 'POPUP'}
      <!-- Full content for OPTIONS/QUICK_SWITCH -->
      <div class={cn(flexPatterns.col, 'gap-2 mb-4 mt-3')}>
        <!-- Mode badge -->
        <div
          class={cn(
            badgePatterns.base,
            'self-start font-medium border rounded-md',
            modeColors.bg,
            modeColors.text,
            modeColors.border
          )}
        >
          <ModeIcon size={13} />
          <span>{modeLabel}</span>
        </div>

        <!-- Description -->
        {#if proxyDesc}
          <p class={cn('text-sm truncate', colors.text.muted)}>{proxyDesc}</p>
        {/if}
      </div>
    {/if}

    <!-- Card Footer (OPTIONS only) -->
    {#if pageType === 'OPTIONS'}
      <div class={cn(flexPatterns.between, 'pt-3 border-t', colors.border.default)}>
        <ToggleSwitch
          checked={proxy.isActive}
          onchange={(checked) => handleSetProxy(checked, proxy.id)}
          aria-label={I18nService.getMessage(
            proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
            proxy.name
          )}
        />

        <div class={cn(flexPatterns.centerVertical, 'gap-1')}>
          <Button
            color="primary"
            minimal
            onclick={() => openEditor(proxy.id)}
            aria-label={I18nService.getMessage('editConfiguration', proxy.name)}
            classes="hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            {#snippet icon()}
              <Pencil size={16} />
            {/snippet}
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
            {#snippet icon()}
              <Trash size={16} class={cn(colors.danger.text)} />
            {/snippet}
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
