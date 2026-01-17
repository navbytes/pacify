<script lang="ts">
import type { Snippet } from 'svelte'
import { flexGroupVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

interface Props {
  classes?: string
  direction?: 'horizontal' | 'vertical'
  childrenGap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  children?: Snippet
  role?: string
}

const {
  classes = '',
  direction = 'horizontal',
  childrenGap = 'md',
  alignItems = 'center',
  justifyContent = 'start',
  children,
  role,
}: Props = $props()

const flexGroupClasses = $derived(
  cn(
    flexGroupVariants({
      direction,
      childrenGap,
      alignItems,
      justifyContent,
    }),
    classes
  )
)
</script>

<div class={flexGroupClasses} {role}>{@render children?.()}</div>
