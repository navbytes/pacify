<script lang="ts">
  import ScriptList from '@/components/ScriptList.svelte'
  import { ChromeService } from '@/services/chrome'
  import { onMount } from 'svelte'
  import { settingsStore } from '@/stores/settingsStore'
  import { Settings } from 'lucide-svelte'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  // Initialize settings on mount
  onMount(() => {
    settingsStore.init()
  })

  function openSettings() {
    ChromeService.openOptionsPage()
  }
</script>

<div
  class="w-80 min-h-[400px] bg-white dark:bg-gray-800 py-4 px-2 flex flex-col"
>
  <header
    class="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3"
  >
    <h1 class="text-lg font-bold text-primary dark:text-primary-light">
      {I18nService.getMessage('extName')}
    </h1>

    <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
      <Button minimal color="secondary" on:click={openSettings}
        ><Settings /><span class="sr-only"
          >{I18nService.getMessage('settings')}</span
        ></Button
      >
    </FlexGroup>
  </header>

  <main class="overflow-y-auto flex-1">
    <ScriptList pageType="POPUP" title="" />
  </main>

  <!-- Optional: Add a footer with quick actions or status -->
  <footer
    class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
  >
    <p class="text-center">{I18nService.getMessage('toggleProxyHint')}</p>
  </footer>
</div>

<style lang="postcss">
  /* Custom scrollbar styles */
  main {
    @apply max-h-[calc(400px-theme(spacing.16))];
    scrollbar-width: thin;
    scrollbar-color: theme('colors.gray.300') theme('colors.gray.100');
  }

  main::-webkit-scrollbar {
    @apply w-1.5;
  }

  main::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-700;
  }

  main::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded-full;
  }

  /* Optional: Hover effect for scrollbar */
  main::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
  }
</style>
