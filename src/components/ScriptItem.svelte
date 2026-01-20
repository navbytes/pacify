<script lang="ts">
import ToggleSwitch from '@/components/ToggleSwitch.svelte'
import type { ListViewType, ProxyConfig, ViewMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import {
  badgePatterns,
  flexPatterns,
  gradientOverlayVariants,
  scriptItemVariants,
} from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { GripVertical, Lock, Pencil, ShieldCheck, Trash } from '@/utils/icons'
import {
  findAutoProxyReferences,
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
  disableDrag?: boolean
  viewMode?: ViewMode
}

let {
  proxy,
  pageType = 'POPUP',
  onScriptEdit,
  dragType = $bindable(),
  disableDrag = false,
  viewMode = 'grid',
}: Props = $props()

let settings = $derived($settingsStore)
let modeColors = $derived(getProxyModeColor(proxy.mode, proxy))
let ModeIcon = $derived(getProxyModeIcon(proxy.mode, proxy))
let modeLabel = $derived(getProxyModeLabel(proxy.mode, proxy))
let proxyDesc = $derived(getProxyDescription(proxy.mode, proxy))
let showDeleteDialog = $state(false)
let autoProxyRefs = $derived(
  proxy.id ? findAutoProxyReferences(proxy.id, settings.proxyConfigs) : []
)

// Check if proxy has authentication configured
let hasAuthentication = $derived(() => {
  // Check manual proxy rules
  if (proxy.rules) {
    const checkProxy = (p: typeof proxy.rules.singleProxy) =>
      p && (p.username || p.password)

    if (checkProxy(proxy.rules.singleProxy)) return true
    if (checkProxy(proxy.rules.proxyForHttp)) return true
    if (checkProxy(proxy.rules.proxyForHttps)) return true
    if (checkProxy(proxy.rules.proxyForFtp)) return true
    if (checkProxy(proxy.rules.fallbackProxy)) return true
  }

  // Check Auto-Proxy inline proxies
  if (proxy.autoProxy) {
    // Check rules with inline proxies
    const hasAuthInRules = proxy.autoProxy.rules.some(rule =>
      rule.inlineProxy && (rule.inlineProxy.username || rule.inlineProxy.password)
    )
    if (hasAuthInRules) return true

    // Check fallback inline proxy
    if (proxy.autoProxy.fallbackInlineProxy &&
        (proxy.autoProxy.fallbackInlineProxy.username || proxy.autoProxy.fallbackInlineProxy.password)) {
      return true
    }
  }

  return false
})

// Generate delete confirmation message with Auto-Proxy warning if applicable
let deleteMessage = $derived(() => {
  const baseMessage = I18nService.getMessage('deleteProxyMessage', proxy.name)
  if (autoProxyRefs.length === 0) {
    return baseMessage
  }

  // Build a clearer warning message
  const warningIntro =
    I18nService.getMessage('autoProxyReferenceWarning') ||
    'This proxy is used by the following Auto-Proxy configurations:'
  const refList = autoProxyRefs
    .map((r) => {
      const refText =
        r.ruleCount === 1
          ? I18nService.getMessage('autoProxyRefSingular') || '1 rule'
          : I18nService.getMessage('autoProxyRefPlural', String(r.ruleCount)) ||
            `${r.ruleCount} rules`
      return `  • ${r.configName} (${refText})`
    })
    .join('\n')
  const consequence =
    I18nService.getMessage('autoProxyDeleteConsequence') ||
    'These rules will be automatically removed when you delete this proxy.'

  return `${baseMessage}\n\n${warningIntro}\n${refList}\n\n${consequence}`
})

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
  disabled={pageType === 'POPUP' || disableDrag}
  bind:dragType
>
  <div
    class={cn(
      scriptItemVariants({
        viewMode,
        pageType,
        isActive: proxy.isActive,
      }),
      // List view: horizontal layout with content on left and actions on right
      pageType === 'OPTIONS' && viewMode === 'list' && 'flex items-center gap-4'
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
    <!-- Gradient overlay background -->
    <div
      class={gradientOverlayVariants()}
      style={`background: linear-gradient(135deg, ${proxy.color}08 0%, transparent 60%)`}
    ></div>

    <!-- Main Content Wrapper (left side in list view) -->
    <div class={cn('flex-1 min-w-0', viewMode === 'list' && 'flex flex-col gap-2')}>
      <!-- Card Header -->
      <div
        class={cn(
          flexPatterns.between,
          'gap-2.5 min-w-0 flex-1'
        )}
      >
        <div
          class={cn(
          flexPatterns.centerVertical,
          'gap-2.5 min-w-0 flex-1'
        )}
        >
          {#if pageType !== 'POPUP' && !disableDrag}
            <!-- Drag handle (only for OPTIONS and QUICK_SWITCH when drag is enabled) -->
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
          <div class="relative shrink-0">
            <!-- Main color dot -->
            <div
              class={cn(
              'rounded-full shadow-sm transition-transform duration-200 w-4 h-4',
              proxy.isActive
                ? 'ring-2 ring-offset-1 group-hover:scale-110'
                : 'ring-1 ring-slate-200 dark:ring-slate-700 group-hover:scale-105'
            )}
              style={proxy.isActive
              ? `background-color: ${proxy.color}; ring-color: ${proxy.color}40`
              : `background-color: ${proxy.color}`}
              aria-label="Proxy color: {proxy.color}"
            ></div>
          </div>

          <!-- Mode icon inline (POPUP only) -->
          {#if pageType === 'POPUP'}
            <ModeIcon size={14} class={cn('shrink-0', modeColors.text)} />
          {/if}

          <h3
            class={cn(
            'font-semibold truncate text-base',
            colors.text.default
          )}
          >
            {proxy.name}
          </h3>

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

          {#if hasAuthentication()}
            <span
              class={cn(
                badgePatterns.base,
                'font-medium border',
                'bg-amber-50 dark:bg-amber-900/20',
                'text-amber-700 dark:text-amber-300',
                'border-amber-200 dark:border-amber-800',
                'rounded-md'
              )}
              role="status"
              aria-label="This proxy uses authentication"
              title={I18nService.getMessage('proxyHasAuth') || 'Authentication configured'}
            >
              <Lock size={11} aria-hidden="true" />
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
        <div
          class={cn(flexPatterns.col, 'gap-2', viewMode === 'grid' ? 'mb-4 mt-3' : 'mt-2', 'relative z-10')}
        >
          <!-- Mode badge -->
          <div
            class={cn(
              badgePatterns.base,
              'self-start font-medium border rounded-lg shadow-sm backdrop-blur-sm',
              'transition-all duration-200 hover:scale-105',
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
    </div>
    <!-- End Main Content Wrapper -->

    <!-- Actions Section -->
    {#if pageType === 'OPTIONS'}
      {#if viewMode === 'list'}
        <!-- List View: Actions on right side (vertical layout) -->
        <div class={cn(flexPatterns.centerVertical, 'gap-3 shrink-0 relative z-10')}>
          <ToggleSwitch
            checked={proxy.isActive}
            onchange={(checked) => handleSetProxy(checked, proxy.id)}
            aria-label={I18nService.getMessage(
              proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
              proxy.name
            )}
          />

          <Button
            color="primary"
            minimal
            onclick={() => openEditor(proxy.id)}
            aria-label={I18nService.getMessage('editConfiguration', proxy.name)}
            classes="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all hover:scale-105"
          >
            {#snippet icon()}
              <Pencil size={16} />
            {/snippet}
            <span class="text-sm font-medium">Edit</span>
          </Button>

          <Button
            color="error"
            minimal
            onclick={confirmDelete}
            aria-label={I18nService.getMessage('deleteConfiguration', proxy.name)}
            classes="hover:bg-red-50 dark:hover:bg-red-950/20 transition-all hover:scale-105"
            data-testid={`delete-proxy-button-${proxy.id}`}
          >
            {#snippet icon()}
              <Trash size={16} class={cn(colors.danger.text)} />
            {/snippet}
            <span class="text-sm font-medium">Delete</span>
          </Button>
        </div>
      {:else}
        <!-- Grid View: Actions in footer (horizontal layout) -->
        <div
          class={cn(
            flexPatterns.between,
            'relative z-10 pt-3 border-t',
            colors.border.default
          )}
        >
          <ToggleSwitch
            checked={proxy.isActive}
            onchange={(checked) => handleSetProxy(checked, proxy.id)}
            aria-label={I18nService.getMessage(
              proxy.isActive ? 'toggleProxyOff' : 'toggleProxyOn',
              proxy.name
            )}
          />

          <div class={cn(flexPatterns.centerVertical, 'gap-1.5')}>
            <Button
              color="primary"
              minimal
              onclick={() => openEditor(proxy.id)}
              aria-label={I18nService.getMessage('editConfiguration', proxy.name)}
              classes="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all hover:scale-105"
            >
              {#snippet icon()}
                <Pencil size={16} />
              {/snippet}
              <span class="text-sm font-medium">Edit</span>
            </Button>
            <Button
              color="error"
              minimal
              onclick={confirmDelete}
              aria-label={I18nService.getMessage('deleteConfiguration', proxy.name)}
              classes="hover:bg-red-50 dark:hover:bg-red-950/20 transition-all hover:scale-105"
              data-testid={`delete-proxy-button-${proxy.id}`}
            >
              {#snippet icon()}
                <Trash size={16} class={cn(colors.danger.text)} />
              {/snippet}
              <span class="text-sm font-medium">Delete</span>
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</DraggableItem>

<ConfirmDialog
  bind:open={showDeleteDialog}
  title={I18nService.getMessage('deleteProxyTitle')}
  message={deleteMessage()}
  confirmLabel={I18nService.getMessage('delete')}
  cancelLabel={I18nService.getMessage('cancel')}
  variant="danger"
  onConfirm={handleScriptDelete}
  onCancel={() => {}}
/>
