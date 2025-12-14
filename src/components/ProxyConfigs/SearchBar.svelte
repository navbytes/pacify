<script lang="ts">
  import { Search, X } from 'lucide-svelte'

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
    placeholder="Search proxies... (Ctrl+K)"
    oninput={handleInput}
    {onfocus}
    class="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
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
