<script context="module" lang="ts">
  // Define the supported colors.
  export type ButtonColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
  // Define an interface for the props.
  export interface ButtonProps {
    color?: ButtonColor
    minimal?: boolean
    icon?: typeof SvelteComponent
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte'

  // Default props
  export let color: ButtonColor = 'primary'
  export let minimal: boolean = false
  export let icon: typeof SvelteComponent | null = null
  export let disabled: boolean = false
  export let type: 'button' | 'submit' | 'reset' = 'button'

  /*
   Mapping of each color to its Tailwind class definitions.
   For each color there are two sets of classes:
   - "base": when the button is using the regular (filled) style
   - "minimal": when the button is in minimal mode (only text/icon)
  
   The dark: variants allow the color scheme to flip automatically when
   dark mode is activated (e.g. with a "dark" class on your root HTML element).
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

  /*
    Compute the button classes:
    - In regular (non-minimal) mode, the button uses padding, rounded corners,
      a shadow, and focus ring styling.
    - In minimal mode, only the text color (and hover text change) is applied.
  */
  $: btnClasses = minimal
    ? `inline-flex items-center focus:outline-none ${colors[color].minimal}`
    : `inline-flex items-center py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[color].base}`

  // If disabled, we add opacity and a not-allowed cursor.
  $: disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

  // Final computed classes string.
  $: classes = `${btnClasses} ${disabledClasses}`.trim()
</script>

<button {type} class={classes} {disabled} on:click>
  {#if icon}
    <!-- If both icon and text exist, add margin-right to the icon -->
    <svelte:component this={icon} class={$$slots.default ? 'mr-2' : ''} />
  {/if}
  {#if $$slots.default}
    <slot />
  {/if}
</button>
