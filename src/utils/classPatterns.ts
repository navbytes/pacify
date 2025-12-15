/**
 * Reusable class patterns for common UI elements
 * These patterns encapsulate frequently used class combinations
 */

import { cn } from './cn'
import { colors, shadows, radius, transitions } from './theme'

/**
 * Card patterns
 */
export const cardPatterns = {
  base: cn(
    'rounded-lg border',
    colors.background.default,
    colors.border.default,
    shadows.sm,
    transitions.normal
  ),

  interactive: cn(
    'rounded-lg border cursor-pointer',
    colors.background.default,
    colors.border.default,
    shadows.card,
    transitions.normal,
    'hover:scale-[1.02]'
  ),

  compact: cn('rounded-lg border p-2', colors.background.default, colors.border.default),

  elevated: cn('rounded-lg border', colors.background.elevated, colors.border.default, shadows.lg),
}

/**
 * Flex layout patterns
 */
export const flexPatterns = {
  center: 'flex items-center justify-center',
  centerVertical: 'flex items-center',
  centerHorizontal: 'flex justify-center',
  between: 'flex items-center justify-between',
  start: 'flex items-start',
  end: 'flex items-end justify-end',
  col: 'flex flex-col',
  colCenter: 'flex flex-col items-center justify-center',
  colStart: 'flex flex-col items-start',
  wrap: 'flex flex-wrap',
}

/**
 * Button patterns
 */
export const buttonPatterns = {
  base: cn(
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2',
    radius.md,
    'font-medium text-sm',
    transitions.colors,
    colors.interactive.focus,
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ),

  primary: cn(
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2',
    radius.md,
    'font-medium text-sm',
    colors.primary.base,
    colors.primary.hover,
    colors.text.inverse,
    transitions.colors,
    colors.interactive.focus
  ),

  secondary: cn(
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2',
    radius.md,
    'font-medium text-sm',
    'bg-slate-200 dark:bg-slate-700',
    'hover:bg-slate-300 dark:hover:bg-slate-600',
    colors.text.default,
    transitions.colors,
    colors.interactive.focus
  ),

  ghost: cn(
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2',
    radius.md,
    'font-medium text-sm',
    'bg-transparent',
    colors.interactive.hover,
    colors.text.default,
    transitions.colors,
    colors.interactive.focus
  ),

  icon: cn(
    'inline-flex items-center justify-center',
    'p-2',
    radius.md,
    'bg-transparent',
    colors.interactive.hover,
    transitions.colors,
    colors.interactive.focus
  ),

  sm: cn(
    'inline-flex items-center justify-center gap-1.5',
    'px-3 py-1.5',
    radius.md,
    'font-medium text-xs'
  ),

  lg: cn(
    'inline-flex items-center justify-center gap-2.5',
    'px-6 py-3',
    radius.lg,
    'font-medium text-base'
  ),
}

/**
 * Input patterns
 */
export const inputPatterns = {
  base: cn(
    'w-full px-3 py-2',
    radius.md,
    'border',
    colors.background.default,
    colors.border.default,
    colors.text.default,
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    transitions.colors,
    colors.interactive.focus
  ),

  error: cn(
    'w-full px-3 py-2',
    radius.md,
    'border',
    colors.background.default,
    colors.danger.border,
    colors.text.default,
    transitions.colors,
    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
  ),

  sm: 'px-2 py-1.5 text-sm',
  lg: 'px-4 py-3 text-base',
}

/**
 * Badge patterns
 */
export const badgePatterns = {
  base: cn('inline-flex items-center gap-1', 'px-2.5 py-0.5', radius.full, 'text-xs font-medium'),

  primary: cn(
    'inline-flex items-center gap-1',
    'px-2.5 py-0.5',
    radius.full,
    'text-xs font-medium',
    colors.primary.light,
    colors.primary.text
  ),

  success: cn(
    'inline-flex items-center gap-1',
    'px-2.5 py-0.5',
    radius.full,
    'text-xs font-medium',
    colors.success.light,
    colors.success.text
  ),

  warning: cn(
    'inline-flex items-center gap-1',
    'px-2.5 py-0.5',
    radius.full,
    'text-xs font-medium',
    colors.warning.light,
    colors.warning.text
  ),

  danger: cn(
    'inline-flex items-center gap-1',
    'px-2.5 py-0.5',
    radius.full,
    'text-xs font-medium',
    colors.danger.light,
    colors.danger.text
  ),

  neutral: cn(
    'inline-flex items-center gap-1',
    'px-2.5 py-0.5',
    radius.full,
    'text-xs font-medium',
    'bg-slate-100 dark:bg-slate-800',
    colors.text.muted
  ),
}

/**
 * Modal/Dialog patterns
 */
export const modalPatterns = {
  overlay: cn(
    'fixed inset-0 z-50',
    'bg-black/50 dark:bg-black/70',
    'backdrop-blur-sm',
    transitions.opacity
  ),

  content: cn(
    'fixed left-1/2 top-1/2 z-50',
    'w-full max-w-lg',
    '-translate-x-1/2 -translate-y-1/2',
    radius.lg,
    colors.background.elevated,
    colors.border.default,
    'border',
    shadows.xl,
    transitions.normal
  ),

  header: cn('flex items-center justify-between', 'p-6 pb-4', 'border-b', colors.border.default),

  body: 'p-6',

  footer: cn('flex items-center justify-end gap-3', 'p-6 pt-4', 'border-t', colors.border.default),
}

