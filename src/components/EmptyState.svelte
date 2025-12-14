<script lang="ts">
  import { Globe, Plus } from '@/utils/icons'
  import type { ComponentType } from 'svelte'
  import Button from './Button.svelte'
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'

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

<FlexGroup
  direction="vertical"
  alignItems="center"
  justifyContent="center"
  classes={compact ? 'py-8 px-4 text-center' : 'py-12 px-4 text-center'}
>
  <div class={compact ? 'mb-4 opacity-50' : 'mb-6 opacity-50'}>
    <Icon size={iconSize} class="text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
  </div>

  <Text as="h3" size="xl" weight="semibold" classes="mb-2">
    {title}
  </Text>

  <Text as="p" color="muted" classes={compact ? 'mb-4 max-w-md' : 'mb-6 max-w-md'}>
    {description}
  </Text>

  {#if actionLabel && onAction}
    <div class="flex items-center gap-3">
      <Button color="primary" onclick={onAction}>
        {#snippet icon()}<Plus size={18} />{/snippet}
        {actionLabel}
      </Button>

      {#if secondaryActionLabel && onSecondaryAction}
        <Button color="secondary" onclick={onSecondaryAction}>
          {secondaryActionLabel}
        </Button>
      {/if}
    </div>
  {/if}
</FlexGroup>
