<script lang="ts">
import type { ComponentType, Snippet } from 'svelte'
import Text from '@/components/Text.svelte'
import {
  flexPatterns,
  sectionHeaderBadgeVariants,
  sectionHeaderBorderVariants,
  sectionHeaderIconVariants,
} from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { colors } from '@/utils/theme'

interface Props {
  icon: ComponentType
  title: string
  description?: string
  count?: number
  iconColor: 'purple' | 'slate'
  hideBorder?: boolean
  rightContent?: Snippet
}

let {
  icon: Icon,
  title,
  description,
  count,
  iconColor,
  hideBorder = false,
  rightContent,
}: Props = $props()
</script>

<div
  class={cn(
    'mb-6 pb-2',
    flexPatterns.between,
    'gap-4',
    !hideBorder && `border-b ${sectionHeaderBorderVariants({ iconColor })}`
  )}
>
  <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-1 min-w-0')}>
    <div class={sectionHeaderIconVariants({ iconColor })}>
      <Icon size={16} class="text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-wrap')}>
        <h2 class={cn('text-lg font-semibold tracking-tight', colors.text.default)}>{title}</h2>
        {#if count}
          <span class={sectionHeaderBadgeVariants({ iconColor })}> {count} </span>
        {/if}
      </div>
      {#if description}
        <Text as="p" size="xs" color="muted" classes="mt-0.5">{description}</Text>
      {/if}
    </div>
  </div>

  {#if rightContent}
    <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-shrink-0')}>
      {@render rightContent()}
    </div>
  {/if}
</div>
