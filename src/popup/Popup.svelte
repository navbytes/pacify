<script lang="ts">
  import ScriptList from '@/components/ScriptList.svelte'
  import { ChromeService } from '@/services/chrome'
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { Settings, Power } from 'lucide-svelte'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '@/components/Text.svelte'

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

  async function disableAllProxies() {
    if (activeProxy) {
      await settingsStore.setProxy(activeProxy.id!, false)
    }
  }
</script>

<div class="w-96 min-h-[480px] bg-white dark:bg-slate-900 flex flex-col">
  <!-- Header -->
  <header
    class="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-200 dark:border-slate-700"
  >
    <h1 class="text-lg font-bold text-primary dark:text-primary-light">
      {I18nService.getMessage('extName')}
    </h1>

    <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
      {#if activeProxy}
        <Button size="sm" color="secondary" onclick={disableAllProxies}>
          {#snippet icon()}<Power size={14} />{/snippet}
          OFF
        </Button>
      {/if}
      <Button minimal color="secondary" onclick={openSettings}>
        {#snippet icon()}<Settings />{/snippet}
        <Text classes="sr-only">{I18nService.getMessage('settings')}</Text>
      </Button>
    </FlexGroup>
  </header>

  <!-- Connection Status Banner -->
  {#if hasProxies}
    <div class="px-5 pt-4 pb-2">
      {#if activeProxy}
        <div
          class="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-3.5"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Text size="sm" weight="medium" classes="text-green-800 dark:text-green-200">
              {I18nService.getMessage('statusConnected')}: {activeProxy.name}
            </Text>
          </div>
        </div>
      {:else}
        <div
          class="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3.5"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            <Text size="sm" weight="medium" color="muted">
              {I18nService.getMessage('statusDisconnected')}
            </Text>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Main Content -->
  <main class="overflow-y-auto flex-1 px-5 py-4">
    <ScriptList pageType="POPUP" title="" />
  </main>

  <!-- Footer -->
  {#if hasProxies}
    <footer class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 text-xs text-center">
      <Text as="p" classes="text-slate-500 dark:text-slate-400">
        {activeProxy
          ? I18nService.getMessage('footerActiveProxy')
          : I18nService.getMessage('footerSelectProxy')}
      </Text>
    </footer>
  {/if}
</div>

<style lang="postcss">
  /* Custom scrollbar styles */
  main {
    max-height: calc(400px - 6rem);
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
