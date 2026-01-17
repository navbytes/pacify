<script lang="ts">
import type { Snippet } from 'svelte'
import { buttonVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

type GradientColor = 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'cyan'

interface Props {
  classes?: string
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'ghost'
  variant?: 'solid' | 'minimal' | 'gradient'
  gradient?: GradientColor
  minimal?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: Snippet
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onclick?: (event: MouseEvent) => void
  children?: Snippet
  'aria-label'?: string
  'aria-selected'?: 'true' | 'false'
  'data-testid'?: string
  role?: string
}

const {
  classes = '',
  color = 'primary',
  variant = undefined,
  gradient = undefined,
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
const isGradient = $derived(computedVariant === 'gradient')

// Determine gradient color - use gradient prop if provided, otherwise derive from color
function getGradientColor(): GradientColor {
  if (gradient) return gradient
  switch (color) {
    case 'primary':
      return 'blue'
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'info':
      return 'cyan'
    default:
      return 'blue'
  }
}
const gradientColor = $derived<GradientColor>(getGradientColor())

// Gradient configurations
const gradientConfigs: Record<
  GradientColor,
  { bg: string; hover: string; shadow: string; ring: string }
> = {
  blue: {
    bg: 'from-blue-600 via-purple-600 to-pink-600',
    hover: 'from-blue-500 via-purple-500 to-pink-500',
    shadow: 'shadow-blue-500/25 hover:shadow-blue-500/30',
    ring: 'focus-visible:ring-blue-500/50',
  },
  purple: {
    bg: 'from-violet-600 via-purple-600 to-fuchsia-600',
    hover: 'from-violet-500 via-purple-500 to-fuchsia-500',
    shadow: 'shadow-purple-500/25 hover:shadow-purple-500/30',
    ring: 'focus-visible:ring-purple-500/50',
  },
  orange: {
    bg: 'from-orange-500 via-amber-500 to-orange-500',
    hover: 'from-orange-400 via-amber-400 to-orange-400',
    shadow: 'shadow-orange-500/25 hover:shadow-orange-500/30',
    ring: 'focus-visible:ring-orange-500/50',
  },
  green: {
    bg: 'from-green-500 via-emerald-500 to-teal-500',
    hover: 'from-green-400 via-emerald-400 to-teal-400',
    shadow: 'shadow-green-500/25 hover:shadow-green-500/30',
    ring: 'focus-visible:ring-green-500/50',
  },
  red: {
    bg: 'from-red-500 to-rose-500',
    hover: 'from-red-400 to-rose-400',
    shadow: 'shadow-red-500/25 hover:shadow-red-500/30',
    ring: 'focus-visible:ring-red-500/50',
  },
  cyan: {
    bg: 'from-cyan-500 via-blue-500 to-indigo-500',
    hover: 'from-cyan-400 via-blue-400 to-indigo-400',
    shadow: 'shadow-cyan-500/25 hover:shadow-cyan-500/30',
    ring: 'focus-visible:ring-cyan-500/50',
  },
}

// Get current gradient config
const currentGradient = $derived(gradientConfigs[gradientColor])

// Use buttonVariants with CVA for non-gradient buttons
const buttonClasses = $derived(
  isGradient
    ? cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 cursor-pointer',
        'focus:outline-none focus-visible:ring-4',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'relative overflow-hidden text-white rounded-xl',
        size === 'sm' && 'py-2 px-3 text-sm min-h-11',
        size === 'md' && 'py-2.5 px-5 min-h-11',
        size === 'lg' && 'py-3 px-6 text-lg min-h-11',
        'shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
        currentGradient.shadow,
        currentGradient.ring,
        fullWidth && 'w-full'
      )
    : buttonVariants({
        intent: color,
        variant: computedVariant as 'solid' | 'minimal',
        size: size,
        fullWidth: fullWidth,
      })
)

// Combine with custom classes
const combinedClasses = $derived(
  cn(
    buttonClasses,
    // Add icon-only button sizing for minimal buttons without children
    minimal && !children && 'min-w-11',
    classes
  )
)
</script>

<button
  {type}
  class={cn(combinedClasses, 'group')}
  {disabled}
  onclick={(e) => {
    if (onclick) onclick(e)
  }}
  aria-label={ariaLabel}
  aria-selected={ariaSelected}
  data-testid={dataTestId}
  {role}
>
  {#if isGradient}
    <!-- Gradient background layer -->
    <div
      class={cn(
        'absolute inset-0 bg-linear-to-r transition-all duration-300 group-hover:scale-105',
        currentGradient.bg
      )}
    ></div>
    <div
      class={cn(
        'absolute inset-0 bg-linear-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        currentGradient.hover
      )}
    ></div>

    <!-- Shine effect -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div
        class="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
      ></div>
    </div>

    <!-- Content -->
    <span class="relative flex items-center gap-2">
      {#if icon}
        <span class="shrink-0"> {@render icon()} </span>
      {/if}
      {@render children?.()}
    </span>
  {:else}
    {#if icon}
      <span class="shrink-0"> {@render icon()} </span>
    {/if}
    {@render children?.()}
  {/if}
</button>
