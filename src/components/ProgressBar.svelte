<script lang="ts">
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import {
    progressBarVariants,
    progressBarFillVariants,
    type VariantProps,
  } from '@/utils/classPatterns'

  type ProgressBarVariant = VariantProps<typeof progressBarVariants>
  type ProgressBarFillVariant = VariantProps<typeof progressBarFillVariants>

  interface Props {
    value: number
    max: number
    label?: string
    showPercentage?: boolean
    size?: ProgressBarVariant['size']
  }

  let { value, max, label, showPercentage = true, size = 'md' }: Props = $props()

  let percentage = $derived(Math.min((value / max) * 100, 100))

  // Determine color variant based on usage percentage
  let percentageVariant = $derived<ProgressBarFillVariant['percentage']>(
    percentage < 50 ? 'low' : percentage < 80 ? 'medium' : 'high'
  )
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

  <div class={progressBarVariants({ size })}>
    <div
      class={progressBarFillVariants({ percentage: percentageVariant })}
      style="width: {percentage}%"
    ></div>
  </div>
</div>