/**
 * List patterns
 */
export const listPatterns = {
  container: cn('divide-y', colors.border.default),

  item: cn('px-4 py-3', transitions.colors, colors.interactive.hover, 'cursor-pointer'),

  itemActive: cn('px-4 py-3', colors.primary.light, colors.primary.border, 'border-l-2'),
}

/**
 * Loading/skeleton patterns
 */
export const loadingPatterns = {
  spinner: cn('animate-spin rounded-full border-2 border-t-transparent', colors.primary.text),

  skeleton: cn('animate-pulse', 'bg-slate-200 dark:bg-slate-700', radius.md),

  shimmer: cn(
    'animate-pulse',
    'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700',
    'bg-[length:200%_100%]',
    radius.md
  ),
}

/**
 * Drag and drop patterns
 */
export const dragPatterns = {
  draggable: cn('cursor-grab', transitions.normal, 'active:cursor-grabbing'),

  dragging: cn('opacity-40', 'scale-95', 'shadow-lg'),

  dropZone: cn('relative border-2 border-dashed border-transparent', transitions.normal),

  dropZoneActive: cn(
    'border-blue-500',
    'bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20',
    'scale-[1.01]',
    'shadow-lg shadow-blue-500/20'
  ),
}

/**
 * Empty state patterns
 */
export const emptyStatePatterns = {
  container: cn(flexPatterns.colCenter, 'px-4 py-12 text-center'),

  icon: cn(colors.icon.muted, 'mb-4'),

  title: cn('text-lg font-semibold mb-2', colors.text.default),

  description: cn('text-sm max-w-md mb-6', colors.text.muted),
}

/**
 * Status indicator patterns
 */
export const statusPatterns = {
  dot: cn('inline-block w-2 h-2', radius.full),

  dotSuccess: cn('inline-block w-2 h-2', radius.full, 'bg-green-500'),

  dotWarning: cn('inline-block w-2 h-2', radius.full, 'bg-yellow-500'),

  dotDanger: cn('inline-block w-2 h-2', radius.full, 'bg-red-500'),

  dotInactive: cn('inline-block w-2 h-2', radius.full, 'bg-slate-400'),
}

/**
 * Utility function to combine patterns with additional classes
 */
export function withPattern(pattern: string, ...classes: string[]) {
  return cn(pattern, ...classes)
}

/**
 * Variant-based component utilities
 * Type-safe alternatives to static patterns
 */
import { cva } from 'class-variance-authority'
export type { VariantProps } from 'class-variance-authority'

/**
 * Button variants with type-safe props
 */
export const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium',
    transitions.colors,
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  ),
  {
    variants: {
      intent: {
        primary: cn(
          colors.primary.base,
          colors.primary.hover,
          colors.text.inverse,
          'focus-visible:ring-blue-500'
        ),
        secondary: cn(
          'bg-slate-200 dark:bg-slate-700',
          'hover:bg-slate-300 dark:hover:bg-slate-600',
          colors.text.default,
          'focus-visible:ring-slate-500'
        ),
        danger: cn(
          colors.danger.base,
          colors.danger.hover,
          colors.text.inverse,
          'focus-visible:ring-red-500'
        ),
        success: cn(
          colors.success.base,
          colors.success.hover,
          colors.text.inverse,
          'focus-visible:ring-green-500'
        ),
        ghost: cn(
          'bg-transparent',
          colors.interactive.hover,
          colors.text.default,
          'focus-visible:ring-blue-500'
        ),
      },
      size: {
        sm: cn('px-3 py-1.5', 'text-xs', radius.md),
        md: cn('px-4 py-2', 'text-sm', radius.md),
        lg: cn('px-6 py-3', 'text-base', radius.lg),
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

/**
 * Badge variants with type-safe props
 */
export const badgeVariants = cva(
  cn('inline-flex items-center gap-1', 'text-xs font-medium', radius.full),
  {
    variants: {
      intent: {
        primary: cn(badgePatterns.primary),
        success: cn(badgePatterns.success),
        warning: cn(badgePatterns.warning),
        danger: cn(badgePatterns.danger),
        neutral: cn(badgePatterns.neutral),
      },
      size: {
        sm: 'px-2 py-0.5',
        md: 'px-2.5 py-0.5',
        lg: 'px-3 py-1',
      },
    },
    defaultVariants: {
      intent: 'neutral',
      size: 'md',
    },
  }
)

/**
 * Alert variants with type-safe props
 */
export const alertVariants = cva(cn('p-4', radius.lg, 'border', transitions.normal), {
  variants: {
    intent: {
      info: cn(colors.info.light, colors.info.border, colors.info.text),
      success: cn(colors.success.light, colors.success.border, colors.success.text),
      warning: cn(colors.warning.light, colors.warning.border, colors.warning.text),
      danger: cn(colors.danger.light, colors.danger.border, colors.danger.text),
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    intent: 'info',
    size: 'md',
  },
})
