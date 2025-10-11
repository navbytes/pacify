<script lang="ts">
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'

  interface Props {
    value: number
    max: number
    label?: string
    showPercentage?: boolean
    size?: 'sm' | 'md' | 'lg'
  }

  let { value, max, label, showPercentage = true, size = 'md' }: Props = $props()

  let percentage = $derived(Math.min((value / max) * 100, 100))

  // Color based on usage percentage
  let barColor = $derived(
    percentage < 50
      ? 'bg-green-500 dark:bg-green-400'
      : percentage < 80
        ? 'bg-yellow-500 dark:bg-yellow-400'
        : 'bg-red-500 dark:bg-red-400'
  )

  let height = $derived(size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2')
</script>

<div class="w-full">
  {#if label}
    <FlexGroup alignItems="center" justifyContent="between" classes="mb-1">
      <Text size="sm" weight="medium" classes="text-slate-700 dark:text-slate-300">
        {label}
      </Text>
      {#if showPercentage}
        <Text size="sm" color="muted">
          {percentage.toFixed(1)}%
        </Text>
      {/if}
    </FlexGroup>
  {/if}

  <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden {height}">
    <div
      class="h-full rounded-full transition-all duration-500 ease-out {barColor}"
      style="width: {percentage}%"
    ></div>
  </div>
</div>
