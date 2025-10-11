<script lang="ts">
  import FlexGroup from '../FlexGroup.svelte'
  import LabelButton from '../LabelButton.svelte'
  import ToggleSwitch from '../ToggleSwitch.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '../Text.svelte'

  interface Props {
    name?: string
    color?: string
    isActive?: boolean
  }

  let {
    name = $bindable(''),
    color = $bindable('gray'),
    isActive = $bindable(false),
  }: Props = $props()
</script>

<FlexGroup childrenGap="lg" alignItems="center" justifyContent="between">
  <div class="flex-1">
    <label
      for="scriptName"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
    >
      {I18nService.getMessage('configurationName')}
      <Text classes="text-red-500">*</Text>
    </label>
    <input
      type="text"
      id="scriptName"
      bind:value={name}
      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
             focus:ring-2 focus:ring-primary focus:border-primary"
      placeholder={I18nService.getMessage('enterConfigurationName')}
    />
  </div>
  <div>
    <Text size="sm" weight="medium" classes="block text-slate-700 dark:text-slate-300 mb-1">
      {I18nService.getMessage('color')}
      <Text classes="text-red-500">*</Text>
    </Text>
    <div
      class="relative inline-flex items-center rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
      style="background-color: {color}"
    >
      <LabelButton color="secondary" hideType="invisible" minimal>
        {#snippet children()}
          <Text classes="relative inline-flex py-2 px-4">&nbsp;</Text>
        {/snippet}
        {#snippet input()}
          <input type="color" bind:value={color} />
        {/snippet}
      </LabelButton>
    </div>
  </div>
  <div>
    <Text size="sm" weight="medium" classes="block text-slate-700 dark:text-slate-300 mb-2">
      {I18nService.getMessage('active')}
    </Text>
    <ToggleSwitch bind:checked={isActive} />
  </div>
</FlexGroup>
