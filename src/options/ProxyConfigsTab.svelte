<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import { type DropItem } from '@/interfaces'
  import Button from '@/components/Button.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DropTarget from '@/components/DragDrop/DropTarget.svelte'
  import Text from '@/components/Text.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import Card from '@/components/Card.svelte'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import SectionTitle from '@/components/SectionTitle.svelte'
  import { Cable, Zap, CircleQuestionMark } from 'lucide-svelte'

  interface Props {
    onOpenEditor: (scriptId?: string) => void
  }

  let { onOpenEditor }: Props = $props()

  let settings = $derived($settingsStore)
  let dragType = $state<'QUICK_SWITCH' | 'OPTIONS' | ''>('')
  let dropError = $state<string | null>(null)
  let hasProxies = $derived(settings.proxyConfigs.length > 0)

  async function handleQuickSwitchToggle(checked: boolean) {
    await settingsStore.quickSwitchToggle(checked)
    toastStore.show(
      checked
        ? I18nService.getMessage('quickSwitchEnabled')
        : I18nService.getMessage('quickSwitchDisabled'),
      'success'
    )
  }

  async function handleDrop(item: DropItem, pageType: 'QUICK_SWITCH' | 'OPTIONS') {
    // Handle the drop action
    const { dataType, dataId: scriptId } = item

    let isScriptQuickSwitch = null
    if (dataType === 'QUICK_SWITCH' && pageType === 'OPTIONS') {
      isScriptQuickSwitch = false
    } else if (dataType === 'OPTIONS' && pageType === 'QUICK_SWITCH') {
      isScriptQuickSwitch = true
    }

    if (isScriptQuickSwitch !== null) {
      await settingsStore.updateScriptQuickSwitch(scriptId, isScriptQuickSwitch)
    }
  }
</script>

<div class="py-6 space-y-8">
  {#if hasProxies}
    <!-- Quick Switch Mode Toggle Card -->
    <Card>
      <FlexGroup
        direction="horizontal"
        childrenGap="lg"
        alignItems="center"
        justifyContent="between"
      >
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
          {#if settings.quickSwitchEnabled}
            <Text as="p" size="xs" weight="medium" classes="mt-2 text-blue-600 dark:text-blue-400">
              {I18nService.getMessage('quickSwitchEnabledStatus')}
            </Text>
          {/if}
        </div>
        <ToggleSwitch
          id="quickSwitchToggle"
          checked={settings.quickSwitchEnabled}
          onchange={handleQuickSwitchToggle}
          aria-label="Toggle quick switch mode"
        />
      </FlexGroup>
    </Card>

    <!-- Quick Switch Configs Section -->
    <div>
      <SectionTitle
        icon={Zap}
        iconColor="text-purple-600 dark:text-purple-400"
        title={I18nService.getMessage('quickSwitchConfigsTitle')}
        description={I18nService.getMessage('quickSwitchConfigsDescription')}
        classes="mb-6"
      />

      <DropTarget onDrop={(item) => handleDrop(item, 'QUICK_SWITCH')}>
        <section
          data-drag-type={dragType}
          data-page-type="QUICK_SWITCH"
          class="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 transition-colors hover:border-blue-400 dark:hover:border-blue-600"
        >
          <!-- Quick Scripts Dropzone -->
          <div class="relative rounded-lg transition-colors">
            <div
              class="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/80 z-10"
              data-overlay
            >
              <Text as="p" size="xl" weight="medium" classes="text-blue-700 dark:text-blue-300">
                {I18nService.getMessage('dropToAddQuickScripts')}
              </Text>
            </div>

            <ScriptList pageType="QUICK_SWITCH" title="" bind:dragType />
          </div>
        </section>
      </DropTarget>
    </div>
  {/if}

  <!-- All Proxy Configs Section -->
  <div>
    <FlexGroup alignItems="center" justifyContent="between" childrenGap="md" classes="mb-6">
      <SectionTitle
        icon={Cable}
        title={I18nService.getMessage('allProxyConfigsTitle')}
        description={I18nService.getMessage('allProxyConfigsDescription')}
      />
      <!-- Add New Script Button (Header Action) -->
      <FlexGroup justifyContent="end">
        <Tooltip text={I18nService.getMessage('tooltipKeyboardShortcut')} position="bottom">
          <Button data-testid="add-new-script-btn" color="primary" onclick={() => onOpenEditor()}
            >{I18nService.getMessage('addNewScript')}</Button
          >
        </Tooltip>
      </FlexGroup>
    </FlexGroup>

    <DropTarget onDrop={(item) => handleDrop(item, 'OPTIONS')}>
      <section
        data-drag-type={dragType}
        data-page-type="OPTIONS"
        class="relative rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 border-2 border-transparent transition-colors"
      >
        <div
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-red-100/90 dark:bg-red-900/90 z-10"
          data-overlay
        >
          <Text as="p" size="xl" weight="medium" classes="text-red-700 dark:text-red-300">
            {I18nService.getMessage('dropToRemoveQuickScripts')}
          </Text>
        </div>

        <div role="list">
          <ScriptList
            pageType="OPTIONS"
            onScriptEdit={(scriptId) => onOpenEditor(scriptId)}
            bind:dragType
            title=""
          />
        </div>
      </section>
    </DropTarget>
  </div>

  <!-- Error Message -->
  {#if dropError}
    <div class="mb-6 rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-200">
      <Text as="p">{dropError}</Text>
    </div>
  {/if}
</div>
