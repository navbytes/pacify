<script lang="ts">
  import type { ComponentType, Snippet } from 'svelte'
  import Text from '@/components/Text.svelte'
  import { cn } from '@/utils/cn'
  import { flexPatterns, badgePatterns } from '@/utils/classPatterns'
  import { colors } from '@/utils/theme'

  interface Props {
    icon: ComponentType
    title: string
    description?: string
    count: number
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

  const iconColorClasses = {
    purple:
      'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    slate: 'bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
  }

  const borderColorClasses = {
    purple: 'border-purple-200 dark:border-purple-800',
    slate: 'border-slate-200 dark:border-slate-700',
  }

  const badgeColorClasses = {
    purple:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    slate:
      'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  }
</script>

<div
  class={cn(
    'mb-6 pb-2',
    flexPatterns.between,
    'gap-4',
    !hideBorder && `border-b ${borderColorClasses[iconColor]}`
  )}
>
  <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-1 min-w-0')}>
    <div
      class={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg',
        flexPatterns.center,
        'shadow-md',
        iconColorClasses[iconColor]
      )}
    >
      <Icon size={16} class="text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-wrap')}>
        <h2 class={cn('text-lg font-semibold tracking-tight', colors.text.default)}>
          {title}
        </h2>
        <span class={cn(badgePatterns.base, 'font-semibold border', badgeColorClasses[iconColor])}>
          {count}
        </span>
      </div>
      {#if description}
        <Text as="p" size="xs" color="muted" classes="mt-0.5">
          {description}
        </Text>
      {/if}
    </div>
  </div>

  {#if rightContent}
    <div class={cn(flexPatterns.centerVertical, 'gap-2 flex-shrink-0')}>
      {@render rightContent()}
    </div>
  {/if}
</div>
