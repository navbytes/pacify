<script lang="ts">
  import Button from '../Button.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  export let isSubmitting: boolean = false
  export let onCancel: () => void
</script>

<div
  class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800"
>
  <Button color="secondary" on:click={onCancel} disabled={isSubmitting}>
    {I18nService.getMessage('cancel')}
  </Button>
  <!-- Using type="submit" lets the enclosing form trigger the submit event -->
  <Button color="primary" type="submit" disabled={isSubmitting}>
    {isSubmitting
      ? I18nService.getMessage('saving')
      : I18nService.getMessage('saveConfiguration')}
  </Button>
</div>
