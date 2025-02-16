<script lang="ts">
  import { onMount } from 'svelte'

  let error: Error | null = null
  let hasError = false

  function handleError(event: ErrorEvent) {
    hasError = true
    error = event.error
    console.error('Component Error:', event.error)
  }

  onMount(() => {
    window.addEventListener('error', handleError)
    return () => {
      window.removeEventListener('error', handleError)
    }
  })
</script>

{#if hasError && error}
  <div class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
    <h3 class="font-bold">Something went wrong</h3>
    <p class="text-sm">{error.message}</p>
    <button
      class="mt-2 text-sm text-red-600 hover:text-red-800"
      on:click={() => {
        hasError = false
        error = null
      }}
    >
      Try Again
    </button>
  </div>
{:else}
  <slot />
{/if}
