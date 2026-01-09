<script lang="ts">
import { onMount } from 'svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import Text from '../Text.svelte'

let { children } = $props()

let error = $state<Error | null>(null)
let hasError = $state(false)

function handleError(event: ErrorEvent) {
  hasError = true
  error = event.error
  logger.error('Component Error:', event.error)
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
    <Text as="h3" weight="bold">{I18nService.getMessage('errorBoundaryTitle')}</Text>
    <Text as="p" size="sm">{error.message}</Text>
    <button
      class="mt-2 text-sm text-red-600 hover:text-red-800"
      onclick={() => {
        hasError = false
        error = null
      }}
    >
      {I18nService.getMessage('errorBoundaryRetry')}
    </button>
  </div>
{:else}
  {@render children?.()}
{/if}
