<script lang="ts">
  type TextElement = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
  type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
  type TextColor =
    | 'primary'
    | 'secondary'
    | 'muted'
    | 'success'
    | 'error'
    | 'info'
    | 'white'
    | 'inherit'

  import type { Snippet } from 'svelte'
  import { cn } from '@/utils/cn'

  interface Props {
    as?: TextElement
    size?: TextSize
    weight?: TextWeight
    color?: TextColor
    classes?: string
    truncate?: boolean
    italic?: boolean
    underline?: boolean
    children?: Snippet
    id?: string
  }

  const {
    as = 'span',
    size = 'base',
    weight = 'normal',
    color = 'primary',
    classes = '',
    truncate = false,
    italic = false,
    underline = false,
    children,
    id = undefined,
  }: Props = $props()

  const sizeClasses: Record<TextSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  }

  const weightClasses: Record<TextWeight, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  const colorClasses: Record<TextColor, string> = {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-700 dark:text-slate-300',
    muted: 'text-slate-600 dark:text-slate-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    white: 'text-white',
    inherit: 'text-inherit',
  }

  const combinedClasses = $derived(
    cn(
      sizeClasses[size],
      weightClasses[weight],
      colorClasses[color],
      truncate && 'truncate',
      italic && 'italic',
      underline && 'underline',
      classes
    )
  )
</script>

{#if as === 'p'}
  <p class={combinedClasses} {id}>
    {@render children?.()}
  </p>
{:else if as === 'h1'}
  <h1 class={combinedClasses} {id}>
    {@render children?.()}
  </h1>
{:else if as === 'h2'}
  <h2 class={combinedClasses} {id}>
    {@render children?.()}
  </h2>
{:else if as === 'h3'}
  <h3 class={combinedClasses} {id}>
    {@render children?.()}
  </h3>
{:else if as === 'h4'}
  <h4 class={combinedClasses} {id}>
    {@render children?.()}
  </h4>
{:else if as === 'h5'}
  <h5 class={combinedClasses} {id}>
    {@render children?.()}
  </h5>
{:else if as === 'h6'}
  <h6 class={combinedClasses} {id}>
    {@render children?.()}
  </h6>
{:else if as === 'label'}
  <label class={combinedClasses} {id}>
    {@render children?.()}
  </label>
{:else}
  <span class={combinedClasses} {id}>
    {@render children?.()}
  </span>
{/if}
