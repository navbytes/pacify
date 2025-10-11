<script lang="ts">
  import { setContext } from 'svelte'
  import type { TabsContext } from './types'
  import type { Snippet } from 'svelte'

  interface Props {
    defaultTab?: string
    activeTab?: string
    variant?: 'underline' | 'pills' | 'buttons'
    onChange?: (tabId: string) => void
    children: Snippet
  }

  let {
    defaultTab = '',
    activeTab = $bindable(defaultTab),
    variant = 'underline',
    onChange,
    children,
  }: Props = $props()

  let registeredTabs = $state<Set<string>>(new Set())

  // Initialize activeTab with first registered tab if not set
  $effect(() => {
    if (!activeTab && registeredTabs.size > 0) {
      activeTab = Array.from(registeredTabs)[0]
    }
  })

  function registerTab(id: string) {
    registeredTabs.add(id)
    registeredTabs = new Set(registeredTabs) // Trigger reactivity
  }

  function unregisterTab(id: string) {
    registeredTabs.delete(id)
    registeredTabs = new Set(registeredTabs)
  }

  function setActiveTab(id: string) {
    if (registeredTabs.has(id)) {
      activeTab = id
      onChange?.(id)
    }
  }

  function isTabActive(id: string): boolean {
    return activeTab === id
  }

  // Set context for child components
  const context: TabsContext = {
    get activeTab() {
      return activeTab
    },
    registerTab,
    unregisterTab,
    setActiveTab,
    isTabActive,
  }

  setContext<TabsContext>('tabs', context)
</script>

<div class="tabs-container" data-variant={variant}>
  {@render children()}
</div>

<style lang="postcss">
  @import 'tailwindcss' reference;

  .tabs-container {
    @apply flex flex-col w-full;
  }
</style>
