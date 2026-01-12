/**
 * Reusable class patterns for common UI elements
 * These patterns encapsulate frequently used class combinations
 *
 * Note: AutoProxy-specific variants are in ./classPatterns/autoProxy.ts
 */

import { tv } from 'tailwind-variants'
import { cn } from './cn'
import { colors, radius, shadows, transitions } from './theme'

export type { VariantProps } from 'tailwind-variants'

// ============================================================================
// STATIC PATTERNS (Simple string-based patterns for common utilities)
// ============================================================================

/**
 * Flex layout patterns - commonly used flex combinations
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
 * Badge patterns - kept for backward compatibility (used in ScriptItem)
 */
export const badgePatterns = {
  base: cn('inline-flex items-center gap-1', 'px-2.5 py-0.5', radius.full, 'text-xs font-medium'),
}

/**
 * Utility function to combine patterns with additional classes
 */
export function withPattern(pattern: string, ...classes: string[]) {
  return cn(pattern, ...classes)
}

// ============================================================================
// TV VARIANTS (Type-safe component variants using tailwind-variants)
// ============================================================================

/**
 * Button variants with type-safe props
 */
export const buttonVariants = tv({
  base: 'inline-flex items-center gap-2 font-medium transition-all duration-150 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
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
      sm: `py-2 px-3 text-sm min-h-[44px] ${radius.xl}`,
      md: `py-2.5 px-4 min-h-[44px] ${radius.xl}`,
      lg: `py-3 px-6 text-lg min-h-[44px] ${radius.xl}`,
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
        'shadow hover:shadow-md'
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
        'dark:hover:bg-blue-950/20 dark:hover:border-blue-800'
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
        'shadow hover:shadow-md'
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
        'dark:hover:bg-slate-800 dark:hover:border-slate-700'
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
        'shadow hover:shadow-md'
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
        'dark:hover:bg-green-950/20 dark:hover:border-green-800'
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
        'shadow hover:shadow-md'
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
        'dark:hover:bg-red-950/20 dark:hover:border-red-800'
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
        'shadow hover:shadow-md'
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
        'dark:hover:bg-indigo-950/20 dark:hover:border-indigo-800'
      ),
    },
    // Ghost (transparent background)
    {
      intent: 'ghost',
      class: cn(
        'bg-transparent justify-center',
        colors.interactive.hover,
        colors.text.default,
        'focus-visible:ring-blue-500'
      ),
    },
  ],
  defaultVariants: {
    intent: 'primary',
    variant: 'solid',
    size: 'md',
    fullWidth: false,
  },
})

/**
 * Badge variants with type-safe props
 */
