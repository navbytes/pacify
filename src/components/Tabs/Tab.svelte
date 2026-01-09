<script lang="ts">
import type { ComponentType, Snippet } from 'svelte'
import { getContext, onDestroy, onMount } from 'svelte'
import { tabBadgeVariants, tabIconVariants, tabVariants } from '@/utils/classPatterns'
import type { TabsContext } from './types'

interface Props {
  id: string
  icon?: ComponentType
  disabled?: boolean
  badge?: number | string
  children: Snippet
}

let { id, icon, disabled = false, badge, children }: Props = $props()

const context = getContext<TabsContext>('tabs')
if (!context) {
  throw new Error('Tab must be used within a Tabs component')
}

let isActive = $derived(context.isTabActive(id))

onMount(() => {
  context.registerTab(id)
})

onDestroy(() => {
  context.unregisterTab(id)
})

function handleClick() {
  if (!disabled) {
    context.setActiveTab(id)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<button
  type="button"
  role="tab"
  aria-selected={isActive}
  aria-controls={`tabpanel-${id}`}
  data-testid={`tabpanel-${id}`}
  id={`tab-${id}`}
  tabindex={isActive ? 0 : -1}
  {disabled}
  class={tabVariants({ active: isActive, disabled })}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#if icon}
    {@const Icon = icon}
    <span class={tabIconVariants({ active: isActive })}>
      <Icon size={18} />
    </span>
  {/if}
  <span class="flex items-center"> {@render children()} </span>
  {#if badge !== undefined}
    <span class={tabBadgeVariants({ active: isActive })}>{badge}</span>
  {/if}
</button>

<!-- Note: Tab variant styles (pills, buttons) are defined globally in app.css
     to avoid Lightning CSS warnings about :global() syntax -->