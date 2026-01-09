<script lang="ts">
import type { Snippet } from 'svelte'
import { tooltipArrowVariants, tooltipVariants } from '@/utils/classPatterns'

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
    <div role="tooltip" class={tooltipVariants({ position })}>
      {text}
      <div class={tooltipArrowVariants({ position })}></div>
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
