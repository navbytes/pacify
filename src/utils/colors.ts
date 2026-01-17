/**
 * Predefined colors for proxy configurations
 * These are vibrant, distinguishable colors for easy visual identification
 */

export const PROXY_COLORS = [
  // Blues
  '#3b82f6', // Blue
  '#0ea5e9', // Sky
  '#06b6d4', // Cyan
  '#6366f1', // Indigo

  // Greens
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#84cc16', // Lime

  // Warm colors
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow

  // Purples & Pinks
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink

  // Neutrals with character
  '#f43f5e', // Rose
  '#0891b2', // Cyan dark
  '#059669', // Emerald dark
  '#7c3aed', // Violet dark
] as const

export type ProxyColor = (typeof PROXY_COLORS)[number]

/**
 * Get a random color from the predefined palette
 */
export function getRandomProxyColor(): string {
  return PROXY_COLORS[Math.floor(Math.random() * PROXY_COLORS.length)]
}

/**
 * Default colors for specific proxy types
 */
export const DEFAULT_PROXY_COLOR = '#3b82f6' // Blue
export const DEFAULT_AUTO_PROXY_COLOR = '#f97316' // Orange
