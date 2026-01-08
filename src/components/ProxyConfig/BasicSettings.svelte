<script lang="ts">
  import FlexGroup from '../FlexGroup.svelte'
  import LabelButton from '../LabelButton.svelte'
  import ToggleSwitch from '../ToggleSwitch.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '../Text.svelte'
  import { inputVariants } from '@/utils/classPatterns'

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

  const MAX_NAME_LENGTH = 50
  const MIN_NAME_LENGTH = 1

  let nameError = $state('')
  let nameTouched = $state(false)
  let charCount = $derived(name.length)
  // Validation check for name length
  $effect(() => {
    const isValid = charCount >= MIN_NAME_LENGTH && charCount <= MAX_NAME_LENGTH
    void isValid // Used for validation logic
  })

  function validateName(value: string): string {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return I18nService.getMessage('nameRequired') || 'Name is required'
    }

    if (trimmed.length < MIN_NAME_LENGTH) {
      return (
        I18nService.getMessage('nameTooShort') ||
        `Name must be at least ${MIN_NAME_LENGTH} character`
      )
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      return (
        I18nService.getMessage('nameTooLong') ||
        `Name must be ${MAX_NAME_LENGTH} characters or less`
      )
    }

    return ''
  }

  function handleNameBlur() {
    nameTouched = true
    nameError = validateName(name)
  }

  function handleNameInput() {
    if (nameTouched) {
      nameError = validateName(name)
    }
  }
</script>

<FlexGroup childrenGap="lg" alignItems="center" justifyContent="between">
  <div class="flex-1">
    <div class="flex items-center justify-between mb-1">
      <label for="scriptName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {I18nService.getMessage('configurationName')}
        <Text classes="text-red-500">*</Text>
      </label>
      <Text size="xs" color={charCount > MAX_NAME_LENGTH ? 'error' : 'muted'} classes="font-medium">
        {charCount}/{MAX_NAME_LENGTH}
      </Text>
    </div>
    <input
      type="text"
      id="scriptName"
      bind:value={name}
      oninput={handleNameInput}
      onblur={handleNameBlur}
      maxlength={MAX_NAME_LENGTH}
      class={inputVariants({ state: nameError && nameTouched ? 'error' : 'default', size: 'md' })}
      placeholder={I18nService.getMessage('enterConfigurationName')}
    />
    {#if nameError && nameTouched}
      <Text as="p" size="xs" classes="mt-1 text-red-600 dark:text-red-400">
        {nameError}
      </Text>
    {/if}
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
