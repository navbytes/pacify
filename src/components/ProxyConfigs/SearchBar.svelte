<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { inputVariants, searchInputVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Search, X } from '@/utils/icons'

const styles = searchInputVariants()

interface Props {
  searchQuery: string
  onsearch: (query: string) => void
  onfocus?: () => void
}

let { searchQuery = $bindable(), onsearch, onfocus }: Props = $props()

let searchInputRef = $state<HTMLInputElement>()

function handleClear() {
  searchQuery = ''
  onsearch('')
  searchInputRef?.focus()
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  onsearch(target.value)
}

// Expose focus method for parent component
export function focus() {
  searchInputRef?.focus()
}

export function blur() {
  searchInputRef?.blur()
}
</script>

<div class={styles.wrapper()}>
  <div class={styles.iconWrapper()}>
    <Search size={18} class={styles.icon()} />
  </div>
  <input
    bind:this={searchInputRef}
    bind:value={searchQuery}
    type="text"
    placeholder={I18nService.getMessage('searchProxiesPlaceholder')}
    oninput={handleInput}
    {onfocus}
    class={cn(
      inputVariants({ state: 'default', size: 'md' }),
      'block pl-10 pr-10 py-2.5 rounded-lg transition-all duration-150'
    )}
  >
  {#if searchQuery}
    <button
      type="button"
      onclick={handleClear}
      class={cn(styles.clearButton(), 'hover:text-slate-700 dark:hover:text-slate-300')}
      aria-label="Clear search"
    >
      <X size={18} class={cn(styles.icon(), 'hover:text-slate-600 dark:hover:text-slate-300')} />
    </button>
  {/if}
</div>
