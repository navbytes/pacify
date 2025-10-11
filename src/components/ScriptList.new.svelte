<script lang="ts">
  /**
   * ScriptList - Migrated to Design System
   *
   * This is a proof-of-concept migration showing how the new design system
   * replaces inline Tailwind classes with semantic component props.
   */

  import { settingsStore } from '@/stores/settingsStore'
  import ScriptItem from './ScriptItem.svelte'
  import type { ListViewType, ProxyConfig } from '@/interfaces'
  import { I18nService } from '@/services/i18n/i18nService'
  import { Box, Flex } from '@/design-system'

  // Note: settingsStore.init() is called by parent component (Popup.svelte)
  // No need to initialize again here to avoid duplicate storage reads
  let proxyConfigs = $derived($settingsStore.proxyConfigs ?? [])

  interface Props {
    pageType?: ListViewType
    title: string
    onScriptEdit?: (scriptId: string) => void
    dragType?: string
  }

  let { pageType = 'POPUP', title, onScriptEdit, dragType = $bindable() }: Props = $props()

  function openEditor(scriptId?: string) {
    if (!scriptId || !onScriptEdit) return
    onScriptEdit(scriptId)
  }

  // Fix: Use $derived to create a derived array instead of a function
  let displayProxyConfigs = $derived<ProxyConfig[]>(
    pageType === 'QUICK_SWITCH' ? proxyConfigs.filter((script) => script.quickSwitch) : proxyConfigs
  )
</script>

<!-- BEFORE: <section class="w-full"> -->
<Box as="section" width="w-full">
  {#if title !== ''}
    <!-- BEFORE: <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"> -->
    <Box as="h2" mb="md" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </Box>
  {/if}

  {#if pageType === 'QUICK_SWITCH'}
    <!-- BEFORE: <div class="space-y-1 mb-6"> -->
    <Box mb="lg" className="space-y-1">
      <Box as="p" className="text-sm text-slate-600 dark:text-slate-400">
        {I18nService.getMessage('dragScriptsHere')}
      </Box>
    </Box>
  {/if}

  {#if displayProxyConfigs.length > 0}
    <!-- BEFORE: Complex conditional class strings -->
    <!-- AFTER: Use Flex for POPUP, Box with grid for OPTIONS/QUICK_SWITCH -->
    {#if pageType === 'POPUP'}
      <Flex direction="column" gap="md">
        {#each displayProxyConfigs as proxy (proxy.id)}
          <ScriptItem {proxy} {pageType} bind:dragType onScriptEdit={() => openEditor(proxy.id)} />
        {/each}
      </Flex>
    {:else}
      <Box className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {#each displayProxyConfigs as proxy (proxy.id)}
          <ScriptItem {proxy} {pageType} bind:dragType onScriptEdit={() => openEditor(proxy.id)} />
        {/each}
      </Box>
    {/if}
  {:else}
    <!-- BEFORE: <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 ${pageType === 'POPUP' ? 'p-4' : 'p-8'}"> -->
    <Box
      borderRadius="lg"
      border
      borderWidth="2"
      borderStyle="dashed"
      borderColor="slate-300"
      p={pageType === 'POPUP' ? 'md' : 'xl'}
    >
      <!-- BEFORE: <div class="flex flex-col items-center justify-center text-center"> -->
      <Flex direction="column" align="center" justify="center" className="text-center">
        <Box mb="xs">
          <svg
            class="h-8 w-8 text-slate-400 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z"
            />
          </svg>
        </Box>

        {#if pageType === 'POPUP'}
          <Box as="p" className="text-sm text-slate-600 dark:text-slate-400">
            {I18nService.getMessage('noScriptsAvailable')}
          </Box>
        {:else if pageType === 'QUICK_SWITCH'}
          <Box as="p" className="text-sm text-slate-600 dark:text-slate-400">
            {I18nService.getMessage('noQuickSwitchScripts')}
          </Box>
        {:else}
          <Box as="p" className="text-sm text-slate-600 dark:text-slate-400">
            {I18nService.getMessage('noScriptsAvailableOptions')}
          </Box>
        {/if}
      </Flex>
    </Box>
  {/if}
</Box>

<style lang="postcss">
  .grid > :global(*) {
    @apply transition-all duration-200;
  }
</style>
