<script lang="ts">
  import { Server } from 'lucide-svelte'

  export let proxyMode: string = 'system'

  const options = [
    { value: 'system', label: 'System' },
    { value: 'direct', label: 'Direct' },
    { value: 'auto_detect', label: 'Auto‑config URL' },
    { value: 'pac_script', label: 'PAC Script' },
    { value: 'fixed_servers', label: 'Manual Configuration' },
  ]

  function selectOption(value: string) {
    proxyMode = value
  }
</script>

<div>
  <div
    class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
  >
    <Server size={20} />
    Proxy Mode <span class="text-red-500">*</span>
  </div>

  <div
    class="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl flex flex-wrap gap-2"
  >
    {#each options as option}
      <button
        type="button"
        on:click={() => selectOption(option.value)}
        on:keydown={(e) => e.key === 'Enter' && selectOption(option.value)}
        class="flex-grow cursor-pointer border rounded-md p-3 text-center text-sm font-medium transition-colors duration-150 ease-in-out
  
  {proxyMode === option.value
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'}"
        role="option"
        aria-selected={proxyMode === option.value}
      >
        {option.label}
      </button>
    {/each}
  </div>
</div>
