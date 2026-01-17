<script lang="ts">
import { ALERT_TYPES, ERROR_TYPES } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { NotifyService } from '@/services/NotifyService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { toastStore } from '@/stores/toastStore'
import { Download, Upload } from '@/utils/icons'
import Button from './Button.svelte'
import Card from './Card.svelte'
import FlexGroup from './FlexGroup.svelte'
import Text from './Text.svelte'

interface Props {
  onRestore: () => Promise<void>
}

let { onRestore }: Props = $props()

let fileInputElement: HTMLInputElement | undefined = $state()

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

// Trigger the hidden file input
function triggerFileInput() {
  fileInputElement?.click()
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

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- Backup Settings -->
  <div
    class="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-emerald-200/50 dark:border-emerald-800/30"
  >
    <!-- Background gradient -->
    <div
      class="absolute inset-0 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30"
    ></div>

    <!-- Decorative elements -->
    <div
      class="absolute -top-10 -right-10 w-24 h-24 bg-linear-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl"
    ></div>

    <!-- Top accent -->
    <div
      class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500"
    ></div>

    <div class="relative p-5">
      <FlexGroup direction="vertical" childrenGap="xs">
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
    </div>
  </div>

  <!-- Restore Settings -->
  <div
    class="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-amber-200/50 dark:border-amber-800/30"
  >
    <!-- Background gradient -->
    <div
      class="absolute inset-0 bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30"
    ></div>

    <!-- Decorative elements -->
    <div
      class="absolute -top-10 -right-10 w-24 h-24 bg-linear-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-2xl"
    ></div>

    <!-- Top accent -->
    <div
      class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 via-orange-500 to-yellow-500"
    ></div>

    <div class="relative p-5">
      <FlexGroup direction="vertical" childrenGap="xs">
        <Button
          color="secondary"
          onclick={triggerFileInput}
          aria-label="Upload backup file to restore configurations"
        >
          {#snippet icon()}
            <Upload size={18} />
          {/snippet}
          {I18nService.getMessage('restoreSettings')}
        </Button>
        <input
          bind:this={fileInputElement}
          type="file"
          accept=".json"
          onchange={handleRestore}
          class="hidden"
          aria-label="Upload backup file to restore configurations"
        >
        <Text as="p" size="xs" color="muted" classes="px-1">
          {I18nService.getMessage('restoreDescription')}
        </Text>
      </FlexGroup>
    </div>
  </div>
</div>
