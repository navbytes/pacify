<script lang="ts">
  import { settingsStore } from '@/stores/settingsStore'
  import { toastStore } from '@/stores/toastStore'
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import BackupRestore from '@/components/BackupRestore.svelte'
  import FlexGroup from '@/components/FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import Text from '@/components/Text.svelte'
  import Tooltip from '@/components/Tooltip.svelte'
  import Card from '@/components/Card.svelte'
  import SectionTitle from '@/components/SectionTitle.svelte'
  import { Shield, Database, CircleQuestionMark } from 'lucide-svelte'

  let settings = $derived($settingsStore)

  async function handleDisableProxyOnStartupToggle(checked: boolean) {
    await settingsStore.updateSettings({ disableProxyOnStartup: checked })
    toastStore.show(
      checked
        ? I18nService.getMessage('proxyDisabledOnStartup')
        : I18nService.getMessage('proxyPersistOnStartup'),
      'success'
    )
  }
</script>

<div class="py-6 space-y-8">
  <!-- Proxy Behavior Section (Primary) -->
  <div>
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
      {I18nService.getMessage('settingsProxyBehavior')}
    </h2>

    <Card classes="ring-2 ring-blue-500/10 dark:ring-blue-400/10">
      <FlexGroup
        direction="horizontal"
        childrenGap="lg"
        alignItems="center"
        justifyContent="between"
      >
        <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
          <div class="flex-shrink-0 mt-1">
            <div
              class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            >
              <Shield size={24} />
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <label
                class="text-base font-semibold cursor-pointer"
                for="disableProxyOnStartupToggle"
              >
                {I18nService.getMessage('disableProxyOnStartup')}
              </label>
              <Tooltip text={I18nService.getMessage('tooltipDisableOnStartup')} position="top">
                <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
              </Tooltip>
            </div>
            <Text as="p" size="sm" color="muted" classes="mt-1">
              {I18nService.getMessage('disableProxyOnStartupDescription')}
            </Text>
          </div>
        </FlexGroup>
        <ToggleSwitch
          id="disableProxyOnStartupToggle"
          checked={settings.disableProxyOnStartup}
          onchange={handleDisableProxyOnStartupToggle}
          aria-label="Toggle disable proxy on startup"
        />
      </FlexGroup>
    </Card>
  </div>

  <!-- Data Management Section -->
  <div>
    <SectionTitle
      icon={Database}
      iconSize={20}
      iconColor="text-slate-600 dark:text-slate-400"
      title={I18nService.getMessage('settingsDataManagement')}
      classes="mb-4"
    />

    <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
  </div>
</div>
