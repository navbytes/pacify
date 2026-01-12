<script lang="ts">
import {
  ArrowRight,
  CheckCircle,
  FlaskConical,
  Search,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-svelte'
import type { AutoProxyRule, ProxyConfig } from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'
import {
  formInputVariants,
  gradientIconBadgeVariants,
  gradientSectionVariants,
} from '@/utils/classPatterns/autoProxy'
import Button from '../Button.svelte'
import Text from '../Text.svelte'

interface Props {
  rules: AutoProxyRule[]
  availableProxies: ProxyConfig[]
}

let { rules, availableProxies }: Props = $props()

let testUrl = $state('')
let testResult = $state<{
  matched: boolean
  rule?: AutoProxyRule
  proxyResult: string
} | null>(null)
let isAnimating = $state(false)

// Styles using reusable patterns
const cyanSection = gradientSectionVariants({ color: 'cyan', rounded: '2xl' })
const cyanIconBadge = gradientIconBadgeVariants({ color: 'cyan', size: 'md' })
const greenSection = gradientSectionVariants({ color: 'green' })
const greenIconBadge = gradientIconBadgeVariants({ color: 'green', size: 'md' })
const slateSection = gradientSectionVariants({ color: 'slate' })

function handleTest() {
  if (!testUrl.trim()) {
    testResult = null
    return
  }

  // Trigger animation
  isAnimating = true
  setTimeout(() => {
    isAnimating = false
  }, 300)

  testResult = PACScriptGenerator.testUrl(testUrl, rules, availableProxies)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleTest()
  }
}

function getProxyColor(rule: AutoProxyRule | undefined): string {
  if (!rule) return '#6b7280'
  if (rule.proxyType === 'direct') return '#10b981'
  if (rule.proxyType === 'existing' && rule.proxyId) {
    const proxy = availableProxies.find((p) => p.id === rule.proxyId)
    return proxy?.color || '#6366f1'
  }
  return '#6366f1'
}
</script>

<div class={cyanSection.wrapper()}>
  <!-- Background gradient -->
  <div class={cyanSection.background()}></div>

  <!-- Decorative elements -->
  <div class="{cyanSection.decorativeBlur()} top-0 right-0 w-32 h-32"></div>
  <div class="{cyanSection.decorativeBlur()} bottom-0 left-0 w-24 h-24"></div>

  <div class="{cyanSection.content()} p-5">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class={cyanIconBadge.wrapper()}>
        <div class={cyanIconBadge.badge()}>
          <FlaskConical size={18} class="text-white" />
        </div>
      </div>
      <div>
        <Text weight="semibold" classes="text-slate-800 dark:text-slate-200">
          {I18nService.getMessage('testPattern') || 'Test Pattern'}
        </Text>
        <Text size="xs" color="muted">{I18nService.getMessage('testPatternHint')}</Text>
      </div>
    </div>

    <!-- Input section -->
    <div class="flex gap-3">
      <div class="flex-1 relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search
            size={16}
            class="text-slate-400 group-focus-within:text-cyan-500 transition-colors"
          />
        </div>
        <input
          type="text"
          bind:value={testUrl}
          onkeydown={handleKeydown}
          placeholder={I18nService.getMessage('testUrlPlaceholder') || 'Enter a URL to test (e.g., https://google.com)'}
          class="{formInputVariants({ state: 'cyan' })} pl-11"
        >
        <div
          class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-focus-within:opacity-10 -z-10 blur transition-opacity duration-200"
        ></div>
      </div>

      <Button onclick={handleTest} variant="gradient" gradient="cyan" classes="px-5 py-3">
        {#snippet icon()}
          <Zap size={16} class={isAnimating ? 'animate-pulse' : ''} />
        {/snippet}
        {I18nService.getMessage('testButton')}
      </Button>
    </div>

    <!-- Result section -->
    {#if testResult}
      <div class="mt-4 transition-all duration-300" class:animate-bounce-subtle={isAnimating}>
        {#if testResult.matched}
          <!-- Match found -->
          <div class={greenSection.wrapper()}>
            <!-- Success gradient background -->
            <div class={greenSection.background()}></div>
            <div class={greenSection.accentBar()}></div>

            <div class="relative p-4 {greenSection.content()}">
              <div class="flex items-start gap-4">
                <!-- Success icon -->
                <div class="flex-shrink-0">
                  <div class={greenIconBadge.wrapper()}>
                    <div class="{greenIconBadge.glow()} animate-pulse"></div>
                    <div class="{greenIconBadge.badge()} rounded-full">
                      <CheckCircle size={20} class="text-white" />
                    </div>
                  </div>
                </div>

                <!-- Match info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-base font-semibold text-green-700 dark:text-green-300">
                      {I18nService.getMessage('patternMatches') || 'Pattern matches!'}
                    </span>
                    <Sparkles size={16} class="text-green-500 animate-pulse" />
                  </div>

                  <div class="flex items-center gap-2 flex-wrap text-sm">
                    <span class="text-slate-600 dark:text-slate-400"
                      >{I18nService.getMessage('ruleLabel')}</span
                    >
                    <code
                      class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-mono text-xs"
                    >
                      {testResult.rule?.pattern}
                    </code>
                    <ArrowRight size={14} class="text-slate-400" />
                    <div class="flex items-center gap-1.5">
                      <div
                        class="w-2.5 h-2.5 rounded-full"
                        style="background-color: {getProxyColor(testResult.rule)}"
                      ></div>
                      <span class="font-medium text-slate-700 dark:text-slate-300"
                        >{testResult.proxyResult}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- No match - fallback -->
          <div class={slateSection.wrapper()}>
            <!-- Neutral gradient background -->
            <div class={slateSection.background()}></div>
            <div class={slateSection.accentBar()}></div>

            <div class="relative p-4 {slateSection.content()}">
              <div class="flex items-start gap-4">
                <!-- Info icon -->
                <div class="flex-shrink-0">
                  <div class="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <XCircle size={20} class="text-slate-500 dark:text-slate-400" />
                  </div>
                </div>

                <!-- Fallback info -->
                <div class="flex-1">
                  <span class="text-base font-semibold text-slate-700 dark:text-slate-300">
                    {I18nService.getMessage('noPatternMatch') || 'No pattern matches'}
                  </span>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {I18nService.getMessage('useFallback') || 'Fallback behavior will be used for this URL'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Placeholder hint -->
      <div
        class="mt-4 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
      >
        <p class="text-sm text-center text-slate-500 dark:text-slate-400">
          {I18nService.getMessage('testPatternHelp')}
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
@keyframes bounce-subtle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.3s ease-out;
}
</style>
