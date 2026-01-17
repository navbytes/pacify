/**
 * Centralized theme configuration for consistent color usage across components
 */

// Color intent mappings
export const colors = {
  // Primary brand colors
  primary: {
    light: 'bg-blue-50 dark:bg-blue-950/20',
    base: 'bg-blue-500 dark:bg-blue-600',
    hover: 'hover:bg-blue-600 dark:hover:bg-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    borderLeft: 'border-l-blue-500 dark:border-l-blue-400',
    ring: 'ring-blue-500 dark:ring-blue-400',
  },

  // Status colors
  success: {
    light: 'bg-green-50 dark:bg-green-950/20',
    base: 'bg-green-500 dark:bg-green-600',
    hover: 'hover:bg-green-600 dark:hover:bg-green-700',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    borderLeft: 'border-l-green-500 dark:border-l-green-400',
  },

  warning: {
    light: 'bg-yellow-50 dark:bg-yellow-950/20',
    base: 'bg-yellow-500 dark:bg-yellow-600',
    hover: 'hover:bg-yellow-600 dark:hover:bg-yellow-700',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    borderLeft: 'border-l-yellow-500 dark:border-l-yellow-400',
  },

  danger: {
    light: 'bg-red-50 dark:bg-red-950/20',
    base: 'bg-red-500 dark:bg-red-600',
    hover: 'hover:bg-red-600 dark:hover:bg-red-700',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    borderLeft: 'border-l-red-500 dark:border-l-red-400',
  },

  info: {
    light: 'bg-blue-50 dark:bg-blue-950/20',
    base: 'bg-blue-500 dark:bg-blue-600',
    hover: 'hover:bg-blue-600 dark:hover:bg-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },

  // UI colors
  background: {
    default: 'bg-white dark:bg-slate-800',
    elevated: 'bg-white dark:bg-slate-900',
    muted: 'bg-slate-50 dark:bg-slate-900/50',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
    active: 'bg-linear-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-800',
    inactive: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50',
  },

  text: {
    default: 'text-slate-900 dark:text-white',
    muted: 'text-slate-600 dark:text-slate-400',
    subtle: 'text-slate-500 dark:text-slate-500',
    inverse: 'text-white dark:text-slate-900',
  },

  border: {
    default: 'border-slate-200 dark:border-slate-700',
    muted: 'border-slate-100 dark:border-slate-800',
    strong: 'border-slate-300 dark:border-slate-600',
  },

  // Icon/decorative colors
  icon: {
    default: 'text-slate-600 dark:text-slate-400',
    muted: 'text-slate-400 dark:text-slate-600',
    primary: 'text-blue-600 dark:text-blue-400',
  },

  // Interactive states
  interactive: {
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    active: 'active:bg-slate-200 dark:active:bg-slate-700',
    focus:
      'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2',
    disabled: 'opacity-50 cursor-not-allowed',
  },
}

// Semantic color mappings for specific use cases
export const semantic = {
  card: {
    default: cn(colors.background.default, colors.border.default),
    active: cn(colors.background.active, colors.primary.borderLeft),
    inactive: cn(colors.background.inactive, 'border-l-slate-300 dark:border-l-slate-600'),
    hover: cn(colors.background.hover, 'border', colors.border.default),
  },

  button: {
    primary: cn(colors.primary.base, colors.primary.hover, colors.text.inverse),
    secondary: cn(
      'bg-slate-200 dark:bg-slate-700',
      'hover:bg-slate-300 dark:hover:bg-slate-600',
      colors.text.default
    ),
    danger: cn(colors.danger.base, colors.danger.hover, colors.text.inverse),
    ghost: cn('bg-transparent', colors.interactive.hover, colors.text.default),
  },

  input: {
    default: cn(colors.background.default, colors.border.default, colors.text.default),
    focus: cn(colors.interactive.focus),
    error: cn(colors.danger.border, colors.danger.text),
  },

  badge: {
    primary: cn(colors.primary.light, colors.primary.text),
    success: cn(colors.success.light, colors.success.text),
    warning: cn(colors.warning.light, colors.warning.text),
    danger: cn(colors.danger.light, colors.danger.text),
    neutral: cn('bg-slate-100 dark:bg-slate-800', colors.text.muted),
  },
}

// Shadow presets
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  card: 'shadow-sm hover:shadow-md transition-shadow',
  dropdown: 'shadow-lg',
}

// Border radius presets
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

// Spacing presets
export const spacing = {
  compact: {
    padding: 'p-2',
    gap: 'gap-2',
    margin: 'm-2',
  },
  normal: {
    padding: 'p-4',
    gap: 'gap-4',
    margin: 'm-4',
  },
  spacious: {
    padding: 'p-6',
    gap: 'gap-6',
    margin: 'm-6',
  },
}

// Animation/transition presets
export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
}

// Import cn utility
import { cn } from './cn'

// Helper function to get color by variant
export function getColorByVariant(variant: 'primary' | 'success' | 'warning' | 'danger' | 'info') {
  return colors[variant]
}

// Helper function to get icon color classes
export function getIconColorClasses(color: string): string {
  const colorMap: Record<string, string> = {
    blue: colors.primary.text,
    green: colors.success.text,
    yellow: colors.warning.text,
    red: colors.danger.text,
    slate: colors.icon.default,
  }
  return colorMap[color] || colors.icon.default
}

// Helper function to get border color classes
export function getBorderColorClasses(color: string): string {
  const colorMap: Record<string, string> = {
    blue: colors.primary.border,
    green: colors.success.border,
    yellow: colors.warning.border,
    red: colors.danger.border,
    slate: colors.border.default,
  }
  return colorMap[color] || colors.border.default
}
