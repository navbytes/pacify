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
import { toastStore } from '@/stores/toastStore'
import { Cable, Plus, Power, Settings, ShieldOff } from '@/utils/icons'

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

// 1.7: Bypass proxy for current site
async function bypassCurrentSite() {
  if (!activeProxy) return

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url) return

    const hostname = new URL(tab.url).hostname
    if (!hostname) return

    // Add to bypass list for fixed_servers mode
    if (activeProxy.mode === 'fixed_servers' && activeProxy.rules) {
      const currentBypass = activeProxy.rules.bypassList || []
      if (currentBypass.includes(hostname) || currentBypass.includes(`*.${hostname}`)) {
        toastStore.show(
          I18nService.getMessage('siteAlreadyBypassed') || `${hostname} is already bypassed`,
          'info'
        )
        return
      }

      const updatedBypass = [...currentBypass, hostname]
      await settingsStore.updatePACScript(
        {
          ...activeProxy,
          rules: { ...activeProxy.rules, bypassList: updatedBypass },
        },
        activeProxy.id || null
      )
      toastStore.show(
        I18nService.getMessage('siteBypassAdded') || `Bypassing proxy for ${hostname}`,
        'success'
      )
    } else {
      toastStore.show(
        I18nService.getMessage('bypassNotSupported') ||
          'Bypass is only available for manual proxy mode',
        'warning'
      )
    }
  } catch {
    toastStore.show(
      I18nService.getMessage('bypassFailed') || 'Failed to bypass proxy for this site',
      'error'
    )
  }
}
</script>

<div class="w-96 bg-white dark:bg-slate-900 flex flex-col">
  <!-- Header -->
  <header
    class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700"
  >
    <h1 class="text-base font-bold text-primary dark:text-primary-light">
      {I18nService.getMessage('extName')}
    </h1>

    <div class="flex items-center gap-1">
      <Tooltip text="Add new proxy" position="bottom">
        <Button minimal color="primary" onclick={quickAddProxy} data-testid="add-proxy-btn">
          {#snippet icon()}
            <Plus size={18} />
          {/snippet}
          <Text classes="sr-only">Add new proxy</Text>
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
  <main class="overflow-y-auto flex-1 px-5 pt-4 pb-4">
    {#if hasProxies}
      <ScriptList pageType="POPUP" title="" viewMode="list" />
    {:else}
      <EmptyState
        title={I18nService.getMessage('noProxiesYet') || 'No proxy configurations yet'}
        description={I18nService.getMessage('noProxiesDescription') ||
          'Get started by creating your first proxy configuration to control how your browser connects to the internet.'}
        actionLabel={I18nService.getMessage('getStarted') || 'Get Started'}
        onAction={openSettings}
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
            <Text size="sm" weight="medium" classes="text-slate-600 dark:text-slate-400">
              {I18nService.getMessage('statusDisconnected')}
            </Text>
          {/if}
        </div>

        <!-- Always reserve space for the button to prevent layout shift -->
        <div class="shrink-0 flex items-center gap-1.5">
          {#if activeProxy}
            <Tooltip
              text={I18nService.getMessage('bypassCurrentSite') || 'Bypass proxy for this site'}
              position="top"
            >
              <Button size="sm" color="secondary" minimal onclick={bypassCurrentSite}>
                {#snippet icon()}
                  <ShieldOff size={14} />
                {/snippet}
              </Button>
            </Tooltip>
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
/* Custom scrollbar styles */
main {
  max-height: calc(400px - 4rem);
  scrollbar-width: thin;
  scrollbar-color: var(--color-slate-300) var(--color-slate-100);
}

main::-webkit-scrollbar {
  width: 0.375rem;
}

main::-webkit-scrollbar-track {
  background-color: var(--color-slate-100);
}

@media (prefers-color-scheme: dark) {
  main {
    scrollbar-color: var(--color-slate-600) var(--color-slate-700);
  }

  main::-webkit-scrollbar-track {
    background-color: var(--color-slate-700);
  }

  main::-webkit-scrollbar-thumb {
    background-color: var(--color-slate-600);
  }

  main::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-slate-500);
  }
}

main::-webkit-scrollbar-thumb {
  background-color: var(--color-slate-300);
  border-radius: 9999px;
}

main::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-slate-400);
}
</style>
