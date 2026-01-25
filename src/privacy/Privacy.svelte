<script lang="ts">
import ThemeToggle from '@/components/ThemeToggle.svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { cn } from '@/utils/cn'
import { Globe, Lock, Shield, ShieldCheck } from '@/utils/icons'
import { colors } from '@/utils/theme'

function getMessage(key: string, fallback: string): string {
  return I18nService.getMessage(key) || fallback
}

const lastUpdated = '2024-01-25'

interface Section {
  icon: typeof Shield
  titleKey: string
  titleFallback: string
  contentKey: string
  contentFallback: string
}

const sections: Section[] = [
  {
    icon: ShieldCheck,
    titleKey: 'privacyDataCollection',
    titleFallback: 'Data Collection',
    contentKey: 'privacyDataCollectionContent',
    contentFallback: `PACify does NOT collect, store, or transmit any personal data, browsing history, or usage information to external servers.

All your proxy configurations, settings, and preferences are stored locally on your device using Chrome's built-in storage APIs (chrome.storage.sync and chrome.storage.local).

We do not use any analytics, tracking, or telemetry services.`,
  },
  {
    icon: Lock,
    titleKey: 'privacyDataStorage',
    titleFallback: 'Data Storage',
    contentKey: 'privacyDataStorageContent',
    contentFallback: `Your data is stored in two locations:

• Chrome Sync Storage: Your proxy configurations and settings are synced across your Chrome browsers if you're signed into Chrome. This is handled entirely by Google's infrastructure.

• Local Storage: Larger data (like PAC scripts) and temporary preferences are stored locally on your device.

You can export and delete your data at any time through the Settings tab.`,
  },
  {
    icon: Globe,
    titleKey: 'privacyNetworkRequests',
    titleFallback: 'Network Requests',
    contentKey: 'privacyNetworkRequestsContent',
    contentFallback: `PACify may make network requests only in the following situations:

• When fetching a PAC script from a URL you provide (if you configure a PAC URL)
• When testing proxy connectivity (only when you explicitly request it)

These requests are made directly from your browser and do not pass through any intermediary servers we control.`,
  },
  {
    icon: Shield,
    titleKey: 'privacyPermissions',
    titleFallback: 'Permissions Used',
    contentKey: 'privacyPermissionsContent',
    contentFallback: `PACify requires the following permissions:

• proxy: To configure Chrome's proxy settings
• storage: To save your configurations locally
• alarms: For scheduled PAC script refresh
• tabs: To reload tabs when switching proxies (optional)

We only request permissions that are essential for the extension to function.`,
  },
]
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-4xl mx-auto px-6 py-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="relative">
            <div
              class="relative p-2 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg border border-white/50 dark:border-slate-700/50"
            >
              <img src="/icons/icon48.png" alt="PACify" class="w-10 h-10 shrink-0">
            </div>
          </div>
          <div>
            <h1
              class="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent tracking-tight"
            >
              {getMessage('privacyPolicyTitle', 'Privacy Policy')}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">PACify Proxy Manager</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="max-w-4xl mx-auto px-6 py-12">
    <!-- Introduction -->
    <div class="mb-12">
      <p class={cn('text-lg mb-4', colors.text.default)}>
        {getMessage(
          'privacyIntro',
          'Your privacy is important to us. This policy explains how PACify handles your data.'
        )}
      </p>
      <p class={cn('text-sm', colors.text.muted)}>
        {getMessage('privacyLastUpdated', 'Last updated')}: {lastUpdated}
      </p>
    </div>

    <!-- Sections -->
    <div class="space-y-8">
      {#each sections as section}
        {@const SectionIcon = section.icon}
        <section
          class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div class="flex items-start gap-4">
            <div
              class={cn(
                'shrink-0 p-3 rounded-xl',
                'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
                'dark:from-blue-500/20 dark:to-purple-500/20'
              )}
            >
              <SectionIcon size={24} class="text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1">
              <h2 class={cn('text-xl font-semibold mb-3', colors.text.default)}>
                {getMessage(section.titleKey, section.titleFallback)}
              </h2>
              <div class={cn('prose prose-slate dark:prose-invert max-w-none', colors.text.muted)}>
                <p class="whitespace-pre-line">
                  {getMessage(section.contentKey, section.contentFallback)}
                </p>
              </div>
            </div>
          </div>
        </section>
      {/each}
    </div>

    <!-- Contact -->
    <section class="mt-12 text-center">
      <p class={cn('text-sm', colors.text.muted)}>
        {getMessage(
          'privacyContact',
          'If you have any questions about this privacy policy, please open an issue on our GitHub repository.'
        )}
      </p>
    </section>

    <!-- Back to Options -->
    <div class="mt-8 text-center"><a
      href="/src/options/options.html"
      class={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700',
          'text-slate-700 dark:text-slate-300',
          'transition-colors'
        )}
    >
      {getMessage('backToSettings', 'Back to Settings')}
    </a></div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-200 dark:border-slate-700 py-6 mt-12">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <p class={cn('text-sm', colors.text.muted)}>
        PACify Proxy Manager &copy; {new Date().getFullYear()}
      </p>
    </div>
  </footer>
</div>
