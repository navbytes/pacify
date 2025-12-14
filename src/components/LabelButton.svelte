<script lang="ts" module>
  import type { ComponentType } from 'svelte'

  // Define supported colors.
  export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'info'

  // Define props interface (if you want to extend later)
  export interface LabelButtonProps {
    color?: ButtonColor
    minimal?: boolean
    icon?: ComponentType
  }
  export type HideType = 'hidden' | 'invisible'
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import Text from './Text.svelte'

  interface Props extends LabelButtonProps {
    hideType?: HideType
    children?: Snippet
    input?: Snippet
  }

  // Props with default values using Svelte 5 $props()
  let {
    color = 'primary',
    minimal = false,
    hideType = 'hidden',
    icon = null,
    children,
    input,
  }: Props = $props()

  /*
    Define Tailwind CSS classes for each state:
    - "base" for the regular (filled) style,
    - "minimal" for a style with only text (or icon) without a background border.
    The dark: variants apply when your app toggles dark mode.
  */
  const colors: Record<ButtonColor, { base: string; minimal: string }> = {
    primary: {
      base: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800',
      minimal: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500',
    },
    secondary: {
      base: 'bg-slate-200 text-black hover:bg-slate-300 focus:ring-slate-300 dark:text-white dark:bg-slate-700 dark:hover:bg-slate-800',
      minimal: 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-500',
    },
    success: {
      base: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800',
      minimal: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-500',
    },
    error: {
      base: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800',
      minimal: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500',
    },
    info: {
      base: 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-800',
      minimal:
        'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500',
    },
  }

  // Compute the classes based on the minimal flag and selected color using Svelte 5 $derived
  const labelClasses = $derived(
    minimal
      ? `inline-flex items-center focus:outline-none ${colors[color].minimal}`
      : `inline-flex items-center py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[color].base}`
  )
</script>

<label class={labelClasses}>
  {#if icon}
    {@const Icon = icon}
    <!-- If both an icon and text exist, add margin to the icon -->
    <Text classes={children ? 'mr-2' : ''}>
      <Icon size={18} />
    </Text>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if input}
    <!-- Wrap the input snippet in a hidden span so that it is still part of the DOM,
         but not visible. -->
    <Text classes={hideType}>
      {@render input()}
    </Text>
  {/if}
</label>
