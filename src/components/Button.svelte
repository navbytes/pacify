<script lang="ts">
  // Define types within the component
  type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'info'

  interface Props {
    classes?: string
    color?: ButtonColor
    minimal?: boolean
    icon?: () => any
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onclick?: (event: MouseEvent) => void
    children?: () => any
  }

  const {
    classes = '',
    color = 'primary',
    minimal = false,
    icon = undefined,
    disabled = false,
    type = 'button',
    onclick = undefined,
    children = undefined,
  }: Props = $props()

  // Color mapping remains the same
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

  // Use $derived instead of $: for computed values
  const btnClasses = $derived(
    minimal
      ? `inline-flex items-center focus:outline-none ${colors[color].minimal}`
      : `inline-flex items-center py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[color].base}`
  )

  const disabledClasses = $derived(
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  )

  const combinedClasses = $derived(
    `${btnClasses} ${disabledClasses} ${classes}`.trim()
  )
</script>

<button {type} class={combinedClasses} {disabled} {onclick}>
  {#if icon}
    <!-- Use the @render tag to render the icon component -->
    <span class={children ? 'mr-2' : ''}>
      {@render icon()}
    </span>
  {/if}
  {@render children?.()}
</button>
