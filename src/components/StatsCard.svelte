<script lang="ts">
  import type { ComponentType } from 'svelte'
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'

  interface Props {
    title: string
    value: string | number
    icon?: ComponentType
    description?: string
    color?: 'blue' | 'green' | 'purple' | 'orange'
  }

  let { title, value, icon, description, color = 'blue' }: Props = $props()

  let Icon = $derived(icon)

  let colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }
</script>

<div
  class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700"
>
  <FlexGroup alignItems="start" justifyContent="between">
    <div class="flex-1">
      <Text as="p" size="sm" weight="medium" color="muted" classes="mb-1">
        {title}
      </Text>
      <Text as="p" size="2xl" weight="bold">
        {value}
      </Text>
      {#if description}
        <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-500 mt-1">
          {description}
        </Text>
      {/if}
    </div>
    {#if Icon}
      <div class="rounded-lg p-2 {colors[color]}">
        <Icon size={24} strokeWidth={2} />
      </div>
    {/if}
  </FlexGroup>
</div>
