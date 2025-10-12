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
    valueColor?: 'default' | 'success' | 'muted'
    size?: 'normal' | 'large'
  }

  let {
    title,
    value,
    icon,
    description,
    color = 'blue',
    valueColor = 'default',
    size = 'normal',
  }: Props = $props()

  let Icon = $derived(icon)

  let colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  let valueColorClasses = {
    default: 'text-slate-900 dark:text-slate-100',
    success: 'text-green-600 dark:text-green-400',
    muted: 'text-slate-400 dark:text-slate-500',
  }

  let valueSize = $derived(size === 'large' ? 'text-3xl' : 'text-2xl')
</script>

<div
  class="group bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
>
  <FlexGroup alignItems="start" justifyContent="between">
    <div class="flex-1">
      <Text as="p" size="sm" weight="medium" color="muted" classes="mb-1">
        {title}
      </Text>
      <Text as="p" weight="bold" classes="{valueSize} {valueColorClasses[valueColor]}">
        {value}
      </Text>
      {#if description}
        <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-500 mt-1">
          {description}
        </Text>
      {/if}
    </div>
    {#if Icon}
      <div
        class="rounded-lg p-2 {colors[
          color
        ]} group-hover:scale-110 transition-transform duration-200"
      >
        <Icon size={24} strokeWidth={2} />
      </div>
    {/if}
  </FlexGroup>
</div>
