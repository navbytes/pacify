<script lang="ts">
  import { Server } from 'lucide-svelte'
  import Button from '../Button.svelte'
  import FlexGroup from '../FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  export let proxyMode: string = 'system'

  const options = [
    { value: 'system', label: I18nService.getMessage('systemMode') },
    { value: 'direct', label: I18nService.getMessage('directMode') },
    { value: 'auto_detect', label: I18nService.getMessage('autoDetectMode') },
    { value: 'pac_script', label: I18nService.getMessage('pacScriptMode') },
    { value: 'fixed_servers', label: I18nService.getMessage('manualMode') },
  ]

  function selectOption(value: string) {
    proxyMode = value
  }
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
    {I18nService.getMessage('proxyMode')} <span class="text-red-500">*</span>
  </FlexGroup>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="between"
    classes="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl"
  >
    {#each options as option}
      <Button
        type="button"
        classes="flex-grow"
        onclick={() => selectOption(option.value)}
        color={proxyMode === option.value ? 'primary' : 'secondary'}
      >
        {option.label}
      </Button>
    {/each}
  </FlexGroup>
</div>
