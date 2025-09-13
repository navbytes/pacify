<script lang="ts">
  import FlexGroup from '../FlexGroup.svelte'
  import LabelButton from '../LabelButton.svelte'
  import ToggleSwitch from '../ToggleSwitch.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

  export let name: string = ''
  export let color: string = 'gray'
  export let isActive: boolean = false
</script>

<FlexGroup childrenGap="lg" alignItems="center" justifyContent="between">
  <div class="flex-1">
    <label
      for="scriptName"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {I18nService.getMessage('configurationName')}
      <span class="text-red-500">*</span>
    </label>
    <input
      type="text"
      id="scriptName"
      bind:value={name}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
             focus:ring-2 focus:ring-primary focus:border-primary"
      placeholder={I18nService.getMessage('enterConfigurationName')}
    />
  </div>
  <div>
    <span
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {I18nService.getMessage('color')} <span class="text-red-500">*</span>
    </span>
    <div
      class="relative inline-flex items-center rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
      style="background-color: {color}"
    >
      <LabelButton color="secondary" hideType="invisible" minimal>
        <span class="relative inline-flex py-2 px-4">&nbsp;</span>
        <input slot="input" type="color" bind:value={color} />
      </LabelButton>
    </div>
  </div>
  <div>
    <span
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {I18nService.getMessage('active')}
    </span>
    <ToggleSwitch bind:checked={isActive} />
  </div>
</FlexGroup>
