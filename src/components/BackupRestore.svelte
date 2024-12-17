<script lang="ts">
  import { SettingsWriter } from '@/services/SettingsWriter'
  import { createEventDispatcher } from 'svelte'

  type RestoreEvent = {}
  const dispatch = createEventDispatcher<{
    restore: RestoreEvent
  }>()

  // Handle the backup action
  async function handleBackup() {
    try {
      await SettingsWriter.backupSettings()
      alert('Settings have been backed up successfully!')
    } catch (error) {
      console.error('Backup failed:', error)
      alert('Failed to backup settings.')
    }
  }

  // Handle the restore action
  async function handleRestore(event: Event) {
    const input = event.target as HTMLInputElement
    if (input?.files?.[0]) {
      try {
        await SettingsWriter.restoreSettings(input.files[0])
        dispatch('restore', {})
        alert('Settings have been restored successfully!')
      } catch (error) {
        alert((error as Error).message)
      }
    }
  }
</script>

<div class="flex">
  <!-- Backup button -->
  <button class="primary-button" on:click={handleBackup}>Backup Settings</button
  >

  <!-- Restore button with file input -->
  <label class="secondary-button">
    Restore Settings
    <input type="file" accept=".json" on:change={handleRestore} hidden />
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

  label:hover {
    transform: scale(1.1);
  }

  input[type='file'] {
    display: none;
  }
</style>
