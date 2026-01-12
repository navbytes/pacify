<script lang="ts">
import type { ComponentType } from 'svelte'
import { cn } from '@/utils/cn'

type SegmentOption<T extends string> = {
  value: T
  label?: string
  icon?: ComponentType
  badge?: number | string
  disabled?: boolean
}

interface Props<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onchange: (value: T) => void
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  variant?: 'default' | 'pills'
  classes?: string
  'aria-label'?: string
}

let {
  options,
  value = $bindable(),
  onchange,
  size = 'md',
  fullWidth = false,
  variant = 'default',
  classes = '',
  'aria-label': ariaLabel,
}: Props<string> = $props()

// Size configurations
const sizeClasses = {
  sm: {
    container: 'p-1 gap-0.5',
    button: 'px-3 py-1.5 text-sm min-h-[36px]',
    icon: 16,
  },
  md: {
    container: 'p-1 gap-1',
    button: 'px-4 py-2 text-sm min-h-[40px]',
    icon: 18,
  },
  lg: {
    container: 'p-1.5 gap-1',
    button: 'px-5 py-2.5 text-base min-h-[44px]',
    icon: 20,
  },
}

const currentSize = $derived(sizeClasses[size])

function handleClick(optionValue: string) {
  if (optionValue !== value) {
    value = optionValue
    onchange(optionValue)
  }
}

function handleKeydown(event: KeyboardEvent, index: number) {
  const enabledOptions = options.filter((o) => !o.disabled)
  const currentEnabledIndex = enabledOptions.findIndex((o) => o.value === options[index].value)

  let newIndex = -1

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    newIndex = (currentEnabledIndex + 1) % enabledOptions.length
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    newIndex = (currentEnabledIndex - 1 + enabledOptions.length) % enabledOptions.length
  } else if (event.key === 'Home') {
    event.preventDefault()
    newIndex = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    newIndex = enabledOptions.length - 1
  }

  if (newIndex !== -1) {
    const newOption = enabledOptions[newIndex]
    handleClick(newOption.value)
    // Focus the new button
    const buttons = document.querySelectorAll('[role="radio"]')
    const targetIndex = options.findIndex((o) => o.value === newOption.value)
    ;(buttons[targetIndex] as HTMLElement)?.focus()
  }
}
</script>

<div
  class={cn(
    'inline-flex items-center rounded-xl',
    'bg-slate-100 dark:bg-slate-800',
    'border border-slate-200/50 dark:border-slate-700/50',
    currentSize.container,
    fullWidth && 'w-full',
    classes
  )}
  role="radiogroup"
  aria-label={ariaLabel}
>
  {#each options as option, index (option.value)}
    {@const isActive = value === option.value}
    {@const Icon = option.icon}
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      disabled={option.disabled}
      tabindex={isActive ? 0 : -1}
      class={cn(
        'relative inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        currentSize.button,
        fullWidth && 'flex-1',
        isActive
          ? cn(
              'bg-white dark:bg-slate-700',
              'text-slate-900 dark:text-white',
              'shadow-sm',
              variant === 'pills' &&
                'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/20'
            )
          : cn(
              'text-slate-600 dark:text-slate-400',
              'hover:text-slate-900 dark:hover:text-white',
              'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            )
      )}
      onclick={() => !option.disabled && handleClick(option.value)}
      onkeydown={(e) => handleKeydown(e, index)}
    >
      {#if Icon}
        <Icon size={currentSize.icon} aria-hidden="true" />
      {/if}
      {#if option.label}
        <span>{option.label}</span>
      {/if}
      {#if option.badge !== undefined}
        <span
          class={cn(
            'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[18px]',
            isActive
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
          )}
        >
          {option.badge}
        </span>
      {/if}
    </button>
  {/each}
</div>
