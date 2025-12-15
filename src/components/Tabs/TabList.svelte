<script lang="ts">
  import { getContext } from 'svelte'
  import type { TabsContext } from './types'
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()

  const context = getContext<TabsContext>('tabs')
  if (!context) {
    throw new Error('TabList must be used within a Tabs component')
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.currentTarget as HTMLElement
    const tabButtons = Array.from(
      target?.querySelectorAll('[role="tab"]:not([disabled])') || []
    ) as HTMLElement[]

    if (tabButtons.length === 0) return

    const currentIndex = tabButtons.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')

    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = tabButtons.length - 1
        break
      default:
        return
    }

    const nextTab = tabButtons[nextIndex]
    if (nextTab) {
      nextTab.focus()
      nextTab.click()
    }
  }
</script>

<div
  role="tablist"
  tabindex="0"
  class="tab-list"
  onkeydown={handleKeydown}
  aria-label="Options tabs"
>
  {@render children()}
</div>

<style lang="postcss">
  @import 'tailwindcss' reference;

  .tab-list {
    @apply flex items-center gap-0;
    @apply overflow-x-auto;
    @apply mb-0;
  }

  /* Custom scrollbar for tab list */
  .tab-list::-webkit-scrollbar {
    height: 4px;
  }

  .tab-list::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .tab-list::-webkit-scrollbar-thumb {
    @apply bg-slate-300 rounded;
  }

  /* Dark mode for scrollbar thumb */
  .dark .tab-list::-webkit-scrollbar-thumb {
    @apply bg-slate-600;
  }

  /* Remove border for pill and button variants */
  :global([data-variant='pills']) .tab-list {
    @apply border-b-0 gap-2;
  }

  /* Button variant specific styling */
  :global([data-variant='buttons']) .tab-list {
    @apply border-b-0 gap-1;
    @apply bg-slate-100 p-1 rounded-lg inline-flex;
  }

  /* Dark mode for button variant */
  :global(.dark [data-variant='buttons']) .tab-list {
    @apply bg-slate-800/50;
  }

  /* Mobile: Make tabs scrollable */
  @media (max-width: 640px) {
    .tab-list {
      @apply -mx-4 px-4;
    }
  }
</style>
