<script lang="ts">
  import { ALERT_TYPES, ERROR_TYPES } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { SettingsWriter } from '@/services/SettingsWriter'

  interface Props {
    onRestore: () => void;
  }

  let { onRestore }: Props = $props();

  // Handle the backup action
  async function handleBackup() {
    try {
      await SettingsWriter.backupSettings()
      NotifyService.alert(ALERT_TYPES.BACKUP_SUCCESS)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.BACKUP, error)
    }
  }

  // Handle the restore action
  async function handleRestore(event: Event) {
    const input = event.target as HTMLInputElement
    if (input?.files?.[0]) {
      try {
        await SettingsWriter.restoreSettings(input.files[0])
        onRestore()
        NotifyService.alert(ALERT_TYPES.RESTORE_SUCCESS)
      } catch (error) {
        alert((error as Error).message)
      }
    }
  }
</script>

<div class="flex">
  <!-- Backup button -->
  <button class="secondary-button" onclick={handleBackup}
    >Backup Settings</button
  >

  <!-- Restore button with file input -->
  <label class="secondary-button">
    Restore Settings
    <input type="file" accept=".json" onchange={handleRestore} hidden />
  </label>
</div>

<style>
  .flex {
    gap: var(--spacing-sm);
  }
  label {
    display: inline-block;
    cursor: pointer;
    background-color: var(--button-bg);
    color: var(--button-text);
    border: none;
    border-radius: var(--border-radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease-in-out;
  }
  label.secondary-button {
    background-color: var(--button-secondary-bg);
    color: var(--text-color);
  }

  label:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  label:active {
    filter: brightness(0.9);
    transform: translateY(1px);
    box-shadow: var(--shadow-sm);
  }

  input[type='file'] {
    display: none;
  }
</style>
