<script lang="ts">
import type { ComponentType } from 'svelte'
import { sectionTitleVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import Text from './Text.svelte'

interface Props {
  /** The icon component to display (from lucide-svelte) */
  icon: ComponentType
  /** The icon size in pixels */
  iconSize?: number
  /** The icon color class (Tailwind) */
  iconColor?: string
  /** The section title text */
  title: string
  /** Optional description text below the title */
  description?: string
  /** Additional CSS classes for the container */
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

const styles = sectionTitleVariants()
</script>

<div class={cn(styles.wrapper(), classes)}>
  <div class={styles.header()}>
    <Icon size={iconSize} class={iconColor} />
    <h3 class={styles.title()}>{title}</h3>
  </div>
  {#if description}
    <Text as="p" size="sm" color="muted" classes={styles.description()}>{description}</Text>
  {/if}
</div>
