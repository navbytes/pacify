<script context="module" lang="ts">
  // Define supported colors.
  export type ButtonColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'

  // Define props interface (if you want to extend later)
  export interface LabelButtonProps {
    color?: ButtonColor
    minimal?: boolean
    icon?: typeof SvelteComponent
  }
  export type HideType = 'hidden' | 'invisible'
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte'

  // Props with default values.
  export let color: ButtonColor = 'primary'
  export let minimal: boolean = false
  export let hideType: HideType = 'hidden'
  export let icon: typeof SvelteComponent | null = null

  /*
    Define Tailwind CSS classes for each state:
    - "base" for the regular (filled) style,
    - "minimal" for a style with only text (or icon) without a background border.
    The dark: variants apply when your app toggles dark mode.
  */
  const colors: Record<ButtonColor, { base: string; minimal: string }> = {
    primary: {
      base: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800',
      minimal:
        'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500',
    },
    secondary: {
      base: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800',
      minimal:
        'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-500',
    },
    success: {
      base: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800',
      minimal:
        'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-500',
    },
    error: {
      base: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800',
      minimal:
        'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500',
    },
    info: {
      base: 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-800',
      minimal:
        'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500',
    },
  }

  // Compute the classes based on the minimal flag and selected color.
  $: labelClasses = minimal
    ? `inline-flex items-center focus:outline-none ${colors[color].minimal}`
    : `inline-flex items-center py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[color].base}`
</script>

<label class={labelClasses}>
  {#if icon}
    <!-- If both an icon and text exist, add margin to the icon -->
    <svelte:component this={icon} class={$$slots.default ? 'mr-2' : ''} />
  {/if}
  {#if $$slots.default}
    <slot />
  {/if}
  {#if $$slots.input}
    <!-- Wrap the input slot in a hidden span so that it is still part of the DOM,
         but not visible. -->
    <span class={hideType}>
      <slot name="input" />
    </span>
  {/if}
</label>
