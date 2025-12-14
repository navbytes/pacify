<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    text: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
    children?: Snippet
  }

  let { text, position = 'top', delay = 300, children }: Props = $props()

  let showTooltip = $state(false)
  let timeout: ReturnType<typeof setTimeout> | null = null

  function handleMouseEnter() {
    timeout = setTimeout(() => {
      showTooltip = true
    }, delay)
  }

  function handleMouseLeave() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    showTooltip = false
  }

  let positionClasses = $derived(
    {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }[position]
  )

  let arrowClasses = $derived(
    {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700',
      right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700',
    }[position]
  )
</script>

<div
  role="presentation"
  class="relative inline-block"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocus={handleMouseEnter}
  onblur={handleMouseLeave}
>
  {@render children?.()}

  {#if showTooltip && text}
    <div
      role="tooltip"
      class="absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap {positionClasses} animate-fade-in"
    >
      {text}
      <div class="absolute w-0 h-0 border-4 border-transparent {arrowClasses}"></div>
    </div>
  {/if}
</div>

<style lang="postcss">
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
</style>
