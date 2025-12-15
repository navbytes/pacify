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
  import LinkCard from '@/components/LinkCard.svelte'
  import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
  import {
    Shield,
    Database,
    CircleQuestionMark,
    HelpCircle,
    Github,
    Bug,
    Lightbulb,
    BookOpen,
  } from '@/utils/icons'

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

  async function handleAutoReloadToggle(checked: boolean) {
    await settingsStore.updateSettings({ autoReloadOnProxySwitch: checked })
    toastStore.show(checked ? 'Auto-reload enabled' : 'Auto-reload disabled', 'success')
  }
</script>

<div class="py-6 space-y-8">
  <!-- Proxy Behavior Section (Primary) -->
  <div>
    <SectionHeader
      icon={Shield}
      title={I18nService.getMessage('settingsProxyBehavior')}
      iconColor="purple"
    />

    <!-- Grid layout for proxy behavior cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Disable Proxy on Startup Card -->
      <Card
        classes="ring-2 ring-blue-500/10 dark:ring-blue-400/10 hover:ring-blue-500/20 dark:hover:ring-blue-400/20 hover:shadow-lg transition-all duration-200"
      >
        <FlexGroup
          direction="horizontal"
          childrenGap="lg"
          alignItems="center"
          justifyContent="between"
        >
          <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
            <div
              class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center mt-1 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
            >
              <Shield size={20} class="text-white" />
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

      <!-- Auto-reload toggle Card -->
      <Card
        classes="ring-2 ring-green-500/10 dark:ring-green-400/10 hover:ring-green-500/20 dark:hover:ring-green-400/20 hover:shadow-lg transition-all duration-200"
      >
        <FlexGroup
          direction="horizontal"
          childrenGap="lg"
          alignItems="center"
          justifyContent="between"
        >
          <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
            <div
              class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center mt-1 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
            >
              <Shield size={20} class="text-white" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <label class="text-base font-semibold cursor-pointer" for="autoReloadToggle">
                  {I18nService.getMessage('autoReloadOnProxySwitch')}
                </label>
                <Tooltip text={I18nService.getMessage('tooltipAutoReload')} position="top">
                  <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
                </Tooltip>
              </div>
              <Text as="p" size="sm" color="muted" classes="mt-1">
                {I18nService.getMessage('autoReloadOnProxySwitchDescription')}
              </Text>
            </div>
          </FlexGroup>
          <ToggleSwitch
            id="autoReloadToggle"
            checked={settings.autoReloadOnProxySwitch}
            onchange={handleAutoReloadToggle}
            aria-label="Toggle auto-reload on proxy switch"
          />
        </FlexGroup>
      </Card>
    </div>
  </div>

  <!-- Data Management Section -->
  <div>
    <SectionHeader
      icon={Database}
      title={I18nService.getMessage('settingsDataManagement')}
      iconColor="slate"
    />
    <BackupRestore onRestore={() => settingsStore.reloadSettings()} />
  </div>

  <!-- Help & Resources Section -->
  <div>
    <SectionHeader
      icon={HelpCircle}
      title={I18nService.getMessage('aboutHelpResources')}
      iconColor="slate"
    />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <LinkCard
        href="https://github.com/navbytes/pacify"
        icon={Github}
        label={I18nService.getMessage('aboutViewOnGithub')}
        color="blue"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify/issues"
        icon={Bug}
        label={I18nService.getMessage('aboutReportIssue')}
        color="red"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify/issues/new?labels=enhancement&template=feature_request.md"
        icon={Lightbulb}
        label={I18nService.getMessage('aboutFeatureRequest')}
        color="yellow"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify#readme"
        icon={BookOpen}
        label={I18nService.getMessage('aboutDocumentation')}
        color="green"
      />
    </div>
  </div>
</div>
