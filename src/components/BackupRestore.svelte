<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { SettingsWriter } from '@/services/SettingsWriter'
import { toastStore } from '@/stores/toastStore'
import { Download, HardDrive, RefreshCw, Upload } from '@/utils/icons'
import Button from './Button.svelte'
import ExportModal from './ExportModal.svelte'
import ImportModal from './ImportModal.svelte'
import Text from './Text.svelte'

interface Props {
  onRestore: () => Promise<void>
}

let { onRestore }: Props = $props()

let fileInputElement: HTMLInputElement | undefined = $state()
let showImport = $state(false)
let showExport = $state(false)

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
      await onRestore()
      if (input) input.value = ''
    } catch (error) {
      const errorMessage = (error as Error).message || I18nService.getMessage('restoreFailed')
      toastStore.show(errorMessage, 'error')
      console.error('Restore error:', error)
      if (input) input.value = ''
    }
  }
}
</script>

<div class="space-y-3">
  <!-- Group 1: Local Backup -->
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden"
  >
    <!-- Group label -->
    <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
      <HardDrive size={14} class="text-slate-400 dark:text-slate-500 shrink-0" />
      <Text
        size="xs"
        weight="semibold"
        classes="text-slate-500 dark:text-slate-400 uppercase tracking-wide"
      >
        Local Backup
      </Text>
    </div>

    <!-- Backup row -->
    <div class="flex items-center gap-4 px-4 py-3.5">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 shrink-0">
          <Download size={16} class="text-blue-600 dark:text-blue-400" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {I18nService.getMessage('backupSettings')}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {I18nService.getMessage('backupDescription')}
          </p>
        </div>
      </div>
      <Button
        color="secondary"
        onclick={handleBackup}
        aria-label="Backup all proxy configurations and settings"
        data-testid="backup-btn"
      >
        {#snippet icon()}
          <Download size={14} />
        {/snippet}
        Save
      </Button>
    </div>

    <!-- Restore row -->
    <div class="flex items-center gap-4 px-4 py-3.5">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 shrink-0">
          <Upload size={16} class="text-blue-600 dark:text-blue-400" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {I18nService.getMessage('restoreSettings')}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {I18nService.getMessage('restoreDescription')}
          </p>
        </div>
      </div>
      <Button
        color="secondary"
        onclick={triggerFileInput}
        aria-label="Upload backup file to restore configurations"
        data-testid="restore-btn"
      >
        {#snippet icon()}
          <Upload size={14} />
        {/snippet}
        Load
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
    </div>
  </div>

  <!-- Group 2: Import & Export -->
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden"
  >
    <!-- Group label -->
    <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
      <RefreshCw size={14} class="text-slate-400 dark:text-slate-500 shrink-0" />
      <Text
        size="xs"
        weight="semibold"
        classes="text-slate-500 dark:text-slate-400 uppercase tracking-wide"
      >
        Import & Export
      </Text>
    </div>

    <!-- Import row -->
    <div class="flex items-center gap-4 px-4 py-3.5">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 shrink-0">
          <Download size={16} class="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {I18nService.getMessage('importSettings')}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {I18nService.getMessage('importDescription')}
          </p>
        </div>
      </div>
      <Button
        color="secondary"
        onclick={() => (showImport = true)}
        aria-label="Import proxy configurations from another extension"
        data-testid="import-btn"
      >
        {#snippet icon()}
          <Download size={14} />
        {/snippet}
        Import
      </Button>
    </div>

    <!-- Export row -->
    <div class="flex items-center gap-4 px-4 py-3.5">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 shrink-0">
          <Upload size={16} class="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {I18nService.getMessage('exportSettings')}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {I18nService.getMessage('exportDescription')}
          </p>
        </div>
      </div>
      <Button
        color="secondary"
        onclick={() => (showExport = true)}
        aria-label="Export proxy configurations to other formats"
        data-testid="export-btn"
      >
        {#snippet icon()}
          <Upload size={14} />
        {/snippet}
        Export
      </Button>
    </div>
  </div>
</div>

{#if showImport}
  <ImportModal
    onClose={() => (showImport = false)}
    onImported={async () => {
      await onRestore()
    }}
  />
{/if}

{#if showExport}
  <ExportModal onClose={() => (showExport = false)} />
{/if}
