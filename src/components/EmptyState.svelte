<script lang="ts">
  import { Globe, Plus } from 'lucide-svelte'
  import type { ComponentType } from 'svelte'
  import Button from './Button.svelte'
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'

  interface Props {
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    icon?: ComponentType
  }

  let { title, description, actionLabel, onAction, icon = Globe }: Props = $props()

  let Icon = $derived(icon)
</script>

<FlexGroup
  direction="vertical"
  alignItems="center"
  justifyContent="center"
  classes="py-12 px-4 text-center"
>
  <div class="mb-6 opacity-50">
    <Icon size={64} class="text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
  </div>

  <Text as="h3" size="xl" weight="semibold" classes="mb-2">
    {title}
  </Text>

  <Text as="p" color="muted" classes="mb-6 max-w-md">
    {description}
  </Text>

  {#if actionLabel && onAction}
    <Button color="primary" onclick={onAction}>
      {#snippet icon()}<Plus size={18} />{/snippet}
      {actionLabel}
    </Button>
  {/if}
</FlexGroup>
