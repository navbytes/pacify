<script lang="ts">
  import { getContext, onMount, onDestroy } from 'svelte'
  import type { TabsContext } from './types'
  import type { ComponentType, Snippet } from 'svelte'
  import Text from '../Text.svelte'
  import { cn } from '@/utils/cn'

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
  class={cn('tab-button', isActive && 'active', disabled && 'disabled')}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#if icon}
    {@const Icon = icon}
    <Text classes="tab-icon">
      <Icon size={18} />
    </Text>
  {/if}
  <Text classes="tab-label">
    {@render children()}
  </Text>
  {#if badge !== undefined}
    <Text classes="tab-badge">{badge}</Text>
  {/if}
</button>

<style lang="postcss">
  @import 'tailwindcss' reference;

  .tab-button {
    @apply relative flex items-center gap-2.5 px-6 py-3.5;
    @apply text-sm font-medium text-slate-600;
    @apply transition-all duration-200;
    @apply border-b-2 border-transparent;
    @apply hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300;
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2;
    @apply whitespace-nowrap bg-transparent cursor-pointer rounded-t-lg;
  }

  .dark .tab-button {
    @apply text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-600;
  }

  .tab-button.active {
    @apply text-blue-600 bg-blue-50/50 border-blue-600 border-b-4;
  }

  .dark .tab-button.active {
    @apply text-blue-400 bg-blue-950/20 border-blue-400;
  }

  .tab-button.disabled {
    @apply opacity-50 cursor-not-allowed hover:text-slate-500 hover:border-transparent;
  }

  .dark .tab-button.disabled {
    @apply hover:text-slate-400;
  }

  .tab-icon {
    @apply flex items-center justify-center shrink-0 transition-colors duration-200;
  }

  .tab-button.active .tab-icon {
    @apply text-blue-600;
  }

  .dark .tab-button.active .tab-icon {
    @apply text-blue-400;
  }

  .tab-button:not(.active) .tab-icon {
    @apply text-slate-500;
  }

  .tab-button:hover:not(.active) .tab-icon {
    @apply text-slate-700;
  }

  .dark .tab-button:hover:not(.active) .tab-icon {
    @apply text-slate-300;
  }

  .tab-label {
    @apply flex items-center;
  }

  .tab-badge {
    @apply ml-2 px-2 py-0.5 rounded-full text-xs font-semibold;
    @apply bg-blue-100 text-blue-600;
  }

  .dark .tab-badge {
    @apply bg-blue-900 text-blue-300;
  }

  /* Note: Tab variant styles (pills, buttons) are defined globally in app.css
     to avoid Lightning CSS warnings about :global() syntax */
</style>
