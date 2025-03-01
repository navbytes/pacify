<script lang="ts">
  import { ALERT_TYPES, ERROR_TYPES } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { SettingsWriter } from '@/services/SettingsWriter'
  import Button from './Button.svelte'
  import LabelButton from './LabelButton.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  interface Props {
    onRestore: () => void
  }

  let { onRestore }: Props = $props()

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
        NotifyService.alert((error as Error).message)
      }
    }
  }
</script>

<FlexGroup
  direction="horizontal"
  childrenGap="sm"
  alignItems="center"
  justifyContent="between"
>
  <!-- Backup button -->
  <Button color="secondary" onclick={handleBackup}
    >{I18nService.getMessage('backupSettings')}</Button
  >
  <LabelButton color="secondary">
    {I18nService.getMessage('restoreSettings')}
    <input slot="input" type="file" accept=".json" onchange={handleRestore} />
  </LabelButton>
</FlexGroup>
