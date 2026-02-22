<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { SwitchyOmegaImporter } from '@/services/SwitchyOmegaImporter'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { settingsCardVariants } from '@/utils/classPatterns'
import { Download, FileText, Upload } from '@/utils/icons'
import Button from './Button.svelte'
import FlexGroup from './FlexGroup.svelte'
import Text from './Text.svelte'

interface Props {
  onRestore: () => Promise<void>
}

let { onRestore }: Props = $props()

let fileInputElement: HTMLInputElement | undefined = $state()
let omegaFileInputElement: HTMLInputElement | undefined = $state()

// Card variants
const emeraldCard = settingsCardVariants({ color: 'emerald', size: 'sm' })
const amberCard = settingsCardVariants({ color: 'amber', size: 'sm' })
const blueCard = settingsCardVariants({ color: 'blue', size: 'sm' })

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

// Trigger the SwitchyOmega file input
function triggerOmegaFileInput() {
  omegaFileInputElement?.click()
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

// Handle SwitchyOmega import
async function handleOmegaImport(event: Event) {
  const input = event.target as HTMLInputElement
  if (input?.files?.[0]) {
    try {
      const result = await SwitchyOmegaImporter.importFile(input.files[0])

      if (result.configs.length === 0) {
        const msg =
          result.warnings.length > 0
            ? result.warnings[0]
            : I18nService.getMessage('noProfilesFound') ||
              'No proxy profiles found in the backup file.'
        toastStore.show(msg, 'error')
        return
      }

      // Add imported configs to existing settings
      const settings = $settingsStore
      const updatedConfigs = [...settings.proxyConfigs, ...result.configs]
      await settingsStore.updateSettings({ proxyConfigs: updatedConfigs })

      const successMsg = (
        I18nService.getMessage('switchyOmegaImportSuccess') ||
        'Imported $1 proxy configurations from SwitchyOmega'
      ).replace('$1', String(result.configs.length))
      toastStore.show(successMsg, 'success')

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          toastStore.show(warning, 'warning')
        }
      }

      // Refresh UI
      await onRestore()
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        I18nService.getMessage('switchyOmegaImportFailed') ||
        'Failed to import SwitchyOmega backup'
      toastStore.show(errorMessage, 'error')
      console.error('SwitchyOmega import error:', error)
    } finally {
      // Clear the file input
      if (input) {
        input.value = ''
      }
    }
  }
}
</script>

<div class="grid-responsive-3">
  <!-- Backup Settings -->
  <div class="group {emeraldCard.wrapper()}">
    <!-- Background gradient -->
    <div class={emeraldCard.background()}></div>

    <!-- Decorative elements -->
    <div></div>

    <!-- Top accent -->
    <div class={emeraldCard.accent()}></div>

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
  <div class="group {amberCard.wrapper()}">
    <!-- Background gradient -->
    <div class={amberCard.background()}></div>

    <!-- Decorative elements -->
    <div></div>

    <!-- Top accent -->
    <div class={amberCard.accent()}></div>

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

  <!-- Import from SwitchyOmega -->
  <div class="group {blueCard.wrapper()}">
    <!-- Background gradient -->
    <div class={blueCard.background()}></div>

    <!-- Decorative elements -->
    <div></div>

    <!-- Top accent -->
    <div class={blueCard.accent()}></div>

    <div class="relative p-5">
      <FlexGroup direction="vertical" childrenGap="xs">
        <Button
          color="secondary"
          onclick={triggerOmegaFileInput}
          aria-label="Import proxy configurations from SwitchyOmega backup"
          data-testid="import-switchyomega-btn"
        >
          {#snippet icon()}
            <FileText size={18} />
          {/snippet}
          {I18nService.getMessage('importSwitchyOmega') || 'Import from SwitchyOmega'}
        </Button>
        <input
          bind:this={omegaFileInputElement}
          type="file"
          accept=".json,.bak"
          onchange={handleOmegaImport}
          class="hidden"
          aria-label="Upload SwitchyOmega backup file"
          data-testid="import-switchyomega-file-input"
        >
        <Text as="p" size="xs" color="muted" classes="px-1">
          {I18nService.getMessage('importSwitchyOmegaDescription') ||
            'Import proxy profiles from a SwitchyOmega .bak or .json backup'}
        </Text>
      </FlexGroup>
    </div>
  </div>
</div>
