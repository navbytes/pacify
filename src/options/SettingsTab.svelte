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
  Eye,
  Github,
  Heart,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Shield,
  Star,
} from '@/utils/icons'

interface Props {
  activeTab?: string
}

let { activeTab = $bindable() }: Props = $props()

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

async function handleShowQuickSettingsToggle(checked: boolean) {
  await settingsStore.updateSettings({ showQuickSettings: checked })
  toastStore.show(
    checked
      ? I18nService.getMessage('showQuickSettingsEnabled')
      : I18nService.getMessage('showQuickSettingsDisabled'),
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
    <div class="grid-settings-cards">
      <!-- Disable Proxy on Startup Card -->
      <div class="card-container border border-blue-200/50 dark:border-blue-800/30">
        <!-- Background gradient -->
        <div
          class="card-bg-layer from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-violet-950/30"
        ></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class="card-accent-top from-blue-500 to-indigo-500"></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div></div>
                <div class="icon-container from-blue-500 to-indigo-600 shadow-blue-500/25">
                  <Shield size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="settings-label" for="disableProxyOnStartupToggle">
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
      <div class="card-container border border-green-200/50 dark:border-green-800/30">
        <!-- Background gradient -->
        <div
          class="card-bg-layer from-green-50 to-emerald-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30"
        ></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class="card-accent-top from-green-500 to-emerald-500"></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div></div>
                <div class="icon-container from-green-500 to-emerald-600 shadow-green-500/25">
                  <RefreshCw size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="settings-label" for="autoReloadToggle">
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
      <div class="card-container border border-purple-200/50 dark:border-purple-800/30">
        <!-- Background gradient -->
        <div
          class="card-bg-layer from-purple-50 to-violet-50 dark:from-purple-950/30 dark:via-violet-950/30 dark:to-fuchsia-950/30"
        ></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class="card-accent-top from-purple-500 to-violet-500"></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div></div>
                <div class="icon-container from-purple-500 to-violet-600 shadow-purple-500/25">
                  <Bell size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="settings-label" for="notificationsToggle">
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

      <!-- Show Quick Settings Card -->
      <div class="card-container border border-amber-200/50 dark:border-amber-800/30">
        <!-- Background gradient -->
        <div
          class="card-bg-layer from-amber-50 to-orange-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30"
        ></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class="card-accent-top from-amber-500 to-orange-500"></div>

        <div class="relative p-5">
          <FlexGroup
            direction="horizontal"
            childrenGap="lg"
            alignItems="center"
            justifyContent="between"
          >
            <FlexGroup alignItems="start" childrenGap="sm" classes="flex-1">
              <div class="relative">
                <div></div>
                <div class="icon-container from-amber-500 to-orange-600 shadow-amber-500/25">
                  <Eye size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="settings-label" for="showQuickSettingsToggle">
                    {I18nService.getMessage('showQuickSettings')}
                  </label>
                  <Tooltip text={I18nService.getMessage('showQuickSettingsTooltip')} position="top">
                    <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
                  </Tooltip>
                </div>
                <Text as="p" size="sm" color="muted" classes="mt-1">
                  {I18nService.getMessage('showQuickSettingsDescription')}
                </Text>
              </div>
            </FlexGroup>
            <ToggleSwitch
              id="showQuickSettingsToggle"
              checked={settings.showQuickSettings}
              onchange={handleShowQuickSettingsToggle}
              aria-label="Toggle show quick settings"
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
      iconColor="purple"
    />
    <BackupRestore
      onRestore={async () => {
        await settingsStore.reloadSettings()
        // Switch to Proxy Configs tab to show the restored proxies
        if (activeTab !== undefined) {
          activeTab = 'proxy-configs'
        }
      }}
    />
  </div>

  <!-- Keyboard Shortcuts Section -->
  <KeyboardShortcutsCard />

  <!-- Feedback & Rating Section -->
  <div>
    <SectionHeader
      icon={Heart}
      title={I18nService.getMessage('feedbackAndRating') || 'Feedback & Rating'}
      iconColor="pink"
    />
    <div class="grid-responsive-3">
      <!-- Rate Extension Card -->
      <LinkCard
        href="https://chromewebstore.google.com/detail/pacify-the-proxy-manager/kgepmkaldicdcljckhamnhkigddnbcbd/reviews"
        icon={Star}
        label={I18nService.getMessage('rateExtension') || 'Rate Extension'}
        color="yellow"
      />
      <!-- Leave a Review Card -->
      <LinkCard
        href="https://chromewebstore.google.com/detail/pacify-the-proxy-manager/kgepmkaldicdcljckhamnhkigddnbcbd/reviews"
        icon={MessageSquare}
        label={I18nService.getMessage('leaveReview') || 'Leave a Review'}
        color="blue"
      />
      <!-- Support Project Card -->
      <LinkCard
        href="https://github.com/sponsors/navbytes"
        icon={Heart}
        label={I18nService.getMessage('supportProject') || 'Support Project'}
        color="pink"
      />
    </div>
  </div>

  <!-- Help & Resources Section -->
  <div>
    <SectionHeader
      icon={HelpCircle}
      title={I18nService.getMessage('aboutHelpResources')}
      iconColor="purple"
    />
    <div class="grid-responsive-4">
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
