<script lang="ts">
import { Globe, Monitor, Network, Server, Settings } from 'lucide-svelte'
import { I18nService } from '@/services/i18n/i18nService'
import FlexGroup from '../FlexGroup.svelte'
import SegmentedControl from '../SegmentedControl.svelte'
import Text from '../Text.svelte'

interface Props {
  proxyMode?: string
  onchange?: (mode: string) => void
}

let { proxyMode = $bindable('system'), onchange }: Props = $props()

const options: { value: string; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: I18nService.getMessage('systemMode'), icon: Monitor },
  { value: 'direct', label: I18nService.getMessage('directMode'), icon: Globe },
  { value: 'auto_detect', label: I18nService.getMessage('autoDetectMode'), icon: Network },
  { value: 'pac_script', label: I18nService.getMessage('pacScriptMode'), icon: Settings },
  { value: 'fixed_servers', label: I18nService.getMessage('manualMode'), icon: Server },
]

function handleModeChange(value: string) {
  proxyMode = value
  onchange?.(value)
}
</script>

<div>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="start"
    classes="mb-2"
  >
    <Server size={20} class="text-slate-600 dark:text-slate-400" />
    <Text size="sm" weight="medium" classes="text-slate-700 dark:text-slate-300">
      {I18nService.getMessage('proxyMode')}
    </Text>
    <Text classes="text-red-500">*</Text>
  </FlexGroup>
  <SegmentedControl
    {options}
    value={proxyMode}
    onchange={handleModeChange}
    size="sm"
    fullWidth
    aria-label={I18nService.getMessage('proxyMode')}
  />
</div>
