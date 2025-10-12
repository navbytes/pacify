<script lang="ts">
  import Text from './Text.svelte'

  // Define types within the component
  type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'info'
  type ButtonSize = 'sm' | 'md' | 'lg'

  interface Props {
    classes?: string
    color?: ButtonColor
    minimal?: boolean
    size?: ButtonSize
    icon?: () => any
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onclick?: (event: MouseEvent) => void
    children?: () => any
    'aria-label'?: string
    'aria-selected'?: 'true' | 'false'
    'data-testid'?: string
    role?: string
  }

  const {
    classes = '',
    color = 'primary',
    minimal = false,
    size = 'md',
    icon = undefined,
    disabled = false,
    type = 'button',
    onclick = undefined,
    children = undefined,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    'data-testid': dataTestId,
    role,
  }: Props = $props()

  // Size mapping
  const sizes: Record<ButtonSize, string> = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  }

  // Color mapping with improved light theme contrast
  const colors: Record<ButtonColor, { base: string; minimal: string }> = {
    primary: {
      base: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800',
      minimal:
        'text-blue-600 hover:text-blue-700 hover:bg-blue-100 border border-transparent hover:border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 dark:hover:border-blue-800 rounded px-2 py-1',
    },
    secondary: {
      base: 'bg-slate-200 text-black hover:bg-slate-300 focus:ring-slate-300 dark:text-white dark:bg-slate-700 dark:hover:bg-slate-800',
      minimal:
        'text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-transparent hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-700 rounded px-2 py-1',
    },
    success: {
      base: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800',
      minimal:
        'text-green-600 hover:text-green-700 hover:bg-green-100 border border-transparent hover:border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20 dark:hover:border-green-800 rounded px-2 py-1',
    },
    error: {
      base: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800',
      minimal:
        'text-red-600 hover:text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 dark:hover:border-red-800 rounded px-2 py-1',
    },
    info: {
      base: 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-800',
      minimal:
        'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/20 dark:hover:border-indigo-800 rounded px-2 py-1',
    },
  }

  // Use $derived instead of $: for computed values
  const btnClasses = $derived(
    minimal
      ? `inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors cursor-pointer ${colors[color].minimal} ${!children ? 'min-w-[44px] min-h-[44px]' : ''}`
      : `inline-flex items-center ${sizes[size]} rounded shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors cursor-pointer ${colors[color].base}`
  )

  const disabledClasses = $derived(disabled ? 'opacity-50 cursor-not-allowed' : '')

  const combinedClasses = $derived(`${btnClasses} ${disabledClasses} ${classes}`.trim())
</script>

<button
  {type}
  class={combinedClasses}
  {disabled}
  onclick={(e) => {
    if (onclick) onclick(e)
  }}
  aria-label={ariaLabel}
  aria-selected={ariaSelected}
  data-testid={dataTestId}
  {role}
>
  {#if icon}
    <!-- Use the @render tag to render the icon component -->
    <Text classes={children ? 'mr-2' : ''}>
      {@render icon()}
    </Text>
  {/if}
  {@render children?.()}
</button>
