<script lang="ts">
import BackupRestore from '@/components/BackupRestore.svelte'
import FlexGroup from '@/components/FlexGroup.svelte'
import LinkCard from '@/components/LinkCard.svelte'
import KeyboardShortcutsCard from '@/components/ProxyConfigs/KeyboardShortcutsCard.svelte'
import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
import Text from '@/components/Text.svelte'
import ToggleSwitch from '@/components/ToggleSwitch.svelte'
import Tooltip from '@/components/Tooltip.svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { StorageService } from '@/services/StorageService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import {
  Bell,
  BookOpen,
  Bug,
  CircleQuestionMark,
  Database,
  Github,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Shield,
} from '@/utils/icons'

let settings = $derived($settingsStore)
let notificationsEnabled = $state(true)

// Load notification preference on mount
$effect(() => {
  StorageService.getPreferences().then((prefs) => {
    notificationsEnabled = prefs.notifications
  })
})

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
  toastStore.show(
    checked
      ? I18nService.getMessage('autoReloadEnabled')
      : I18nService.getMessage('autoReloadDisabled'),
    'success'
  )
}

async function handleNotificationsToggle(checked: boolean) {
  notificationsEnabled = checked
  await StorageService.savePreferences({ notifications: checked })
  toastStore.show(
    checked
      ? I18nService.getMessage('systemNotificationsEnabled')
      : I18nService.getMessage('systemNotificationsDisabled'),
    'success'
  )
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
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- Disable Proxy on Startup Card -->
      <div
        class="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-blue-200/50 dark:border-blue-800/30"
      >
        <!-- Background gradient -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-violet-950/30"
        ></div>

        <!-- Decorative elements -->
        <div
          class="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"
        ></div>

        <!-- Top accent -->
        <div
          class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500"
        ></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-md opacity-40"
                ></div>
                <div
                  class="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300"
                >
                  <Shield size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label
                    class="text-base font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
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
        </div>
      </div>

      <!-- Auto-reload toggle Card -->
      <div
        class="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-green-200/50 dark:border-green-800/30"
      >
        <!-- Background gradient -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30"
        ></div>

        <!-- Decorative elements -->
        <div
          class="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"
        ></div>

        <!-- Top accent -->
        <div
          class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 via-emerald-500 to-teal-500"
        ></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-md opacity-40"
                ></div>
                <div
                  class="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300"
                >
                  <RefreshCw size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label
                    class="text-base font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                    for="autoReloadToggle"
                  >
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
        </div>
      </div>

      <!-- System Notifications Card -->
      <div
        class="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-purple-200/50 dark:border-purple-800/30"
      >
        <!-- Background gradient -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-950/30 dark:via-violet-950/30 dark:to-fuchsia-950/30"
        ></div>

        <!-- Decorative elements -->
        <div
          class="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-2xl"
        ></div>

        <!-- Top accent -->
        <div
          class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-violet-500 to-fuchsia-500"
        ></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl blur-md opacity-40"
                ></div>
                <div
                  class="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300"
                >
                  <Bell size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label
                    class="text-base font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                    for="notificationsToggle"
                  >
                    {I18nService.getMessage('systemNotifications')}
                  </label>
                  <Tooltip
                    text={I18nService.getMessage('systemNotificationsTooltip')}
                    position="top"
                  >
                    <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
                  </Tooltip>
                </div>
                <Text as="p" size="sm" color="muted" classes="mt-1">
                  {I18nService.getMessage('systemNotificationsDescription')}
                </Text>
              </div>
            </FlexGroup>
            <ToggleSwitch
              id="notificationsToggle"
              checked={notificationsEnabled}
              onchange={handleNotificationsToggle}
              aria-label="Toggle system notifications"
            />
          </FlexGroup>
        </div>
      </div>
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

  <!-- Keyboard Shortcuts Section -->
  <KeyboardShortcutsCard />

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
