<script lang="ts">
import type { ComponentType } from 'svelte'
import { iconButtonVariants } from '@/utils/classPatterns'
import Tooltip from './Tooltip.svelte'

interface Props {
  icon: ComponentType
  label: string
  active?: boolean
  onclick: () => void
  size?: number
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  testId?: string
}

let {
  icon: Icon,
  label,
  active = false,
  onclick,
  size = 18,
  tooltipPosition = 'bottom',
  testId,
}: Props = $props()
</script>

<Tooltip text={label} position={tooltipPosition}>
  <button
    type="button"
    {onclick}
    class={iconButtonVariants({ active })}
    aria-label={label}
    data-testid={testId}
  >
    <Icon {size} />
  </button>
</Tooltip>
