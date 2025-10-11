<script lang="ts">
  import { getContext } from 'svelte'
  import type { TabsContext } from './types'
  import type { Snippet } from 'svelte'

  interface Props {
    id: string
    lazy?: boolean
    keepMounted?: boolean
    children: Snippet
  }

  let { id, lazy = false, keepMounted = false, children }: Props = $props()

  const context = getContext<TabsContext>('tabs')
  if (!context) {
    throw new Error('TabPanel must be used within a Tabs component')
  }

  let isActive = $derived(context.isTabActive(id))
  let hasBeenActive = $state(false)

  // Track if panel has ever been active (for lazy loading)
  $effect(() => {
    if (isActive) {
      hasBeenActive = true
    }
  })

  // Determine if content should be rendered
  let shouldRender = $derived(() => {
    if (!lazy) return true // Always render if not lazy
    if (keepMounted && hasBeenActive) return true // Keep mounted after first activation
    return isActive // Only render when active
  })
</script>

{#if shouldRender()}
  <div
    role="tabpanel"
    id={`tabpanel-${id}`}
    aria-labelledby={`tab-${id}`}
    class={`tab-panel ${isActive ? 'active' : 'inactive'}`}
    hidden={!isActive}
  >
    {@render children()}
  </div>
{/if}

<style lang="postcss">
  @import 'tailwindcss' reference;

  .tab-panel {
    @apply w-full;
    @apply transition-opacity duration-200;
  }

  .tab-panel.active {
    @apply opacity-100;
  }

  .tab-panel.inactive {
    @apply opacity-0;
  }

  .tab-panel[hidden] {
    @apply hidden;
  }
</style>
