<script lang="ts">
import type { ComponentType } from 'svelte'
import Text from './Text.svelte'

interface Props {
  /**
   * The icon component to display (from lucide-svelte)
   */
  icon: ComponentType
  /**
   * The icon size in pixels
   */
  iconSize?: number
  /**
   * The icon color class (Tailwind)
   */
  iconColor?: string
  /**
   * The section title text
   */
  title: string
  /**
   * Optional description text below the title
   */
  description?: string
  /**
   * Additional CSS classes for the container
   */
  classes?: string
}

let {
  icon: Icon,
  iconSize = 24,
  iconColor = 'text-blue-600 dark:text-blue-400',
  title,
  description,
  classes = '',
}: Props = $props()
</script>

<div class={classes}>
  <div class="flex items-center gap-2 mb-2">
    <Icon size={iconSize} class={iconColor} />
    <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
  </div>
  {#if description}
    <Text as="p" size="sm" color="muted" classes="mt-1 ml-8">{description}</Text>
  {/if}
</div>
