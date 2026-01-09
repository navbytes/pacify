<script lang="ts">
import { buttonVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

interface Props {
  classes?: string
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'ghost'
  variant?: 'solid' | 'minimal'
  minimal?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: () => any
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onclick?: (event: MouseEvent) => void
  children?: () => any
  'aria-label'?: string
  'aria-selected'?: 'true' | 'false'
  'data-testid'?: string
  role?: string
}

const {
  classes = '',
  color = 'primary',
  variant = undefined,
  minimal = false,
  size = 'md',
  fullWidth = false,
  icon = undefined,
  disabled = false,
  type = 'button',
  onclick = undefined,
  children = undefined,
  'aria-label': ariaLabel,
  'aria-selected': ariaSelected,
  'data-testid': dataTestId,
  role,
}: Props = $props()

// Support both `minimal` prop and `variant` prop for backwards compatibility
const computedVariant = $derived(variant ?? (minimal ? 'minimal' : 'solid'))

// Use buttonVariants with CVA
const buttonClasses = $derived(
  buttonVariants({
    intent: color,
    variant: computedVariant,
    size: size,
    fullWidth: fullWidth,
  })
)

// Combine with custom classes
const combinedClasses = $derived(
  cn(
    buttonClasses,
    // Add icon-only button sizing for minimal buttons without children
    minimal && !children && 'min-w-[44px]',
    classes
  )
)
</script>

<button
  {type}
  class={combinedClasses}
  {disabled}
  onclick={(e) => {
    if (onclick) onclick(e)
  }}
  aria-label={ariaLabel}
  aria-selected={ariaSelected}
  data-testid={dataTestId}
  {role}
>
  {#if icon}
    <span class="flex-shrink-0"> {@render icon()} </span>
  {/if}
  {@render children?.()}
</button>
