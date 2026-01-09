/**
 * Utility function to merge Tailwind CSS classes with conflict resolution
 * Using tailwind-variants' built-in cn function for optimal performance
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', condition && 'px-4') // => 'py-1 px-4' (when condition is true)
 * cn('text-red-500', { 'text-blue-500': isBlue }) // => 'text-blue-500' (when isBlue is true)
 */
export { cn } from 'tailwind-variants'
