<script lang="ts">
import type { Snippet } from 'svelte'
import { cardVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

interface Props {
  classes?: string
  variant?: 'default' | 'elevated' | 'interactive' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  children?: Snippet
}

let { classes = '', variant = 'default', padding = 'lg', children }: Props = $props()

const cardClasses = $derived(cn(cardVariants({ variant, padding }), classes))
</script>

<div class={cardClasses}>{@render children?.()}</div>
