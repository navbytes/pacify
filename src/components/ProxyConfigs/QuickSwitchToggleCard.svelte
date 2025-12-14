<script lang="ts">
  import { CircleQuestionMark } from 'lucide-svelte'
  import Card from '@/components/Card.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import Text from '@/components/Text.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  interface Props {
    enabled: boolean
    onchange: (checked: boolean) => void
  }

  let { enabled, onchange }: Props = $props()
</script>

<Card
  classes="hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
>
  <FlexGroup direction="horizontal" childrenGap="lg" alignItems="center" justifyContent="between">
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <Text as="label" weight="semibold" id="quickSwitchToggle">
          {I18nService.getMessage('quickSwitchMode')}
        </Text>
        <Tooltip text={I18nService.getMessage('tooltipQuickSwitchMode')} position="top">
          <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
        </Tooltip>
      </div>
      <Text as="p" size="sm" color="muted" classes="mt-1">
        {I18nService.getMessage('quickSwitchDescription')}
      </Text>
      {#if enabled}
        <Text as="p" size="xs" weight="medium" classes="mt-2 text-blue-600 dark:text-blue-400">
          {I18nService.getMessage('quickSwitchEnabledStatus')}
        </Text>
      {/if}
    </div>
    <ToggleSwitch
      id="quickSwitchToggle"
      checked={enabled}
      {onchange}
      aria-label="Toggle quick switch mode"
    />
  </FlexGroup>
</Card>
