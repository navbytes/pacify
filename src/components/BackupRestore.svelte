<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { toastStore } from '@/stores/toastStore'
import { Download, Upload } from '@/utils/icons'
import Button from './Button.svelte'
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
  } catch (error) {
    toastStore.show(I18nService.getMessage('backupFailed'), 'error')
    console.error('Backup error:', error)
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
    } catch (error) {
      const errorMessage = (error as Error).message || I18nService.getMessage('restoreFailed')
      toastStore.show(errorMessage, 'error')
      console.error('Restore error:', error)

      // Clear the file input on error too
      if (input) {
        input.value = ''
      }
    }
  }
}
</script>

<div class="grid-responsive-2">
  <!-- Backup Settings -->
  <div class="group card-container-sm border border-emerald-200/50 dark:border-emerald-800/30">
    <!-- Background gradient -->
    <div class="card-bg-layer-sm card-bg-emerald"></div>

    <!-- Decorative elements -->
    <div></div>

    <!-- Top accent -->
    <div class="card-accent-top card-accent-emerald"></div>

    <div class="relative p-5">
      <FlexGroup direction="vertical" childrenGap="xs">
        <Button
          color="secondary"
          onclick={handleBackup}
          aria-label="Backup all proxy configurations and settings"
          data-testid="backup-btn"
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
  <div class="group card-container-sm border border-amber-200/50 dark:border-amber-800/30">
    <!-- Background gradient -->
    <div class="card-bg-layer-sm card-bg-amber"></div>

    <!-- Decorative elements -->
    <div></div>

    <!-- Top accent -->
    <div class="card-accent-top card-accent-amber"></div>

    <div class="relative p-5">
      <FlexGroup direction="vertical" childrenGap="xs">
        <Button
          color="secondary"
          onclick={triggerFileInput}
          aria-label="Upload backup file to restore configurations"
          data-testid="restore-btn"
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
          data-testid="restore-file-input"
        >
        <Text as="p" size="xs" color="muted" classes="px-1">
          {I18nService.getMessage('restoreDescription')}
        </Text>
      </FlexGroup>
    </div>
  </div>
</div>