export const badgeVariants = tv({
  base: `inline-flex items-center gap-1 text-xs font-medium ${radius.full}`,
  variants: {
    intent: {
      primary: `${colors.primary.light} ${colors.primary.text}`,
      success: `${colors.success.light} ${colors.success.text}`,
      warning: `${colors.warning.light} ${colors.warning.text}`,
      danger: `${colors.danger.light} ${colors.danger.text}`,
      neutral: `bg-slate-100 dark:bg-slate-800 ${colors.text.muted}`,
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
})

/**
 * Alert variants with type-safe props
 */
export const alertVariants = tv({
  base: `p-4 ${radius.lg} border ${transitions.normal}`,
  variants: {
    intent: {
      info: `${colors.info.light} ${colors.info.border} ${colors.info.text}`,
      success: `${colors.success.light} ${colors.success.border} ${colors.success.text}`,
      warning: `${colors.warning.light} ${colors.warning.border} ${colors.warning.text}`,
      danger: `${colors.danger.light} ${colors.danger.border} ${colors.danger.text}`,
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
export const inputVariants = tv({
  base: `w-full border ${transitions.colors} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900`,
  variants: {
    state: {
      default: `${colors.background.default} ${colors.border.default} ${colors.text.default} focus:ring-blue-500 focus:border-blue-500`,
      error: `${colors.background.default} ${colors.danger.border} ${colors.text.default} focus:ring-red-500 focus:border-red-500`,
      success: `${colors.background.default} ${colors.success.border} ${colors.text.default} focus:ring-green-500 focus:border-green-500`,
    },
    size: {
      sm: `px-2 py-1.5 text-sm ${radius.md}`,
      md: `px-3 py-2 text-base ${radius.md}`,
      lg: `px-4 py-3 text-lg ${radius.lg}`,
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
})

/**
 * Toast/Notification variants with type-safe props
 */
export const toastVariants = tv({
  base: `flex items-start gap-2 p-4 ${radius.lg} border-l-4 ${shadows.lg} backdrop-blur-sm ${transitions.normal}`,
  variants: {
    intent: {
      success:
        'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200',
      error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200',
      warning:
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200',
    },
  },
  defaultVariants: {
    intent: 'info',
  },
})

/**
 * Card variants with type-safe props
 */
export const cardVariants = tv({
  base: `${radius.lg} border ${transitions.normal}`,
  variants: {
    variant: {
      default: `${colors.background.default} ${colors.border.default} ${shadows.sm}`,
      elevated: `${colors.background.elevated} ${colors.border.default} ${shadows.md}`,
      interactive: `${colors.background.default} ${colors.border.default} ${shadows.card} cursor-pointer hover:scale-[1.02] ${colors.interactive.hover}`,
      outlined: `bg-transparent ${colors.border.default} border-2 hover:bg-slate-50 dark:hover:bg-slate-800/50`,
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
  overlay: tv({
    base: `fixed inset-0 z-50 backdrop-blur-sm ${transitions.opacity}`,
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
  content: tv({
    base: `relative w-full max-w-lg ${radius.lg} ${colors.background.elevated} ${colors.border.default} border ${shadows.xl} ${transitions.normal}`,
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
  }),
  header: tv({
    base: `flex items-center justify-between p-6 pb-4 border-b ${colors.border.default}`,
  }),
  body: tv({
    base: 'p-6',
  }),
  footer: tv({
    base: `flex items-center justify-end gap-3 p-6 pt-4 border-t ${colors.border.default}`,
  }),
}

/**
 * Tab component variants with type-safe props
 */
export const tabVariants = tv({
  base: 'group relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 min-h-[40px]',
  variants: {
    active: {
      true: 'text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm',
      false:
        'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed hover:!text-slate-500 hover:!bg-transparent dark:hover:!text-slate-400',
      false: '',
    },
  },
  defaultVariants: {
    active: false,
    disabled: false,
  },
})

export const tabIconVariants = tv({
  base: 'flex items-center justify-center shrink-0 transition-colors duration-200',
  variants: {
    active: {
      true: 'text-slate-900 dark:text-white',
      false: 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300',
    },
  },
  defaultVariants: {
    active: false,
  },
})

export const tabBadgeVariants = tv({
  base: 'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold',
  variants: {
    active: {
      true: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      false: 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/**
 * FlexGroup variants with type-safe props
 */
export const flexGroupVariants = tv({
  base: 'flex',
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
 */
export const textVariants = tv({
  base: '',
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
 */
export const iconBadgeVariants = tv({
  base: 'rounded-lg flex items-center justify-center',
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
 */
export const linkCardIconBadgeVariants = tv({
  base: 'transition-all duration-200 group-hover:scale-110',
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
export const linkCardExternalIconVariants = tv({
  base: 'flex-shrink-0 text-slate-400 dark:text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
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
})

/**
 * SectionHeader variants with type-safe props
 */
export const sectionHeaderIconVariants = tv({
  base: 'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-md',
  variants: {
    iconColor: {
      purple:
        'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
      slate: 'bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
    },
  },
  defaultVariants: {
    iconColor: 'slate',
  },
})

export const sectionHeaderBorderVariants = tv({
  base: '',
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

export const sectionHeaderBadgeVariants = tv({
  base: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
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
})

/**
 * ToggleSwitch track classes
 */
export const toggleSwitchTrackClasses = cn(
  'block w-12 h-7 rounded-full transition-all duration-200 ease-in-out relative',
  'bg-slate-400 dark:bg-slate-600',
  'hover:bg-slate-500 dark:hover:bg-slate-500',
  'peer-checked:bg-green-500 dark:peer-checked:bg-green-600',
  'peer-checked:hover:bg-green-600 dark:peer-checked:hover:bg-green-500',
  'before:absolute before:content-[""] before:h-5 before:w-5 before:left-[4px] before:top-[4px]',
  'before:bg-white before:rounded-full before:transition-transform before:duration-200 before:ease-in-out before:shadow-md',
  'peer-checked:before:translate-x-5',
  'peer-focus:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-green-500/50 dark:peer-focus-visible:ring-green-400/50 peer-focus-visible:ring-offset-2'
)

/**
 * Tooltip variants with type-safe props
 */
export const tooltipVariants = tv({
  base: 'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap animate-fade-in',
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
})

export const tooltipArrowVariants = tv({
  base: 'absolute w-0 h-0 border-4 border-transparent',
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
 */
export const progressBarVariants = tv({
  base: 'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
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
})

export const progressBarFillVariants = tv({
  base: 'h-full rounded-full transition-all duration-500 ease-out',
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
})

/**
 * LabelButton variants with type-safe props
 */
export const labelButtonVariants = tv({
  base: 'inline-flex items-center',
  variants: {
    intent: {
      primary: '',
      secondary: '',
      success: '',
      error: '',
      info: '',
    },
    variant: {
      base: 'py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2',
      minimal: 'focus:outline-none',
    },
  },
  compoundVariants: [
    {
      intent: 'primary',
      variant: 'base',
      class:
        'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800',
    },
    {
      intent: 'primary',
      variant: 'minimal',
      class: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500',
    },
    {
      intent: 'secondary',
      variant: 'base',
      class:
        'bg-slate-200 text-black hover:bg-slate-300 focus:ring-slate-300 dark:text-white dark:bg-slate-700 dark:hover:bg-slate-800',
    },
    {
      intent: 'secondary',
      variant: 'minimal',
      class: 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-500',
    },
    {
      intent: 'success',
      variant: 'base',
      class:
        'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800',
    },
    {
      intent: 'success',
      variant: 'minimal',
      class: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-500',
    },
    {
      intent: 'error',
      variant: 'base',
      class:
        'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800',
    },
    {
      intent: 'error',
      variant: 'minimal',
      class: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500',
    },
    {
      intent: 'info',
      variant: 'base',
      class:
        'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-800',
    },
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
 */
export const loadingSpinnerVariants = tv({
  base: `animate-spin rounded-full border-2 border-t-transparent ${colors.primary.text}`,
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

/**
 * Form label variants for consistent label styling
 */
export const formLabelVariants = tv({
  base: 'block font-medium text-slate-700 dark:text-slate-300',
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
    },
    spacing: {
      none: '',
      sm: 'mb-1',
      md: 'mb-2',
    },
  },
  defaultVariants: {
    size: 'sm',
    spacing: 'sm',
  },
})

/**
 * Error container variants for error messages and error boundaries
 */
export const errorContainerVariants = tv({
  base: 'rounded border p-4',
  variants: {
    variant: {
      subtle:
        'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      solid: 'bg-red-500 text-white border-red-600',
      outline: 'bg-transparent border-red-300 dark:border-red-700 text-red-600 dark:text-red-400',
    },
    size: {
      sm: 'p-2 text-sm',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'subtle',
    size: 'md',
  },
})

/**
 * Keyboard shortcut card variants
 */
export const keyboardShortcutCardVariants = tv({
  slots: {
    wrapper:
      'group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border',
    background: 'absolute inset-0 bg-gradient-to-br',
    decorativeBlur: 'absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl',
    accentBar: 'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
    content: 'relative p-4 flex flex-col items-center text-center gap-3',
    kbd: 'px-3 py-1.5 text-sm font-mono font-semibold rounded-lg shadow-sm',
  },
  variants: {
    color: {
      slate: {
        wrapper: 'border-slate-200/50 dark:border-slate-700/30',
        background:
          'from-slate-50 via-slate-100 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50',
        decorativeBlur: 'bg-gradient-to-br from-slate-400/10 to-slate-500/10',
        accentBar: 'from-slate-400 via-slate-500 to-slate-400',
        kbd: 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200',
      },
    },
  },
  defaultVariants: {
    color: 'slate',
  },
})

/**
 * Search input container variants
 */
export const searchInputVariants = tv({
  slots: {
    wrapper: 'relative',
    iconWrapper: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none',
    icon: 'text-slate-400 dark:text-slate-500',
    clearButton:
      'absolute inset-y-0 right-0 pr-2 flex items-center justify-center w-10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-lg',
  },
})

/**
 * Checkbox with label variants
 */
export const checkboxLabelVariants = tv({
  slots: {
    wrapper: 'flex items-center gap-2',
    checkbox:
      'rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0',
    label: 'text-sm text-slate-700 dark:text-slate-300',
  },
})

/**
 * Modal footer action bar variants
 */
export const modalFooterVariants = tv({
  base: 'p-4 border-t flex justify-end gap-3 sticky bottom-0',
  variants: {
    variant: {
      default: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
      transparent:
        'border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

/**
 * Section title variants for page headers
 */
export const sectionTitleVariants = tv({
  slots: {
    wrapper: '',
    header: 'flex items-center gap-2 mb-2',
    title: 'text-xl font-semibold text-slate-900 dark:text-slate-100',
    description: 'mt-1 ml-8',
  },
})

/**
 * Link card label text variants
 */
export const linkCardLabelVariants = tv({
  base: 'text-sm font-medium transition-colors',
  variants: {
    active: {
      true: 'text-blue-600 dark:text-blue-400',
      false:
        'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400',
    },
  },
  defaultVariants: {
    active: false,
  },
})
