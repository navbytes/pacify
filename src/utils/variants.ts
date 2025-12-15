/**
 * Type-safe variant utility for creating component variants
 * Provides CVA-like functionality using clsx and tailwind-merge
 */

import { cn } from './cn'

type VariantConfig<T extends Record<string, Record<string, string>>> = {
  base?: string
  variants: T
  compoundVariants?: Array<
    {
      [K in keyof T]?: keyof T[K]
    } & {
      class: string
    }
  >
  defaultVariants?: {
    [K in keyof T]?: keyof T[K]
  }
}

type VariantProps<T extends Record<string, Record<string, string>>> = {
  [K in keyof T]?: keyof T[K]
} & {
  class?: string
}

/**
 * Creates a variant function for type-safe component styling
 *
 * @example
 * const buttonVariants = createVariants({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     intent: {
 *       primary: 'bg-blue-500 text-white',
 *       secondary: 'bg-gray-200 text-black'
 *     },
 *     size: {
 *       sm: 'text-sm',
 *       md: 'text-base',
 *       lg: 'text-lg'
 *     }
 *   },
 *   defaultVariants: {
 *     intent: 'primary',
 *     size: 'md'
 *   }
 * })
 *
 * // Usage:
 * const className = buttonVariants({ intent: 'secondary', size: 'lg' })
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  config: VariantConfig<T>
) {
  return (props?: VariantProps<T>): string => {
    const { class: className, ...variantProps } = props || {}

    // Start with base classes
    const classes: string[] = []
    if (config.base) {
      classes.push(config.base)
    }

    // Apply variant classes
    Object.entries(config.variants).forEach(([variantKey, variantValues]) => {
      const variantValue =
        variantProps[variantKey as keyof T] || config.defaultVariants?.[variantKey as keyof T]

      if (variantValue && variantValues[variantValue as string]) {
        classes.push(variantValues[variantValue as string])
      }
    })

    // Apply compound variants
    if (config.compoundVariants) {
      config.compoundVariants.forEach((compoundVariant) => {
        const { class: compoundClass, ...conditions } = compoundVariant
        const matches = Object.entries(conditions).every(([key, value]) => {
          const propValue = variantProps[key as keyof T] || config.defaultVariants?.[key as keyof T]
          return propValue === value
        })

        if (matches) {
          classes.push(compoundClass)
        }
      })
    }

    // Add custom className if provided
    if (className) {
      classes.push(className)
    }

    return cn(...classes)
  }
}

/**
 * Extract variant props type from a variant function
 */
export type VariantPropsOf<T extends (...args: any) => any> = Parameters<T>[0]
