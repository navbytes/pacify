<script lang="ts">
  import type { ComponentType } from 'svelte'
  import Text from '@/components/Text.svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import { CircleQuestionMark } from '@/utils/icons'

  interface Props {
    icon: ComponentType
    title: string
    description?: string
    count: number
    iconColor: 'purple' | 'slate'
    // Optional toggle functionality
    showToggle?: boolean
    toggleChecked?: boolean
    toggleTooltip?: string
    ontoggle?: (checked: boolean) => void
  }

  let {
    icon: Icon,
    title,
    description,
    count,
    iconColor,
    showToggle = false,
    toggleChecked = false,
    toggleTooltip,
    ontoggle,
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
  class="mb-6 pb-2 border-b {borderColorClasses[iconColor]} flex items-center justify-between gap-4"
>
  <div class="flex items-center gap-2 flex-1 min-w-0">
    <div
      class="flex-shrink-0 w-8 h-8 {iconColorClasses[
        iconColor
      ]} rounded-lg flex items-center justify-center shadow-md"
    >
      <Icon size={16} class="text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h2>
        <span
          class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border {badgeColorClasses[
            iconColor
          ]}"
        >
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

  {#if showToggle}
    <div class="flex items-center gap-2 flex-shrink-0">
      {#if toggleTooltip}
        <div class="flex items-center min-h-[44px]">
          <Tooltip text={toggleTooltip} position="left">
            <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
          </Tooltip>
        </div>
      {/if}
      <ToggleSwitch
        id="sectionToggle-{title.replace(/\s+/g, '-').toLowerCase()}"
        checked={toggleChecked}
        onchange={ontoggle}
        aria-label="Toggle {title}"
      />
    </div>
  {/if}
</div>
