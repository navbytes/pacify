<script lang="ts">
import { onMount } from 'svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { logger } from '@/services/LoggerService'
import { errorContainerVariants } from '@/utils/classPatterns'
import Button from '../Button.svelte'
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
  <div class={errorContainerVariants({ variant: 'subtle' })}>
    <Text as="h3" weight="bold">{I18nService.getMessage('errorBoundaryTitle')}</Text>
    <Text as="p" size="sm">{error.message}</Text>
    <Button
      classes="mt-3"
      variant="gradient"
      gradient="red"
      size="sm"
      onclick={() => {
        hasError = false
        error = null
      }}
    >
      {I18nService.getMessage('errorBoundaryRetry')}
    </Button>
  </div>
{:else}
  {@render children?.()}
{/if}
