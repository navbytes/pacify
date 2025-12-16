import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', condition && 'px-4') // => 'py-1 px-4' (when condition is true)
 * cn('text-red-500', { 'text-blue-500': isBlue }) // => 'text-blue-500' (when isBlue is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
