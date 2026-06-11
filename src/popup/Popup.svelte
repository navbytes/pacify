<script lang="ts">
import { onMount } from 'svelte'
import Button from '@/components/Button.svelte'
import EmptyState from '@/components/EmptyState.svelte'
import Text from '@/components/Text.svelte'
import Tooltip from '@/components/Tooltip.svelte'
import { ChromeService } from '@/services/chrome'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils/cn'
import { Cable, Check, Plus, Settings } from '@/utils/icons'
import { getProxyCardLabel, getProxyDescription } from '@/utils/proxyModeHelpers'

let settings = $derived($settingsStore)
let activeProxy = $derived(settings.proxyConfigs?.find((p) => p.isActive) || null)
let hasProxies = $derived((settings.proxyConfigs?.length || 0) > 0)
// Quick-switch proxies float to the top, matching the previous popup order.
let sortedProxies = $derived(
  [...(settings.proxyConfigs ?? [])].sort((a, b) =>
    a.quickSwitch === b.quickSwitch ? 0 : a.quickSwitch ? -1 : 1
  )
)

// Initialize settings on mount
onMount(() => {
  settingsStore.init()
})

function openSettings() {
  ChromeService.openOptionsPage()
}

function quickAddProxy() {
  ChromeService.openOptionsPage({ action: 'create' })
}

// Switching is a single selection (only one proxy can be active), so the popup
// is a radiogroup: picking a proxy activates it; picking "No proxy (direct)"
// turns the active one off. This makes the exclusive behavior honest, unlike
// independent toggles that silently flipped each other.
async function activate(id: string | undefined) {
  if (id) await settingsStore.setProxy(id, true)
}

async function goDirect() {
  if (activeProxy?.id) await settingsStore.setProxy(activeProxy.id, false)
}

function moveRadioFocus(event: KeyboardEvent, dir: number) {
  const current = event.currentTarget as HTMLElement
  const group = current.closest('[role="radiogroup"]')
  if (!group) return
  const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
  const i = radios.indexOf(current)
  if (i === -1) return
  event.preventDefault()
  radios[(i + dir + radios.length) % radios.length]?.focus()
}

function onRadioKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') moveRadioFocus(event, 1)
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') moveRadioFocus(event, -1)
}
</script>

<div class="min-w-80 w-96 max-w-full bg-white dark:bg-slate-900 flex flex-col">
  <!-- Header -->
  <header
    class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700"
  >
    <div class="flex items-center gap-2 min-w-0">
      <img src="/icons/icon48.png" alt="" class="w-7 h-7 shrink-0">
      <div class="min-w-0 leading-tight">
        <h1 class="text-base font-bold text-primary dark:text-primary-light truncate">PACify</h1>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
          {I18nService.getMessage('popupSubtitle') || 'Proxy Manager'}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <Tooltip text={I18nService.getMessage('addNewProxy')} position="bottom">
        <Button minimal color="primary" onclick={quickAddProxy} data-testid="add-proxy-btn">
          {#snippet icon()}
            <Plus size={18} />
          {/snippet}
          <Text classes="sr-only">{I18nService.getMessage('addNewProxy')}</Text>
        </Button>
      </Tooltip>

      <Tooltip text={I18nService.getMessage('settings')} position="bottom">
        <Button minimal color="secondary" onclick={openSettings} data-testid="settings-btn">
          {#snippet icon()}
            <Settings size={18} />
          {/snippet}
          <Text classes="sr-only">{I18nService.getMessage('settings')}</Text>
        </Button>
      </Tooltip>
    </div>
  </header>

  <!-- Main Content -->
  <main class="popup-scroll overflow-y-auto flex-1 px-5 pt-4 pb-4">
    {#if hasProxies}
      <!-- Active-status hero: the proxy state, glanceable at the top, never
           scrolled off below the list (J1). -->
      <div
        class={cn(
          'mb-3 flex items-center gap-2.5 rounded-xl border px-3 py-2.5',
          activeProxy
            ? 'bg-green-50/60 dark:bg-green-900/10 border-green-200 dark:border-green-900/40'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        )}
        role="status"
        aria-live="polite"
      >
        {#if activeProxy}
          <span
            class="w-3 h-3 rounded-full animate-pulse shrink-0"
            style="background-color: {activeProxy.color}"
          ></span>
          <div class="min-w-0 flex-1">
            <p
              class="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-400"
            >
              {I18nService.getMessage('statusConnected')}
            </p>
            <p class="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
              {activeProxy.name}
            </p>
          </div>
        {:else}
          <span class="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
            {I18nService.getMessage('statusDisconnected')}
          </p>
        {/if}
      </div>
      <div
        role="radiogroup"
        aria-label={I18nService.getMessage('selectActiveProxy')}
        class="flex flex-col gap-2"
      >
        {#each sortedProxies as proxy (proxy.id)}
          <button
            type="button"
            role="radio"
            aria-checked={proxy.isActive}
            tabindex={proxy.isActive ? 0 : -1}
            data-testid="popup-proxy-row"
            onclick={() => activate(proxy.id)}
            onkeydown={onRadioKeydown}
            class={cn(
              'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              proxy.isActive
                ? 'border-transparent ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            )}
          >
            <span
              class="w-3 h-3 rounded-full shrink-0 border border-black/5"
              style="background-color: {proxy.color}"
            ></span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
                {proxy.name}
              </span>
              <span class="block text-xs truncate text-slate-500 dark:text-slate-400">
                {getProxyCardLabel(proxy.mode, proxy)}
                {getProxyDescription(proxy.mode, proxy)
                  ? ` · ${getProxyDescription(proxy.mode, proxy)}`
                  : ''}
              </span>
            </span>
            {#if proxy.isActive}
              <span
                class="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-md px-1.5 py-0.5"
              >
                <Check size={12} aria-hidden="true" />
                {I18nService.getMessage('active')}
              </span>
            {/if}
          </button>
        {/each}

        <!-- "No proxy (direct)" is the off state — one control for on/off/switch -->
        <button
          type="button"
          role="radio"
          aria-checked={!activeProxy}
          tabindex={!activeProxy ? 0 : -1}
          data-testid="popup-direct-row"
          onclick={goDirect}
          onkeydown={onRadioKeydown}
          class={cn(
            'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            !activeProxy
              ? 'border-transparent ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          <span
            class="w-3 h-3 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600 border border-black/5"
          ></span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold truncate text-slate-700 dark:text-slate-200">
              {I18nService.getMessage('noProxyDirect')}
            </span>
            <span class="block text-xs truncate text-slate-500 dark:text-slate-400">
              {I18nService.getMessage('noProxyDirectHint')}
            </span>
          </span>
        </button>
      </div>
    {:else}
      <EmptyState
        title={I18nService.getMessage('noProxiesYet') || 'No proxy configurations yet'}
        description={I18nService.getMessage('noProxiesDescription') ||
          'Get started by creating your first proxy configuration to control how your browser connects to the internet.'}
        actionLabel={I18nService.getMessage('getStarted') || 'Get Started'}
        onAction={quickAddProxy}
        icon={Cable}
        iconSize={48}
        compact
      />
    {/if}
  </main>
</div>

<style lang="postcss">
/* Popup scrollbar sizing/clamp. Theme-dependent colors live in app.css
   (`.popup-scroll`) so they follow the in-app `.dark` class rather than the
   OS prefers-color-scheme, and to avoid Lightning CSS :global() warnings. */
main {
  max-height: calc(400px - 4rem);
}
</style>
