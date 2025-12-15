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
  class="tab-list flex items-center gap-0 overflow-x-auto mb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
  onkeydown={handleKeydown}
  aria-label="Options tabs"
>
  {@render children()}
</div>

<style>
  /* Custom scrollbar for tab list */
  .tab-list::-webkit-scrollbar {
    height: 4px;
  }

  .tab-list::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .tab-list::-webkit-scrollbar-thumb {
    background-color: rgb(203 213 225); /* slate-300 */
    border-radius: 0.25rem;
  }

  .dark .tab-list::-webkit-scrollbar-thumb {
    background-color: rgb(71 85 105); /* slate-600 */
  }

  /* Note: Tab list variant styles (pills, buttons) are defined globally in app.css
     to avoid Lightning CSS warnings about :global() syntax */
</style>
