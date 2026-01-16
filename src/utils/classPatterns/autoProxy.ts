/**
 * AutoProxy-specific class patterns
 * These variants are used exclusively by AutoProxy components
 */

import { tv } from 'tailwind-variants'

/**
 * Gradient section card variants for AutoProxy and similar components
 * Provides colored sections with gradient backgrounds and accent bars
 */
export const gradientSectionVariants = tv({
  slots: {
    wrapper: 'relative overflow-hidden rounded-xl',
    background: 'absolute inset-0',
    accentBar: 'absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r',
    content: 'relative p-4 border rounded-xl',
    decorativeBlur: 'absolute w-24 h-24 rounded-full blur-2xl',
  },
  variants: {
    color: {
      purple: {
        background:
          'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20',
        accentBar: 'from-violet-500 via-purple-500 to-fuchsia-500',
        content: 'border-purple-200/50 dark:border-purple-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-400/5 dark:to-pink-400/5',
      },
      blue: {
        background:
          'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-violet-950/20',
        accentBar: 'from-blue-500 via-indigo-500 to-violet-500',
        content: 'border-blue-200/50 dark:border-blue-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-blue-400/10 to-indigo-400/10 dark:from-blue-400/5 dark:to-indigo-400/5',
      },
      cyan: {
        background:
          'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20',
        accentBar: 'from-cyan-500 via-blue-500 to-indigo-500',
        content: 'border-cyan-200/50 dark:border-cyan-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-cyan-400/10 to-blue-400/10 dark:from-cyan-400/5 dark:to-blue-400/5',
      },
      teal: {
        background:
          'bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-teal-950/20 dark:via-emerald-950/20 dark:to-green-950/20',
        accentBar: 'from-teal-500 via-emerald-500 to-green-500',
        content: 'border-teal-200/50 dark:border-teal-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-teal-400/10 to-emerald-400/10 dark:from-teal-400/5 dark:to-emerald-400/5',
      },
      amber: {
        background:
          'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20',
        accentBar: 'from-amber-500 via-yellow-500 to-orange-500',
        content: 'border-amber-200/50 dark:border-amber-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-400/5 dark:to-orange-400/5',
      },
      orange: {
        background:
          'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20',
        accentBar: 'from-amber-500 via-orange-500 to-yellow-500',
        content: 'border-amber-200/50 dark:border-amber-800/30',
        decorativeBlur:
          'bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-400/5 dark:to-orange-400/5',
      },
      slate: {
        background:
          'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/20 dark:via-gray-950/20 dark:to-zinc-950/20',
        accentBar: 'from-slate-400 via-gray-500 to-zinc-400',
        content: 'border-slate-200/50 dark:border-slate-700/30',
        decorativeBlur:
          'bg-gradient-to-br from-slate-400/10 to-gray-400/10 dark:from-slate-400/5 dark:to-gray-400/5',
      },
      red: {
        background:
          'bg-linear-to-r from-red-500/10 to-rose-500/10 dark:from-red-500/5 dark:to-rose-500/5',
        accentBar: 'from-red-500 to-rose-500',
        content: 'border-red-200 dark:border-red-800',
        decorativeBlur: 'bg-gradient-to-br from-red-400/10 to-rose-400/10',
      },
      green: {
        background:
          'bg-linear-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:via-green-500/5 dark:to-teal-500/5',
        accentBar: 'from-emerald-500 via-green-500 to-teal-500',
        content: 'border-green-200 dark:border-green-800',
        decorativeBlur: 'bg-gradient-to-br from-green-400/10 to-emerald-400/10',
      },
    },
    rounded: {
      xl: {
        wrapper: 'rounded-xl',
        content: 'rounded-xl',
      },
      '2xl': {
        wrapper: 'rounded-2xl',
        content: 'rounded-2xl',
      },
    },
    accentHeight: {
      thin: { accentBar: 'h-0.5' },
      normal: { accentBar: 'h-1' },
    },
  },
  defaultVariants: {
    color: 'slate',
    rounded: 'xl',
    accentHeight: 'thin',
  },
})

/**
 * Gradient icon badge variants for section headers
 * Small icons with gradient backgrounds and glow effects
 */
export const gradientIconBadgeVariants = tv({
  slots: {
    wrapper: 'relative',
    glow: 'absolute inset-0 rounded-lg blur-md opacity-30',
    badge: 'relative rounded-lg shadow-lg flex items-center justify-center',
  },
  variants: {
    color: {
      purple: {
        glow: 'bg-gradient-to-br from-violet-400 to-purple-500',
        badge: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20',
      },
      blue: {
        glow: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        badge: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20',
      },
      cyan: {
        glow: 'bg-gradient-to-br from-cyan-400 to-blue-500',
        badge: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20',
      },
      teal: {
        glow: 'bg-gradient-to-br from-teal-400 to-emerald-500',
        badge: 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20',
      },
      amber: {
        glow: 'bg-gradient-to-br from-amber-400 to-orange-500',
        badge: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20',
      },
      orange: {
        glow: 'bg-gradient-to-br from-orange-400 to-red-500',
        badge: 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20',
      },
      slate: {
        glow: 'bg-gradient-to-br from-slate-400 to-gray-500',
        badge: 'bg-gradient-to-br from-slate-500 to-gray-600',
      },
      green: {
        glow: 'bg-gradient-to-br from-green-400 to-emerald-500',
        badge: 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20',
      },
      red: {
        glow: 'bg-gradient-to-br from-red-400 to-rose-500',
        badge: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20',
      },
    },
    size: {
      sm: { badge: 'p-1.5' },
      md: { badge: 'p-2' },
      lg: { badge: 'p-2.5' },
    },
  },
  defaultVariants: {
    color: 'slate',
    size: 'sm',
  },
})

