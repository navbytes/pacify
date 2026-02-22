<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import {
  Cable,
  Check,
  FileText,
  Globe,
  Keyboard,
  Route,
  Settings,
  Shield,
  Zap,
} from '@/utils/icons'
import { colors, transitions } from '@/utils/theme'
import Button from '../Button.svelte'
import Text from '../Text.svelte'

interface Props {
  open?: boolean
  onComplete: () => void
  onCreateProxy: () => void
}

let { open = $bindable(false), onComplete, onCreateProxy }: Props = $props()

let currentStep = $state(0)

const steps = [
  {
    id: 'welcome',
    titleKey: 'onboardingWelcomeTitle',
    titleFallback: 'Welcome to PACify',
    descriptionKey: 'onboardingWelcomeDescription',
    descriptionFallback:
      'The modern proxy manager for Chrome. Configure, switch, and manage your proxy settings with ease.',
    icon: Globe,
    features: null,
  },
  {
    id: 'features',
    titleKey: 'onboardingFeaturesTitle',
    titleFallback: 'Powerful Features',
    descriptionKey: 'onboardingFeaturesDescription',
    descriptionFallback: 'Everything you need to manage your proxies effectively.',
    icon: Zap,
    features: [
      {
        icon: Cable,
        titleKey: 'onboardingFeatureProxies',
        titleFallback: 'Multiple Proxy Profiles',
        descKey: 'onboardingFeatureProxiesDesc',
        descFallback: 'Create and switch between different proxy configurations instantly.',
      },
      {
        icon: Route,
        titleKey: 'onboardingFeatureAutoProxy',
        titleFallback: 'Auto-Proxy Rules',
        descKey: 'onboardingFeatureAutoProxyDesc',
        descFallback: 'Route traffic based on URL patterns with smart routing rules.',
      },
      {
        icon: Shield,
        titleKey: 'onboardingFeaturePAC',
        titleFallback: 'PAC Script Support',
        descKey: 'onboardingFeaturePACDesc',
        descFallback: 'Use custom PAC scripts for advanced proxy configuration.',
      },
      {
        icon: FileText,
        titleKey: 'onboardingFeatureImport',
        titleFallback: 'Import from SwitchyOmega',
        descKey: 'onboardingFeatureImportDesc',
        descFallback: 'Easily migrate your proxy profiles from SwitchyOmega backups.',
      },
    ],
  },
  {
    id: 'shortcuts',
    titleKey: 'onboardingShortcutsTitle',
    titleFallback: 'Keyboard Shortcuts',
    descriptionKey: 'onboardingShortcutsDescription',
    descriptionFallback: 'Work faster with keyboard shortcuts.',
    icon: Keyboard,
    features: [
      {
        icon: null,
        shortcut: 'Ctrl+N',
        titleKey: 'onboardingShortcutNewProxy',
        titleFallback: 'Create new proxy',
        descKey: null,
        descFallback: null,
      },
      {
        icon: null,
        shortcut: 'Ctrl+K',
        titleKey: 'onboardingShortcutSearch',
        titleFallback: 'Search proxies',
        descKey: null,
        descFallback: null,
      },
      {
        icon: null,
        shortcut: 'Esc',
        titleKey: 'onboardingShortcutClose',
        titleFallback: 'Close modal',
        descKey: null,
        descFallback: null,
      },
    ],
  },
  {
    id: 'getStarted',
    titleKey: 'onboardingGetStartedTitle',
    titleFallback: "You're All Set!",
    descriptionKey: 'onboardingGetStartedDescription',
    descriptionFallback:
      'Create your first proxy configuration to get started, or explore the settings.',
    icon: Check,
    features: null,
  },
]

function getMessage(key: string, fallback: string): string {
  return I18nService.getMessage(key) || fallback
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--
  }
}

function handleComplete() {
  open = false
  onComplete()
}

function handleCreateProxy() {
  open = false
  onComplete()
  onCreateProxy()
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleComplete()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleComplete()
  } else if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
    nextStep()
  } else if (e.key === 'ArrowLeft' && currentStep > 0) {
    prevStep()
  }
}

// Platform detection for shortcut display
const isMac =
  typeof navigator !== 'undefined' &&
  ((navigator as any).userAgentData?.platform === 'macOS' ||
    navigator.platform?.includes('Mac') ||
    /Macintosh/.test(navigator.userAgent))

function formatShortcut(shortcut: string): string {
  if (!isMac) return shortcut
  return shortcut
    .replace(/Ctrl\+/g, '\u2318')
    .replace(/Alt\+/g, '\u2325')
    .replace(/Shift\+/g, '\u21E7')
}

