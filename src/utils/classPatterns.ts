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
    'inline-flex items-center gap-2',
    'font-medium',
    'transition-all duration-150 cursor-pointer active:scale-95',
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ),
  {
    variants: {
      intent: {
        primary: '',
        secondary: '',
        success: '',
        error: '',
        info: '',
        ghost: '',
      },
      variant: {
        solid: '',
        minimal: '',
      },
      size: {
        sm: cn('py-2 px-3 text-sm min-h-[44px]', radius.md),
        md: cn('py-2.5 px-4 min-h-[44px]', radius.md),
        lg: cn('py-3 px-6 text-lg min-h-[44px]', radius.lg),
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      // Solid Primary
      {
        intent: 'primary',
        variant: 'solid',
        class: cn(
          'bg-blue-500 text-white hover:bg-blue-600',
          'dark:bg-blue-700 dark:hover:bg-blue-800',
          'focus-visible:ring-blue-300 dark:focus-visible:ring-blue-400/50',
          'rounded shadow hover:shadow-md'
        ),
      },
      // Minimal Primary
      {
        intent: 'primary',
        variant: 'minimal',
        class: cn(
          'justify-center text-blue-600 hover:text-blue-700',
          'hover:bg-blue-100 border border-transparent hover:border-blue-200',
          'dark:text-blue-400 dark:hover:text-blue-300',
          'dark:hover:bg-blue-950/20 dark:hover:border-blue-800',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
      // Solid Secondary
      {
        intent: 'secondary',
        variant: 'solid',
        class: cn(
          'bg-slate-200 text-black hover:bg-slate-300',
          'dark:text-white dark:bg-slate-700 dark:hover:bg-slate-800',
          'focus-visible:ring-slate-300',
          'rounded shadow hover:shadow-md'
        ),
      },
      // Minimal Secondary
      {
        intent: 'secondary',
        variant: 'minimal',
        class: cn(
          'justify-center text-slate-700 hover:text-slate-900',
          'hover:bg-slate-200 border border-transparent hover:border-slate-300',
          'dark:text-slate-400 dark:hover:text-slate-300',
          'dark:hover:bg-slate-800 dark:hover:border-slate-700',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
      // Solid Success
      {
        intent: 'success',
        variant: 'solid',
        class: cn(
          'bg-green-500 text-white hover:bg-green-600',
          'dark:bg-green-700 dark:hover:bg-green-800',
          'focus-visible:ring-green-300',
          'rounded shadow hover:shadow-md'
        ),
      },
      // Minimal Success
      {
        intent: 'success',
        variant: 'minimal',
        class: cn(
          'justify-center text-green-600 hover:text-green-700',
          'hover:bg-green-100 border border-transparent hover:border-green-200',
          'dark:text-green-400 dark:hover:text-green-300',
          'dark:hover:bg-green-950/20 dark:hover:border-green-800',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
      // Solid Error
      {
        intent: 'error',
        variant: 'solid',
        class: cn(
          'bg-red-500 text-white hover:bg-red-600',
          'dark:bg-red-700 dark:hover:bg-red-800',
          'focus-visible:ring-red-300',
          'rounded shadow hover:shadow-md'
        ),
      },
      // Minimal Error
      {
        intent: 'error',
        variant: 'minimal',
        class: cn(
          'justify-center text-red-600 hover:text-red-700',
          'hover:bg-red-100 border border-transparent hover:border-red-200',
          'dark:text-red-400 dark:hover:text-red-300',
          'dark:hover:bg-red-950/20 dark:hover:border-red-800',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
      // Solid Info
      {
        intent: 'info',
        variant: 'solid',
        class: cn(
          'bg-indigo-500 text-white hover:bg-indigo-600',
          'dark:bg-indigo-700 dark:hover:bg-indigo-800',
          'focus-visible:ring-indigo-300',
          'rounded shadow hover:shadow-md'
        ),
      },
      // Minimal Info
      {
        intent: 'info',
        variant: 'minimal',
        class: cn(
          'justify-center text-indigo-600 hover:text-indigo-700',
          'hover:bg-indigo-100 border border-transparent hover:border-indigo-200',
          'dark:text-indigo-400 dark:hover:text-indigo-300',
          'dark:hover:bg-indigo-950/20 dark:hover:border-indigo-800',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
      // Ghost (transparent background)
      {
        intent: 'ghost',
        class: cn(
          'bg-transparent justify-center',
          colors.interactive.hover,
          colors.text.default,
          'focus-visible:ring-blue-500',
          'rounded px-2 py-1 min-h-[44px]'
        ),
      },
    ],
    defaultVariants: {
      intent: 'primary',
      variant: 'solid',
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

/**
 * Input variants with type-safe props
 * Supports text inputs, textareas, and select elements
 */
export const inputVariants = cva(
  cn(
    'w-full',
    'border',
    transitions.colors,
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900'
  ),
  {
    variants: {
      state: {
        default: cn(
          colors.background.default,
          colors.border.default,
          colors.text.default,
          'focus:ring-blue-500 focus:border-blue-500'
        ),
        error: cn(
          colors.background.default,
          colors.danger.border,
          colors.text.default,
          'focus:ring-red-500 focus:border-red-500'
        ),
        success: cn(
          colors.background.default,
          colors.success.border,
          colors.text.default,
          'focus:ring-green-500 focus:border-green-500'
        ),
      },
      size: {
        sm: cn('px-2 py-1.5 text-sm', radius.md),
        md: cn('px-3 py-2 text-base', radius.md),
        lg: cn('px-4 py-3 text-lg', radius.lg),
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
      fullWidth: true,
    },
  }
)

/**
 * Toast/Notification variants with type-safe props
 */
export const toastVariants = cva(
  cn(
    'flex items-start gap-2',
    'p-4',
    radius.lg,
    'border-l-4',
    shadows.lg,
    'backdrop-blur-sm',
    transitions.normal
  ),
  {
    variants: {
      intent: {
        success: cn(
          'bg-green-50 dark:bg-green-900/20',
          'border-green-500',
          'text-green-800 dark:text-green-200'
        ),
        error: cn(
          'bg-red-50 dark:bg-red-900/20',
          'border-red-500',
          'text-red-800 dark:text-red-200'
        ),
        warning: cn(
          'bg-yellow-50 dark:bg-yellow-900/20',
          'border-yellow-500',
          'text-yellow-800 dark:text-yellow-200'
        ),
        info: cn(
          'bg-blue-50 dark:bg-blue-900/20',
          'border-blue-500',
          'text-blue-800 dark:text-blue-200'
        ),
      },
    },
    defaultVariants: {
      intent: 'info',
    },
  }
)

/**
 * Card variants with type-safe props
 */
export const cardVariants = cva(cn(radius.lg, 'border', transitions.normal), {
  variants: {
    variant: {
      default: cn(colors.background.default, colors.border.default, shadows.sm),
      elevated: cn(colors.background.elevated, colors.border.default, shadows.md),
      interactive: cn(
        colors.background.default,
        colors.border.default,
        shadows.card,
        'cursor-pointer hover:scale-[1.02]',
        colors.interactive.hover
      ),
      outlined: cn(
        'bg-transparent',
        colors.border.default,
        'border-2',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      ),
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

/**
 * Modal/Dialog variants with type-safe props
 */
export const modalVariants = {
  overlay: cva(cn('fixed inset-0 z-50', 'backdrop-blur-sm', transitions.opacity), {
    variants: {
      variant: {
        default: 'bg-black/50 dark:bg-black/70',
        light: 'bg-black/30 dark:bg-black/50',
        heavy: 'bg-black/70 dark:bg-black/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }),
  content: cva(
    cn(
      'relative',
      'w-full max-w-lg',
      radius.lg,
      colors.background.elevated,
      colors.border.default,
      'border',
      shadows.xl,
      transitions.normal
    ),
    {
      variants: {
        size: {
          sm: 'max-w-md',
          md: 'max-w-lg',
          lg: 'max-w-2xl',
          xl: 'max-w-4xl',
          full: 'max-w-full mx-4',
        },
      },
      defaultVariants: {
        size: 'md',
      },
    }
  ),
  header: cva(
    cn('flex items-center justify-between', 'p-6 pb-4', 'border-b', colors.border.default)
  ),
  body: cva('p-6'),
  footer: cva(
    cn('flex items-center justify-end gap-3', 'p-6 pt-4', 'border-t', colors.border.default)
  ),
}

/**
 * Tab component variants with type-safe props
 * Supports active/disabled states and different tab styles
 */
export const tabVariants = cva(
  cn(
    'group relative flex items-center gap-2.5 px-6 py-3.5',
    'text-sm font-medium transition-all duration-200',
    'border-b-2 whitespace-nowrap bg-transparent cursor-pointer rounded-t-lg',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
  ),
  {
    variants: {
      active: {
        true: cn(
          'text-blue-600 bg-blue-50/50 border-blue-600 border-b-4',
          'dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-400'
        ),
        false: cn(
          'text-slate-600 border-transparent',
          'hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300',
          'dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:border-slate-600'
        ),
      },
      disabled: {
        true: cn(
          'opacity-50 cursor-not-allowed',
          'hover:!text-slate-500 hover:!border-transparent',
          'dark:hover:!text-slate-400'
        ),
        false: '',
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
)

export const tabIconVariants = cva(
  'flex items-center justify-center shrink-0 transition-colors duration-200',
  {
    variants: {
      active: {
        true: 'text-blue-600 dark:text-blue-400',
        false: cn('text-slate-500', 'group-hover:text-slate-700 dark:group-hover:text-slate-300'),
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

export const tabBadgeVariants = cva('ml-2 px-2 py-0.5 rounded-full text-xs font-semibold', {
  variants: {
    active: {
      true: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      false: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/**
 * FlexGroup variants with type-safe props
 * Flexible layout component with direction, gap, alignment, and justification
 */
export const flexGroupVariants = cva('flex', {
  variants: {
    direction: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    childrenGap: {
      xxs: 'gap-1',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      xxl: 'gap-10',
    },
    alignItems: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justifyContent: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
  },
  defaultVariants: {
    direction: 'horizontal',
    childrenGap: 'md',
    alignItems: 'center',
    justifyContent: 'start',
  },
})

/**
 * Text variants with type-safe props
 * Typography component with size, weight, color, and decoration options
 */
export const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      primary: colors.text.default,
      secondary: 'text-slate-700 dark:text-slate-300',
      muted: colors.text.muted,
      success: colors.success.text,
      error: colors.danger.text,
      info: colors.info.text,
      white: 'text-white',
      inherit: 'text-inherit',
    },
    truncate: {
      true: 'truncate',
      false: '',
    },
    italic: {
      true: 'italic',
      false: '',
    },
    underline: {
      true: 'underline',
      false: '',
    },
  },
  defaultVariants: {
    size: 'base',
    weight: 'normal',
    color: 'primary',
    truncate: false,
    italic: false,
    underline: false,
  },
})

/**
 * IconBadge variants with type-safe props
 * Circular badge component with icon, color, and size variants
 */
export const iconBadgeVariants = cva('rounded-lg flex items-center justify-center', {
  variants: {
    color: {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    size: {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-16 h-16',
    },
  },
  defaultVariants: {
    color: 'blue',
    size: 'md',
  },
})

/**
 * LinkCard variants with type-safe props
 * Provides hover color variants for IconBadge in LinkCard component
 */
export const linkCardIconBadgeVariants = cva('transition-all duration-200 group-hover:scale-110', {
  variants: {
    color: {
      blue: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400',
      red: 'group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400',
      yellow:
        'group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
      green:
        'group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400',
      purple:
        'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400',
      orange:
        'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 dark:group-hover:text-orange-400',
    },
  },
  defaultVariants: {
    color: 'blue',
  },
})

/**
 * LinkCard external link icon variants
 */
export const linkCardExternalIconVariants = cva(
  'flex-shrink-0 text-slate-400 dark:text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
  {
    variants: {
      color: {
        blue: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        red: 'group-hover:text-red-600 dark:group-hover:text-red-400',
        yellow: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
        green: 'group-hover:text-green-600 dark:group-hover:text-green-400',
        purple: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        orange: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
      },
    },
    defaultVariants: {
      color: 'blue',
    },
  }
)

/**
 * SectionHeader variants with type-safe props
 * Icon container with gradient background
 */
export const sectionHeaderIconVariants = cva(
  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-md',
  {
    variants: {
      iconColor: {
        purple:
          'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
        slate:
          'bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
      },
    },
    defaultVariants: {
      iconColor: 'slate',
    },
  }
)

/**
 * SectionHeader border variants
 */
export const sectionHeaderBorderVariants = cva('', {
  variants: {
    iconColor: {
      purple: 'border-purple-200 dark:border-purple-800',
      slate: 'border-slate-200 dark:border-slate-700',
    },
  },
  defaultVariants: {
    iconColor: 'slate',
  },
})

/**
 * SectionHeader badge variants
 */
export const sectionHeaderBadgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
  {
    variants: {
      iconColor: {
        purple:
          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        slate:
          'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      },
    },
    defaultVariants: {
      iconColor: 'slate',
    },
  }
)

/**
 * ToggleSwitch track classes with organized peer states
 * Combined classes for toggle switch with automatic checked state handling via peer selector
 */
export const toggleSwitchTrackClasses = cn(
  'block w-12 h-7 rounded-full transition-all duration-200 ease-in-out relative',
  // Unchecked state colors
  'bg-slate-400 dark:bg-slate-600',
  'hover:bg-slate-500 dark:hover:bg-slate-500',
  // Checked state colors (via peer selector)
  'peer-checked:bg-green-500 dark:peer-checked:bg-green-600',
  'peer-checked:hover:bg-green-600 dark:peer-checked:hover:bg-green-500',
  // Toggle circle (using before pseudo-element)
  'before:absolute before:content-[""] before:h-5 before:w-5 before:left-[4px] before:top-[4px]',
  'before:bg-white before:rounded-full before:transition-transform before:duration-200 before:ease-in-out before:shadow-md',
  'peer-checked:before:translate-x-5',
  // Focus states
  'peer-focus:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-green-500/50 dark:peer-focus-visible:ring-green-400/50 peer-focus-visible:ring-offset-2'
)

/**
 * Tooltip variants with type-safe props
 * Tooltip positioning and arrow direction
 */
export const tooltipVariants = cva(
  'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap animate-fade-in',
  {
    variants: {
      position: {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      },
    },
    defaultVariants: {
      position: 'top',
    },
  }
)

/**
 * Tooltip arrow variants
 */
export const tooltipArrowVariants = cva('absolute w-0 h-0 border-4 border-transparent', {
  variants: {
    position: {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700',
      right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700',
    },
  },
  defaultVariants: {
    position: 'top',
  },
})

/**
 * ProgressBar variants with type-safe props
 * Progress bar with size and color variants
 */
export const progressBarVariants = cva(
  'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

/**
 * ProgressBar fill variants with dynamic color based on percentage
 */
export const progressBarFillVariants = cva(
  'h-full rounded-full transition-all duration-500 ease-out',
  {
    variants: {
      percentage: {
        low: 'bg-green-500 dark:bg-green-400',
        medium: 'bg-yellow-500 dark:bg-yellow-400',
        high: 'bg-red-500 dark:bg-red-400',
      },
    },
    defaultVariants: {
      percentage: 'low',
    },
  }
)

/**
 * LabelButton variants with type-safe props
 * Label-styled button with color and minimal/base variants
 */
export const labelButtonVariants = cva('inline-flex items-center', {
  variants: {
    intent: {
      primary: '',
      secondary: '',
      success: '',
      error: '',
      info: '',
    },
    variant: {
      base: cn('py-2 px-4 rounded shadow', 'focus:outline-none focus:ring-2 focus:ring-offset-2'),
      minimal: 'focus:outline-none',
    },
  },
  compoundVariants: [
    // Base Primary
    {
      intent: 'primary',
      variant: 'base',
      class: cn(
        'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
        'dark:bg-blue-700 dark:hover:bg-blue-800'
      ),
    },
    // Minimal Primary
    {
      intent: 'primary',
      variant: 'minimal',
      class: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500',
    },
    // Base Secondary
    {
      intent: 'secondary',
      variant: 'base',
      class: cn(
        'bg-slate-200 text-black hover:bg-slate-300 focus:ring-slate-300',
        'dark:text-white dark:bg-slate-700 dark:hover:bg-slate-800'
      ),
    },
    // Minimal Secondary
    {
      intent: 'secondary',
      variant: 'minimal',
      class: 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-500',
    },
    // Base Success
    {
      intent: 'success',
      variant: 'base',
      class: cn(
        'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300',
        'dark:bg-green-700 dark:hover:bg-green-800'
      ),
    },
    // Minimal Success
    {
      intent: 'success',
      variant: 'minimal',
      class: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-500',
    },
    // Base Error
    {
      intent: 'error',
      variant: 'base',
      class: cn(
        'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
        'dark:bg-red-700 dark:hover:bg-red-800'
      ),
    },
    // Minimal Error
    {
      intent: 'error',
      variant: 'minimal',
      class: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500',
    },
    // Base Info
    {
      intent: 'info',
      variant: 'base',
      class: cn(
        'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-300',
        'dark:bg-indigo-700 dark:hover:bg-indigo-800'
      ),
    },
    // Minimal Info
    {
      intent: 'info',
      variant: 'minimal',
      class:
        'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500',
    },
  ],
  defaultVariants: {
    intent: 'primary',
    variant: 'base',
  },
})

/**
 * LoadingSpinner variants with type-safe props
 * Animated spinner with size variants
 */
export const loadingSpinnerVariants = cva(cn(loadingPatterns.spinner), {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})
