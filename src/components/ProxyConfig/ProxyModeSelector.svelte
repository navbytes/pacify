<script lang="ts">
  import { Server } from '@/utils/icons'
  import Button from '../Button.svelte'
  import FlexGroup from '../FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '../Text.svelte'

  interface Props {
    proxyMode?: string
  }

  let { proxyMode = $bindable('system') }: Props = $props()

  const options = [
    { value: 'system', label: I18nService.getMessage('systemMode') },
    { value: 'direct', label: I18nService.getMessage('directMode') },
    { value: 'auto_detect', label: I18nService.getMessage('autoDetectMode') },
    { value: 'pac_script', label: I18nService.getMessage('pacScriptMode') },
    { value: 'fixed_servers', label: I18nService.getMessage('manualMode') },
  ]
</script>

<div>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="start"
    classes="mb-1"
  >
    <Server size={20} />
    {I18nService.getMessage('proxyMode')}
    <Text classes="text-red-500">*</Text>
  </FlexGroup>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="between"
    classes="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl"
    role="tablist"
  >
    {#each options as option}
      <Button
        type="button"
        role="tab"
        classes="flex-grow"
        onclick={() => (proxyMode = option.value)}
        color={proxyMode === option.value ? 'primary' : 'secondary'}
        aria-selected={proxyMode === option.value ? 'true' : 'false'}
      >
        {option.label}
      </Button>
    {/each}
  </FlexGroup>
</div>
