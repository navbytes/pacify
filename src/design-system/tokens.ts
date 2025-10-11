/**
 * Design Tokens
 *
 * Centralized design values that map to Tailwind utilities.
 * These tokens ensure consistency across the component system.
 */

/**
 * Spacing scale
 * Maps semantic sizes to Tailwind spacing values
 */
export const spacing = {
  none: 0,
  xxs: 1, // 4px  - gap-1, p-1
  xs: 2, // 8px  - gap-2, p-2
  sm: 3, // 12px - gap-3, p-3
  md: 4, // 16px - gap-4, p-4
  lg: 6, // 24px - gap-6, p-6
  xl: 8, // 32px - gap-8, p-8
  xxl: 12, // 48px - gap-12, p-12
} as const

export type Spacing = keyof typeof spacing

/**
 * Color palette
 * Maps semantic color names to Tailwind color families
 */
export const colors = {
  primary: 'blue',
  secondary: 'gray',
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'indigo',
} as const

export type Color = keyof typeof colors

/**
 * Border radius scale
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const

export type BorderRadius = keyof typeof borderRadius

/**
 * Shadow scale
 */
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const

export type Shadow = keyof typeof shadows

/**
 * Font sizes
 */
export const fontSizes = {
  xs: 'text-xs', // 12px
  sm: 'text-sm', // 14px
  base: 'text-base', // 16px
  lg: 'text-lg', // 18px
  xl: 'text-xl', // 20px
  '2xl': 'text-2xl', // 24px
  '3xl': 'text-3xl', // 30px
} as const

export type FontSize = keyof typeof fontSizes

/**
 * Font weights
 */
export const fontWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const

export type FontWeight = keyof typeof fontWeights

/**
 * Text alignment
 */
export const textAligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
} as const

export type TextAlign = keyof typeof textAligns

/**
 * Icon sizes
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof iconSizes

/**
 * Border widths
 */
export const borderWidths = {
  '0': 'border-0',
  '1': 'border',
  '2': 'border-2',
  '4': 'border-4',
} as const

export type BorderWidth = keyof typeof borderWidths

/**
 * Border styles
 */
export const borderStyles = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
} as const

export type BorderStyle = keyof typeof borderStyles