const step = $derived(steps[currentStep])
const StepIcon = $derived(step.icon)
const isLastStep = $derived(currentStep === steps.length - 1)
const isFirstStep = $derived(currentStep === 0)
</script>

{#if open}
  <div
    class={cn(modalVariants.overlay(), flexPatterns.center)}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="onboarding-title"
    tabindex="-1"
  >
    <div
      class={cn(
        modalVariants.content({ size: 'lg' }),
        'mx-4 animate-scale-in overflow-hidden'
      )}
    >
      <!-- Progress bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
        <div
          class={cn(
            'h-full bg-gradient-to-r from-blue-500 to-purple-500',
            transitions.normal
          )}
          style="width: {((currentStep + 1) / steps.length) * 100}%"
        ></div>
      </div>

      <!-- Content -->
      <div class="p-8 pt-10">
        <!-- Icon -->
        <div class={cn(flexPatterns.center, 'mb-6')}>
          <div
            class={cn(
              'relative p-5 rounded-2xl',
              'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
              'dark:from-blue-500/20 dark:to-purple-500/20'
            )}
          >
            <div
              class="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 opacity-20 blur-xl"
            ></div>
            <StepIcon
              size={48}
              class="relative text-blue-600 dark:text-blue-400"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <!-- Title & Description -->
        <div class="text-center mb-8">
          <h2
            id="onboarding-title"
            class={cn(
              'text-2xl font-bold mb-3',
              'bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800',
              'dark:from-slate-100 dark:via-blue-200 dark:to-purple-200',
              'bg-clip-text text-transparent'
            )}
          >
            {getMessage(step.titleKey, step.titleFallback)}
          </h2>
          <Text as="p" color="muted" size="lg">
            {getMessage(step.descriptionKey, step.descriptionFallback)}
          </Text>
        </div>

        <!-- Features list (if applicable) -->
        {#if step.features}
          <div class="space-y-4 mb-8">
            {#each step.features as feature}
              <div
                class={cn(
                  'flex items-start gap-4 p-4 rounded-xl',
                  'bg-slate-50 dark:bg-slate-800/50',
                  'border border-slate-200 dark:border-slate-700'
                )}
              >
                {#if feature.icon}
                  {@const FeatureIcon = feature.icon}
                  <div
                    class={cn(
                      'shrink-0 p-2.5 rounded-lg',
                      'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
                      'dark:from-blue-500/20 dark:to-purple-500/20'
                    )}
                  >
                    <FeatureIcon size={20} class="text-blue-600 dark:text-blue-400" />
                  </div>
                {:else if feature.shortcut}
                  <div
                    class={cn(
                      'shrink-0 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold',
                      'bg-slate-200 dark:bg-slate-700',
                      colors.text.default
                    )}
                  >
                    {formatShortcut(feature.shortcut)}
                  </div>
                {/if}
                <div>
                  <Text as="p" weight="semibold" classes="mb-0.5">
                    {getMessage(feature.titleKey, feature.titleFallback)}
                  </Text>
                  {#if feature.descKey}
                    <Text as="p" color="muted" size="sm">
                      {getMessage(feature.descKey, feature.descFallback ?? '')}
                    </Text>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Get Started actions (last step) -->
        {#if isLastStep}
          <div class={cn(flexPatterns.center, 'gap-4 mb-8')}>
            <Button color="primary" size="lg" onclick={handleCreateProxy}>
              {#snippet icon()}
                <Cable size={20} />
              {/snippet}
              {getMessage('onboardingCreateFirstProxy', 'Create First Proxy')}
            </Button>
            <Button color="secondary" size="lg" onclick={handleComplete}>
              {#snippet icon()}
                <Settings size={20} />
              {/snippet}
              {getMessage('onboardingExploreSettings', 'Explore Settings')}
            </Button>
          </div>
        {/if}

        <!-- Step dots -->
        <div class={cn(flexPatterns.center, 'gap-2 mb-6')}>
          {#each steps as _, index}
            <button
              type="button"
              class={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-200',
                index === currentStep
                  ? 'bg-blue-500 w-8'
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              )}
              onclick={() => (currentStep = index)}
              aria-label={`Go to step ${index + 1}`}
            ></button>
          {/each}
        </div>

        <!-- Navigation -->
        <div class={cn(flexPatterns.between)}>
          <Button
            color="ghost"
            onclick={prevStep}
            disabled={isFirstStep}
            classes={isFirstStep ? 'invisible' : ''}
          >
            {getMessage('previous', 'Previous')}
          </Button>

          {#if !isLastStep}
            <Button color="primary" onclick={nextStep}>{getMessage('next', 'Next')}</Button>
          {:else}
            <Button color="ghost" onclick={handleComplete}>
              {getMessage('skipTour', 'Skip Tour')}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
</style>
