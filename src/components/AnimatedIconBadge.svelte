<script lang="ts">
import type { ComponentType } from 'svelte'
import { modalAnimatedIconVariants } from '@/utils/classPatterns'

interface Props {
  icon: ComponentType
  color?: 'blue' | 'purple' | 'teal' | 'orange' | 'green'
  size?: number
  strokeWidth?: number
  iconClass?: string
}

let {
  icon: Icon,
  color = 'blue',
  size = 24,
  strokeWidth = 2.5,
  iconClass = 'text-white',
}: Props = $props()

const iconVariants = $derived(modalAnimatedIconVariants({ color }))
</script>

<div class="relative">
  <div class={iconVariants.glow()}></div>
  <div class={iconVariants.container()}>
    <Icon {size} class={iconClass} {strokeWidth} />
  </div>
</div>
