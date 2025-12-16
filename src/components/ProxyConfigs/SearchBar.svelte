<script lang="ts">
  import { Search, X } from '@/utils/icons'
  import { I18nService } from '@/services/i18n/i18nService'
  import { inputVariants } from '@/utils/classPatterns'
  import { cn } from '@/utils/cn'

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

<div class="relative">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Search size={18} class="text-slate-400 dark:text-slate-500" />
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
  />
  {#if searchQuery}
    <button
      type="button"
      onclick={handleClear}
      class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
    >
      <X size={18} class="text-slate-400 dark:text-slate-500" />
    </button>
  {/if}
</div>
