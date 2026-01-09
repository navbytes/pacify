<script lang="ts">
import type { ComponentType } from 'svelte'
import { emptyStatePatterns, flexPatterns } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Globe, Plus } from '@/utils/icons'
import Button from './Button.svelte'
import Text from './Text.svelte'

interface Props {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  icon?: ComponentType
  iconSize?: number
  compact?: boolean
}

let {
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon = Globe,
  iconSize = 64,
  compact = false,
}: Props = $props()

let Icon = $derived(icon)
</script>

<div class={cn(emptyStatePatterns.container, compact ? 'py-8' : 'py-12')}>
  <div class={cn(emptyStatePatterns.icon, compact ? 'mb-4' : 'mb-6')}>
    <Icon size={iconSize} class="text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
  </div>

  <Text as="h3" size="xl" weight="semibold" classes="mb-2">{title}</Text>

  <Text as="p" color="muted" classes={cn('max-w-md', compact ? 'mb-4' : 'mb-6')}>
    {description}
  </Text>

  {#if actionLabel && onAction}
    <div class={cn(flexPatterns.centerVertical, 'gap-3')}>
      <Button color="primary" onclick={onAction}>
        {#snippet icon()}
          <Plus size={18} />
        {/snippet}
        {actionLabel}
      </Button>

      {#if secondaryActionLabel && onSecondaryAction}
        <Button color="secondary" onclick={onSecondaryAction}>{secondaryActionLabel}</Button>
      {/if}
    </div>
  {/if}
</div>
