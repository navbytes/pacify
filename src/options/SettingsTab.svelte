<script lang="ts">
import BackupRestore from '@/components/BackupRestore.svelte'
import FlexGroup from '@/components/FlexGroup.svelte'
import LinkCard from '@/components/LinkCard.svelte'
import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
import Text from '@/components/Text.svelte'
import ToggleSwitch from '@/components/ToggleSwitch.svelte'
import Tooltip from '@/components/Tooltip.svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { StorageService } from '@/services/StorageService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { settingsCardVariants } from '@/utils/classPatterns'
import {
  Bell,
  BookOpen,
  Bug,
  CircleQuestionMark,
  Coffee,
  Database,
  Eye,
  Github,
  Globe,
  Heart,
  HelpCircle,
  Keyboard,
  Lightbulb,
  Lock,
  Mail,
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

// Card variants for different settings cards
const blueCard = settingsCardVariants({ color: 'blue', size: 'md' })
const greenCard = settingsCardVariants({ color: 'green', size: 'md' })
const purpleCard = settingsCardVariants({ color: 'purple', size: 'md' })
const amberCard = settingsCardVariants({ color: 'amber', size: 'md' })
const emeraldCard = settingsCardVariants({ color: 'emerald', size: 'md' })

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

async function handleWebRTCProtectionToggle(checked: boolean) {
  await settingsStore.updateSettings({ webRTCProtection: checked })
  // Also apply immediately via background message
  try {
    await chrome.runtime.sendMessage({ type: 'WEBRTC_TOGGLE', enabled: checked })
  } catch {
    // Background will pick it up on next init
  }
  toastStore.show(
    checked
      ? I18nService.getMessage('webRTCProtectionEnabled') || 'WebRTC leak protection enabled'
      : I18nService.getMessage('webRTCProtectionDisabled') || 'WebRTC leak protection disabled',
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
      <div class="group {blueCard.wrapper()}">
        <!-- Background gradient -->
        <div class={blueCard.background()}></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class={blueCard.accent()}></div>

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
                <div class={blueCard.icon()}>
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
      <div class="group {greenCard.wrapper()}">
        <!-- Background gradient -->
        <div class={greenCard.background()}></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class={greenCard.accent()}></div>

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
                <div class={greenCard.icon()}>
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
      <div class="group {purpleCard.wrapper()}">
        <!-- Background gradient -->
        <div class={purpleCard.background()}></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class={purpleCard.accent()}></div>

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
                <div class={purpleCard.icon()}>
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
      <div class="group {amberCard.wrapper()}">
        <!-- Background gradient -->
        <div class={amberCard.background()}></div>

        <!-- Decorative elements -->
        <div></div>

        <!-- Top accent -->
        <div class={amberCard.accent()}></div>

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
                <div class={amberCard.icon()}>
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
      <!-- WebRTC Leak Protection Card -->
      <div class="group {emeraldCard.wrapper()}">
        <div class={emeraldCard.background()}></div>
        <div></div>
        <div class={emeraldCard.accent()}></div>

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
                <div class={emeraldCard.icon()}>
                  <Globe size={22} class="text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="settings-label" for="webrtcProtectionToggle">
                    {I18nService.getMessage('webRTCProtection') || 'Prevent WebRTC IP Leak'}
                  </label>
                  <Tooltip
                    text={I18nService.getMessage('webRTCProtectionTooltip') || 'Prevents your real IP from leaking through WebRTC when using a proxy'}
                    position="top"
                  >
                    <CircleQuestionMark size={16} class="text-slate-400 dark:text-slate-500" />
                  </Tooltip>
                </div>
                <Text as="p" size="sm" color="muted" classes="mt-1">
                  {I18nService.getMessage('webRTCProtectionDescription') || 'Blocks WebRTC from revealing your real IP address while a proxy is active'}
                </Text>
              </div>
            </FlexGroup>
            <ToggleSwitch
              id="webrtcProtectionToggle"
              checked={settings.webRTCProtection}
              onchange={handleWebRTCProtectionToggle}
              aria-label="Toggle WebRTC leak protection"
            />
          </FlexGroup>
        </div>
      </div>
    </div>
  </div>

  <!-- Keyboard Shortcuts Section -->
  <div>
    <SectionHeader
      icon={Keyboard}
      title={I18nService.getMessage('keyboardShortcuts') || 'Keyboard Shortcuts'}
      iconColor="purple"
    />
    <div class="grid-responsive-3">
      <LinkCard
        href="chrome://extensions/shortcuts"
        icon={Keyboard}
        label={I18nService.getMessage('customizeShortcuts') || 'Customize Shortcuts'}
        color="blue"
      />
    </div>
    <div class="mt-3 px-1">
      <Text as="p" size="sm" color="muted">
        {I18nService.getMessage('shortcutQuickSwitch') || 'Alt+Shift+P: Quick switch to next proxy'}
      </Text>
      <Text as="p" size="sm" color="muted" classes="mt-1">
        {I18nService.getMessage('shortcutDisableProxy') || 'Alt+Shift+O: Disable proxy (direct connection)'}
      </Text>
      <Text as="p" size="sm" color="muted" classes="mt-1">
        {I18nService.getMessage('shortcutOmnibox') || 'Type "px" in the address bar to search and switch proxies'}
      </Text>
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

  <!-- Feedback & Rating Section -->
  <div>
    <SectionHeader
      icon={Heart}
      title={I18nService.getMessage('feedbackAndRating') || 'Feedback & Rating'}
      iconColor="pink"
    />
    <div class="grid-responsive-4">
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
      <!-- GitHub Sponsors Card -->
      <LinkCard
        href="https://github.com/sponsors/navbytes"
        icon={Heart}
        label={I18nService.getMessage('supportProject') || 'Support Project'}
        color="pink"
      />
      <!-- Buy Me a Coffee Card -->
      <LinkCard
        href="https://buymeacoffee.com/navbytes"
        icon={Coffee}
        label={I18nService.getMessage('buyMeACoffee') || 'Buy Me a Coffee'}
        color="orange"
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
      <LinkCard
        href="/privacy.html"
        icon={Lock}
        label={I18nService.getMessage('privacyPolicy') || 'Privacy Policy'}
        color="purple"
      />
      <LinkCard
        href="https://github.com/navbytes/pacify/issues/new?labels=newsletter&title=Subscribe+me+to+updates&body=I%27d+like+to+receive+updates+about+PACify.+My+email%3A+"
        icon={Mail}
        label={I18nService.getMessage('newsletterSignup') || 'Stay Updated'}
        color="orange"
      />
    </div>
  </div>
</div>