/**
 * Selection card variants for pattern type selectors and similar
 * Clickable cards with gradient backgrounds when selected
 */
export const selectionCardVariants = tv({
  base: 'relative p-3 rounded-xl border-2 transition-all duration-200 text-left group cursor-pointer',
  variants: {
    selected: {
      true: 'border-transparent shadow-lg scale-[1.02]',
      false:
        'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md',
    },
  },
  defaultVariants: {
    selected: false,
  },
})

/**
 * Get gradient colors for selection cards based on gradient name
 */
export const selectionCardGradients: Record<string, { from: string; to: string }> = {
  purple: { from: '#a855f7', to: '#ec4899' },
  blue: { from: '#3b82f6', to: '#06b6d4' },
  orange: { from: '#f97316', to: '#ef4444' },
  green: { from: '#22c55e', to: '#10b981' },
  red: { from: '#ef4444', to: '#f43f5e' },
  cyan: { from: '#06b6d4', to: '#3b82f6' },
  amber: { from: '#f59e0b', to: '#f97316' },
  teal: { from: '#14b8a6', to: '#22c55e' },
}

/**
 * Enhanced input variants for AutoProxy forms
 */
export const formInputVariants = tv({
  base: 'w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    state: {
      default: 'border-slate-200 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500',
      error: 'border-red-400 focus:ring-red-500 focus:border-red-500',
      success: 'border-green-400 focus:ring-green-500 focus:border-green-500',
      purple:
        'border-purple-200 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500',
      teal: 'border-teal-200 dark:border-teal-700 focus:ring-teal-500 focus:border-teal-500',
      cyan: 'border-slate-200 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/10',
    },
    variant: {
      default: '',
      mono: 'font-mono',
    },
  },
  defaultVariants: {
    state: 'default',
    variant: 'default',
  },
})

/**
 * Inner content wrapper for gradient sections
 */
export const sectionInnerContentVariants = tv({
  base: 'backdrop-blur-sm rounded-xl p-3 border',
  variants: {
    color: {
      blue: 'bg-white/60 dark:bg-slate-800/60 border-blue-200/50 dark:border-blue-800/30',
      amber: 'bg-white/60 dark:bg-slate-800/60 border-amber-200/50 dark:border-amber-800/30',
      cyan: 'bg-white/60 dark:bg-slate-800/60 border-cyan-200/50 dark:border-cyan-800/30',
      slate: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    },
  },
  defaultVariants: {
    color: 'slate',
  },
})

/**
 * Rule list item variants for AutoProxy rules
 * Provides card styling with accent bars and hover effects
 */
export const ruleListItemVariants = tv({
  slots: {
    wrapper:
      'group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01]',
    background:
      'absolute inset-0 bg-linear-to-r from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700',
    accentBar: 'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
    content:
      'relative p-4 pl-5 border border-l-0 rounded-xl rounded-l-none border-slate-200/80 dark:border-slate-700/50',
    dragHandle:
      'cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors',
    priorityBadge:
      'flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center',
    patternCode:
      'text-sm font-mono font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-lg truncate max-w-[300px] border border-slate-200 dark:border-slate-600',
    actions: 'flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity',
  },
  variants: {
    enabled: {
      true: {},
      false: { wrapper: 'opacity-50' },
    },
    dragging: {
      true: { wrapper: 'ring-2 ring-purple-500 shadow-xl' },
      false: {},
    },
    orphaned: {
      true: {
        content: 'border-amber-300 dark:border-amber-700',
      },
      false: {},
    },
  },
  defaultVariants: {
    enabled: true,
    dragging: false,
    orphaned: false,
  },
})

/**
 * Match type badge gradient lookup
 */
export const matchTypeBadgeGradients: Record<string, string> = {
  wildcard: 'from-purple-500 to-pink-500',
  exact: 'from-blue-500 to-cyan-500',
  regex: 'from-orange-500 to-red-500',
  cidr: 'from-green-500 to-emerald-500',
}

/**
 * Match type badge variants
 */
export const matchTypeBadgeVariants = tv({
  base: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-linear-to-r',
})

/**
 * Proxy type icon wrapper variants
 */
