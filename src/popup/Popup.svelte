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

  <!-- Footer - Status & Actions -->
  {#if hasProxies}
    <footer class="px-5 py-2.5 border-t border-slate-200 dark:border-slate-700 min-h-13">
      <div class="flex items-center justify-between h-full">
        <div class="flex items-center gap-2">
          {#if activeProxy}
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Text size="sm" weight="medium" classes="text-green-700 dark:text-green-400">
              {I18nService.getMessage('statusConnected')}: {activeProxy.name}
            </Text>
          {:else}
            <div class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            <Text size="sm" weight="medium" classes="text-slate-600 dark:text-slate-300">
              {I18nService.getMessage('statusDisconnected')}
            </Text>
          {/if}
        </div>

        <!-- Always reserve space for the button to prevent layout shift -->
        <div class="shrink-0">
          {#if activeProxy}
            <Button
              size="sm"
              color="secondary"
              onclick={disableAllProxies}
              data-testid="disable-proxy-btn"
            >
              {#snippet icon()}
                <Power size={14} />
              {/snippet}
              {I18nService.getMessage('offButton')}
            </Button>
          {:else}
            <!-- Invisible placeholder to maintain layout -->
            <div class="invisible">
              <Button size="sm" color="secondary">
                {#snippet icon()}
                  <Power size={14} />
                {/snippet}
                {I18nService.getMessage('offButton')}
              </Button>
            </div>
          {/if}
        </div>
      </div>
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
