<script lang="ts">
  import { getContext, onMount, onDestroy } from 'svelte'
  import type { TabsContext } from './types'
  import type { ComponentType, Snippet } from 'svelte'
  import Text from '../Text.svelte'

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
  id={`tab-${id}`}
  tabindex={isActive ? 0 : -1}
  {disabled}
  class={`
    tab-button
    ${isActive ? 'active' : ''}
    ${disabled ? 'disabled' : ''}
  `}
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
    @apply relative flex items-center gap-2 px-6 py-3;
    @apply text-sm font-medium text-slate-500 dark:text-slate-400;
    @apply transition-all duration-200;
    @apply border-b-2 border-transparent;
    @apply hover:text-slate-900 dark:hover:text-slate-200;
    @apply hover:border-slate-300 dark:hover:border-slate-600;
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2;
    @apply whitespace-nowrap;
    @apply bg-transparent;
    @apply cursor-pointer;
  }

  .tab-button.active {
    @apply text-blue-600 dark:text-blue-400;
    @apply border-blue-600 dark:border-blue-400;
    @apply border-b-4;
  }

  .tab-button.disabled {
    @apply opacity-50 cursor-not-allowed;
    @apply hover:text-slate-500 dark:hover:text-slate-400;
    @apply hover:border-transparent;
  }

  .tab-icon {
    @apply flex items-center justify-center;
    @apply shrink-0;
  }

  .tab-label {
    @apply flex items-center;
  }

  .tab-badge {
    @apply ml-2 px-2 py-0.5 rounded-full;
    @apply text-xs font-semibold;
    @apply bg-blue-100 dark:bg-blue-900;
    @apply text-blue-600 dark:text-blue-300;
  }

  /* Variant: Pills */
  :global([data-variant='pills']) .tab-button {
    @apply border-0 rounded-lg mx-1;
  }

  :global([data-variant='pills']) .tab-button.active {
    @apply bg-blue-100 dark:bg-blue-900;
  }

  /* Variant: Buttons */
  :global([data-variant='buttons']) .tab-button {
    @apply border border-slate-300 dark:border-slate-600;
    @apply rounded-md mx-1;
  }

  :global([data-variant='buttons']) .tab-button.active {
    @apply bg-blue-600 dark:bg-blue-500;
    @apply text-white;
    @apply border-blue-600 dark:border-blue-500;
  }
</style>
