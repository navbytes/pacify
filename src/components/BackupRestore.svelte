<script lang="ts">
import { ALERT_TYPES, ERROR_TYPES } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { NotifyService } from '@/services/NotifyService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { toastStore } from '@/stores/toastStore'
import { Download, Upload } from '@/utils/icons'
import Button from './Button.svelte'
import FlexGroup from './FlexGroup.svelte'
import LabelButton from './LabelButton.svelte'
import Text from './Text.svelte'

interface Props {
  onRestore: () => Promise<void>
}

let { onRestore }: Props = $props()

// Handle the backup action
async function handleBackup() {
  try {
    await SettingsWriter.backupSettings()
    toastStore.show(I18nService.getMessage('backupSuccess'), 'success')
    NotifyService.alert(ALERT_TYPES.BACKUP_SUCCESS)
  } catch (error) {
    toastStore.show(I18nService.getMessage('backupFailed'), 'error')
    NotifyService.error(ERROR_TYPES.BACKUP, error)
  }
}

// Handle the restore action
async function handleRestore(event: Event) {
  const input = event.target as HTMLInputElement
  if (input?.files?.[0]) {
    try {
      await SettingsWriter.restoreSettings(input.files[0])
      toastStore.show(I18nService.getMessage('restoreSuccess'), 'success')

      // Call onRestore to refresh the UI
      await onRestore()

      // Clear the file input so same file can be selected again
      if (input) {
        input.value = ''
      }

      NotifyService.alert(ALERT_TYPES.RESTORE_SUCCESS)
    } catch (error) {
      const errorMessage = (error as Error).message || I18nService.getMessage('restoreFailed')
      toastStore.show(errorMessage, 'error')
      NotifyService.alert(errorMessage)

      // Clear the file input on error too
      if (input) {
        input.value = ''
      }
    }
  }
}
</script>

<div class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Backup Settings -->
    <FlexGroup
      classes="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800"
      direction="vertical"
      childrenGap="xs"
    >
      <Button
        color="secondary"
        onclick={handleBackup}
        aria-label="Backup all proxy configurations and settings"
      >
        {#snippet icon()}
          <Download size={18} />
        {/snippet}
        {I18nService.getMessage('backupSettings')}
      </Button>
      <Text as="p" size="xs" color="muted" classes="px-1">
        {I18nService.getMessage('backupDescription')}
      </Text>
    </FlexGroup>

    <!-- Restore Settings -->
    <FlexGroup
      classes="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800"
      direction="vertical"
      childrenGap="xs"
    >
      <LabelButton color="secondary" icon={Upload}>
        {I18nService.getMessage('restoreSettings')}
        {#snippet input()}
          <input
            type="file"
            accept=".json"
            onchange={handleRestore}
            aria-label="Upload backup file to restore configurations"
          >
        {/snippet}
      </LabelButton>
      <Text as="p" size="xs" color="muted" classes="px-1">
        {I18nService.getMessage('restoreDescription')}
      </Text>
    </FlexGroup>
  </div>
</div>
