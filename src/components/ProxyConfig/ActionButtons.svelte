<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { Loader2 } from '@/utils/icons'
import Button from '../Button.svelte'

interface Props {
  isSubmitting?: boolean
  onCancel: () => void
}

let { isSubmitting = false, onCancel }: Props = $props()
</script>

<div
  class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800"
>
  <Button
    color="secondary"
    onclick={onCancel}
    disabled={isSubmitting}
    data-testid="cancel-config-btn"
  >
    {I18nService.getMessage('cancel')}
  </Button>
  <!-- Using type="submit" lets the enclosing form trigger the submit event -->
  <Button color="primary" type="submit" disabled={isSubmitting} data-testid="save-config-btn">
    {#snippet icon()}
      {#if isSubmitting}
        <Loader2 size={16} class="animate-spin" />
      {/if}
    {/snippet}
    {isSubmitting ? I18nService.getMessage('saving') : I18nService.getMessage('saveConfiguration')}
  </Button>
</div>
