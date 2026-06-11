<script lang="ts">
import { onMount } from 'svelte'
import Button from '@/components/Button.svelte'
import EmptyState from '@/components/EmptyState.svelte'
import ScriptList from '@/components/ScriptList.svelte'
import Text from '@/components/Text.svelte'
import Tooltip from '@/components/Tooltip.svelte'
import { ChromeService } from '@/services/chrome'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils/cn'
import { Cable, Plus, Power, Settings } from '@/utils/icons'

let settings = $derived($settingsStore)
let activeProxy = $derived(settings.proxyConfigs?.find((p) => p.isActive) || null)
let hasProxies = $derived((settings.proxyConfigs?.length || 0) > 0)

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

async function disableAllProxies() {
  if (activeProxy?.id) {
    await settingsStore.setProxy(activeProxy.id, false)
  }
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
      <ScriptList pageType="POPUP" title="" viewMode="list" />
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

  <!-- Footer - the single off action (status now lives in the top hero) -->
  {#if activeProxy}
    <footer class="px-5 py-2.5 border-t border-slate-200 dark:border-slate-700">
      <Button
        size="sm"
        color="secondary"
        onclick={disableAllProxies}
        data-testid="disable-proxy-btn"
        classes="w-full justify-center"
      >
        {#snippet icon()}
          <Power size={14} />
        {/snippet}
        {I18nService.getMessage('offButton')}
      </Button>
    </footer>
  {/if}
</div>

<style lang="postcss">
/* Popup scrollbar sizing/clamp. Theme-dependent colors live in app.css
   (`.popup-scroll`) so they follow the in-app `.dark` class rather than the
   OS prefers-color-scheme, and to avoid Lightning CSS :global() warnings. */
main {
  max-height: calc(400px - 4rem);
}
</style>
