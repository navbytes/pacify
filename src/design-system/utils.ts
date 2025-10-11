/**
 * Design System Utilities
 *
 * Helper functions for generating class names and handling design tokens
 */

import { spacing, type Spacing } from './tokens'

/**
 * Combines class names, filtering out falsy values
 * Similar to clsx/classnames libraries
 *
 * @example
 * cn('foo', false && 'bar', 'baz') // 'foo baz'
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Generates spacing class for a given property
 *
 * @example
 * getSpacingClass('p', 'sm') // 'p-3'
 * getSpacingClass('gap', 'md') // 'gap-4'
 */
export function getSpacingClass(
  prop:
    | 'p'
    | 'px'
    | 'py'
    | 'pt'
    | 'pr'
    | 'pb'
    | 'pl'
    | 'm'
    | 'mx'
    | 'my'
    | 'mt'
    | 'mr'
    | 'mb'
    | 'ml'
    | 'gap',
  value?: Spacing
): string {
  if (!value) return ''
  const spacingValue = spacing[value]
  return `${prop}-${spacingValue}`
}

/**
 * Generates background color class with dark mode variant
 *
 * @example
 * getBgClass('white') // 'bg-white dark:bg-gray-800'
 * getBgClass('gray-100') // 'bg-gray-100 dark:bg-gray-700'
 */
export function getBgClass(color?: string): string {
  if (!color) return ''

  // Special case: white -> slate-800 in dark mode
  if (color === 'white') {
    return 'bg-white dark:bg-slate-800'
  }

  // Extract color family and shade (e.g., 'slate-100' -> ['slate', '100'])
  const match = color.match(/^(\w+)-(\d+)$/)
  if (match) {
    const [, colorFamily, shade] = match
    const shadeNum = parseInt(shade, 10)

    // Invert shade for dark mode (lighter -> darker)
    // 100 -> 700, 200 -> 600, 300 -> 500, etc.
    const darkShade = 800 - shadeNum
    return `bg-${color} dark:bg-${colorFamily}-${darkShade}`
  }

  // Fallback: just use the color as-is
  return `bg-${color}`
}

/**
 * Generates text color class with dark mode variant
 *
 * @example
 * getTextClass('gray-700') // 'text-gray-700 dark:text-gray-300'
 * getTextClass('primary') // 'text-primary dark:text-primary-light'
 */
export function getTextClass(color?: string): string {
  if (!color) return ''

  // Special case: semantic colors with custom dark variants
  if (color === 'primary') {
    return 'text-primary dark:text-primary-light'
  }

  // Extract color family and shade
  const match = color.match(/^(\w+)-(\d+)$/)
  if (match) {
    const [, colorFamily, shade] = match
    const shadeNum = parseInt(shade, 10)

    // Invert shade for dark mode
    const darkShade = 800 - shadeNum
    return `text-${color} dark:text-${colorFamily}-${darkShade}`
  }

  // Fallback
  return `text-${color}`
}

/**
 * Generates border color class with dark mode variant
 *
 * @example
 * getBorderClass('slate-200') // 'border-slate-200 dark:border-slate-700'
 */
export function getBorderClass(color?: string): string {
  if (!color) return ''

  // Extract color family and shade
  const match = color.match(/^(\w+)-(\d+)$/)
  if (match) {
    const [, colorFamily, shade] = match
    const shadeNum = parseInt(shade, 10)

    // Invert shade for dark mode
    const darkShade = 800 - shadeNum
    return `border-${color} dark:border-${colorFamily}-${darkShade}`
  }

  // Fallback
  return `border-${color}`
}

/**
 * Generates hover background class
 *
 * @example
 * getHoverBgClass('slate-50') // 'hover:bg-slate-50 dark:hover:bg-slate-700'
 */
export function getHoverBgClass(color?: string): string {
  if (!color) return ''

  const match = color.match(/^(\w+)-(\d+)$/)
  if (match) {
    const [, colorFamily, shade] = match
    const shadeNum = parseInt(shade, 10)
    const darkShade = 800 - shadeNum
    return `hover:bg-${color} dark:hover:bg-${colorFamily}-${darkShade}`
  }

  return `hover:bg-${color}`
}