export const proxyTypeIconVariants = tv({
  base: 'p-1 rounded-md',
  variants: {
    type: {
      direct: 'bg-green-100 dark:bg-green-900/30',
      inline: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
  },
})

/**
 * Warning badge variants for orphaned rules
 */
export const warningBadgeVariants = tv({
  base: 'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
  variants: {
    color: {
      amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
      red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    },
  },
  defaultVariants: {
    color: 'amber',
  },
})

/**
 * Empty state card variants
 */
export const emptyStateCardVariants = tv({
  slots: {
    wrapper: 'relative overflow-hidden rounded-2xl border-2 border-dashed p-8',
    background: 'absolute inset-0',
    content: 'relative text-center',
    iconWrapper: 'inline-flex p-4 rounded-2xl mb-4',
    title: 'text-lg font-semibold mb-2',
    description: 'text-sm max-w-sm mx-auto mb-6',
  },
  variants: {
    color: {
      purple: {
        wrapper: 'border-slate-200 dark:border-slate-700',
        background:
          'bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 dark:from-purple-950/20 dark:via-transparent dark:to-pink-950/20',
        iconWrapper:
          'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
        title: 'text-slate-800 dark:text-slate-200',
        description: 'text-slate-500 dark:text-slate-400',
      },
      slate: {
        wrapper: 'border-slate-200 dark:border-slate-700',
        background:
          'bg-gradient-to-br from-slate-50/50 via-transparent to-gray-50/50 dark:from-slate-950/20 dark:via-transparent dark:to-gray-950/20',
        iconWrapper:
          'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30',
        title: 'text-slate-800 dark:text-slate-200',
        description: 'text-slate-500 dark:text-slate-400',
      },
    },
  },
  defaultVariants: {
    color: 'slate',
  },
})

/**
 * Modal backdrop variants for AutoProxy and similar modals
 */
export const modalBackdropVariants = tv({
  slots: {
    container:
      'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
    background:
      'absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/40 to-slate-900/80 backdrop-blur-md transition-opacity duration-300',
  },
  variants: {
    visible: {
      true: {
        container: 'opacity-100',
        background: 'opacity-100',
      },
      false: {
        container: 'opacity-0',
        background: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    visible: false,
  },
})

/**
 * Modal content variants for AutoProxy and similar modals
 */
export const modalContentVariants = tv({
  slots: {
    wrapper:
      'relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col w-full overflow-hidden border border-white/20 dark:border-slate-700/50 transition-all duration-300 transform',
    accentBar: 'absolute top-0 left-0 right-0 h-1 bg-linear-to-r',
    header: 'relative px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80',
    headerBackground: 'absolute inset-0',
    body: 'flex-1 overflow-y-auto px-6 py-6 space-y-6',
    footer: 'relative px-6 py-4 border-t border-slate-200/80 dark:border-slate-700/80',
    footerBackground: 'absolute inset-0',
  },
  variants: {
    visible: {
      true: {
        wrapper: 'scale-100 translate-y-0',
      },
      false: {
        wrapper: 'scale-95 translate-y-4',
      },
    },
    size: {
      md: { wrapper: 'max-w-lg max-h-[90vh]' },
      lg: { wrapper: 'max-w-2xl max-h-[90vh]' },
      xl: { wrapper: 'max-w-4xl max-h-[90vh]' },
    },
    color: {
      orange: {
        accentBar: 'from-orange-500 via-amber-500 to-yellow-500',
        headerBackground:
          'bg-linear-to-r from-orange-50/50 via-transparent to-amber-50/50 dark:from-orange-950/20 dark:via-transparent dark:to-amber-950/20',
        footerBackground:
          'bg-linear-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50',
      },
      purple: {
        accentBar: 'from-violet-500 via-purple-500 to-fuchsia-500',
        headerBackground:
          'bg-linear-to-r from-purple-50/50 via-transparent to-fuchsia-50/50 dark:from-purple-950/20 dark:via-transparent dark:to-fuchsia-950/20',
        footerBackground:
          'bg-linear-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50',
      },
      blue: {
        accentBar: 'from-blue-500 via-indigo-500 to-violet-500',
        headerBackground:
          'bg-linear-to-r from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20',
        footerBackground:
          'bg-linear-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50',
      },
    },
  },
  defaultVariants: {
    visible: false,
    size: 'xl',
    color: 'orange',
  },
})

/**
 * Basic settings card variants for modal forms
 */
export const settingsCardVariants = tv({
  base: 'relative p-5 rounded-xl bg-gradient-to-br border',
  variants: {
    color: {
      slate:
        'from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 border-slate-200/80 dark:border-slate-700/50',
      blue: 'from-blue-50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20 border-blue-300 dark:border-blue-700',
    },
  },
  defaultVariants: {
    color: 'slate',
  },
})

/**
 * Rule count badge variants
 */
export const ruleCountBadgeVariants = tv({
  base: 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
  variants: {
    color: {
      slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    },
  },
  defaultVariants: {
    color: 'slate',
  },
})
