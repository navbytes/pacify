<script lang="ts">
import {
  AlertCircle,
  Check,
  FileText,
  Globe,
  MapPin,
  Network,
  Regex,
  Route,
  Sparkles,
  ToggleRight,
} from 'lucide-svelte'
import type {
  AutoProxyMatchType,
  AutoProxyRouteType,
  AutoProxyRule,
  ProxyConfig,
  ProxyServer,
} from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import { PACScriptGenerator } from '@/services/PACScriptGenerator'
import {
  formInputVariants,
  gradientIconBadgeVariants,
  gradientSectionVariants,
  sectionInnerContentVariants,
  selectionCardGradients,
  selectionCardVariants,
} from '@/utils/classPatterns/autoProxy'
import Button from '../Button.svelte'
import Text from '../Text.svelte'
import ProxySelector from './ProxySelector.svelte'

interface Props {
  rule?: AutoProxyRule
  availableProxies: ProxyConfig[]
  onSave: (rule: Omit<AutoProxyRule, 'id' | 'priority'>) => void
  onCancel: () => void
}

let { rule = undefined, availableProxies, onSave, onCancel }: Props = $props()

// Form state
let pattern = $state('')
let matchType = $state<AutoProxyMatchType>('wildcard')
let proxyType = $state<AutoProxyRouteType>('direct')
let proxyId = $state<string | undefined>(undefined)
let inlineProxy = $state<ProxyServer | undefined>(undefined)
let description = $state('')
let enabled = $state(true)

// Initialize form state from rule
$effect(() => {
  if (rule) {
    pattern = rule.pattern || ''
    matchType = rule.matchType || 'wildcard'
    proxyType = rule.proxyType || 'direct'
    proxyId = rule.proxyId
    inlineProxy = rule.inlineProxy
    description = rule.description || ''
    enabled = rule.enabled ?? true
  }
})

// Validation state
let patternError = $state<string | null>(null)
let isSubmitting = $state(false)

// Gradient section styles
const purpleSection = gradientSectionVariants({ color: 'purple' })
const slateSection = gradientSectionVariants({ color: 'slate' })
const blueSection = gradientSectionVariants({ color: 'blue' })
const tealSection = gradientSectionVariants({ color: 'teal' })
const amberSection = gradientSectionVariants({ color: 'amber' })

// Icon badge styles
const purpleIconBadge = gradientIconBadgeVariants({ color: 'purple' })
const slateIconBadge = gradientIconBadgeVariants({ color: 'slate' })
const blueIconBadge = gradientIconBadgeVariants({ color: 'blue' })
const tealIconBadge = gradientIconBadgeVariants({ color: 'teal' })
const amberIconBadge = gradientIconBadgeVariants({ color: 'amber' })

// Validate pattern on change
$effect(() => {
  if (pattern) {
    const result = PACScriptGenerator.validatePattern(pattern, matchType)
    patternError = result.valid ? null : result.error || I18nService.getMessage('invalidPattern')
  } else {
    patternError = null
  }
})

function handleProxyChange(
  newProxyType: AutoProxyRouteType,
  newProxyId?: string,
  newInlineProxy?: ProxyServer
) {
  proxyType = newProxyType
  proxyId = newProxyId
  inlineProxy = newInlineProxy
}

function handleSubmit(event: Event) {
  event.preventDefault()

  if (!pattern.trim()) {
    patternError = I18nService.getMessage('patternRequired')
    return
  }

  const validation = PACScriptGenerator.validatePattern(pattern, matchType)
  if (!validation.valid) {
    patternError = validation.error || I18nService.getMessage('invalidPattern')
    return
  }

  isSubmitting = true

  onSave({
    pattern: pattern.trim(),
    matchType,
    proxyType,
    proxyId,
    inlineProxy,
    description: description.trim() || undefined,
    enabled,
  })
}

const matchTypeOptions: {
  value: AutoProxyMatchType
  label: string
  description: string
  icon: typeof Sparkles
  gradientKey: string
}[] = [
  {
    value: 'wildcard',
    label: I18nService.getMessage('wildcardPattern'),
    description: '*.google.com',
    icon: Sparkles,
    gradientKey: 'purple',
  },
  {
    value: 'exact',
    label: I18nService.getMessage('exactMatch'),
    description: 'example.com',
    icon: MapPin,
    gradientKey: 'blue',
  },
  {
    value: 'regex',
    label: I18nService.getMessage('regexPattern'),
    description: '^www\\..*',
    icon: Regex,
    gradientKey: 'orange',
  },
  {
    value: 'cidr',
    label: I18nService.getMessage('cidrPattern'),
    description: '192.168.0.0/16',
    icon: Network,
    gradientKey: 'green',
  },
]

// Get current match type config
let currentMatchType = $derived(
  matchTypeOptions.find((o) => o.value === matchType) || matchTypeOptions[0]
)

// Input state for dynamic styling
let inputState = $derived<'error' | 'success' | 'purple'>(
  patternError ? 'error' : pattern && !patternError ? 'success' : 'purple'
)
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Pattern Input Section -->
  <div class={purpleSection.wrapper()}>
    <div class={purpleSection.background()}></div>
    <div class="{purpleSection.decorativeBlur()} top-0 right-0"></div>
    <div class={purpleSection.accentBar()}></div>

    <div class={purpleSection.content()}>
      <div class="flex items-center gap-2 mb-3">
        <div class={purpleIconBadge.wrapper()}>
          <div class={purpleIconBadge.glow()}></div>
          <div class={purpleIconBadge.badge()}>
            <Globe size={14} class="text-white" />
          </div>
        </div>
        <label for="pattern" class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {I18nService.getMessage('urlPattern')}
          <span class="text-rose-500">*</span>
        </label>
      </div>

      <div class="relative">
        <input
          id="pattern"
          type="text"
          bind:value={pattern}
          placeholder={currentMatchType.description}
          class={formInputVariants({ state: inputState, variant: 'mono' })}
        >
        {#if pattern && !patternError}
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
              <Check size={14} class="text-green-600 dark:text-green-400" />
            </div>
          </div>
        {/if}
      </div>

      {#if patternError}
        <div
          class="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <AlertCircle size={14} class="text-red-500 shrink-0" />
          <Text size="xs" classes="text-red-600 dark:text-red-400">{patternError}</Text>
        </div>
      {/if}
    </div>
  </div>

  <!-- Match Type Selection -->
  <div class={slateSection.wrapper()}>
    <div class={slateSection.background()}></div>
    <div class={slateSection.accentBar()}></div>

    <div class={slateSection.content()}>
      <div class="flex items-center gap-2 mb-3">
        <div class={slateIconBadge.wrapper()}>
          <div class={slateIconBadge.glow()}></div>
          <div class={slateIconBadge.badge()}>
            <Regex size={14} class="text-white" />
          </div>
        </div>
        <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
          {I18nService.getMessage('patternType')}
        </Text>
      </div>

      <div class="grid grid-cols-2 gap-2">
        {#each matchTypeOptions as option (option.value)}
          {@const Icon = option.icon}
          {@const isSelected = matchType === option.value}
          {@const gradient = selectionCardGradients[option.gradientKey] || selectionCardGradients.purple}
          <button
            type="button"
            onclick={() => matchType = option.value}
            class={selectionCardVariants({ selected: isSelected })}
            style={isSelected ? `background: linear-gradient(to bottom right, ${gradient.from}, ${gradient.to});` : ''}
          >
            <div class="flex items-center gap-2">
              <div
                class={`p-1 rounded-md ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}
              >
                <Icon
                  size={14}
                  class={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}
                />
              </div>
              <div>
                <div
                  class={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  {option.label}
                </div>
                <div
                  class={`text-xs font-mono ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {option.description}
                </div>
              </div>
            </div>
            {#if isSelected}
              <div class="absolute top-2 right-2">
                <div class="p-0.5 rounded-full bg-white/30">
                  <Check size={12} class="text-white" />
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Proxy Selection Section -->
  <div class={blueSection.wrapper()}>
    <div class={blueSection.background()}></div>
    <div class="{blueSection.decorativeBlur()} bottom-0 left-0"></div>
    <div class={blueSection.accentBar()}></div>

    <div class={blueSection.content()}>
      <div class="flex items-center gap-2 mb-3">
        <div class={blueIconBadge.wrapper()}>
          <div class={blueIconBadge.glow()}></div>
          <div class={blueIconBadge.badge()}>
            <Route size={14} class="text-white" />
          </div>
        </div>
        <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
          {I18nService.getMessage('routeTo')}
        </Text>
      </div>

      <div class={sectionInnerContentVariants({ color: 'blue' })}>
        <ProxySelector
          {proxyType}
          {proxyId}
          {inlineProxy}
          {availableProxies}
          onchange={handleProxyChange}
        />
      </div>
    </div>
  </div>

  <!-- Description Section -->
  <div class={tealSection.wrapper()}>
    <div class={tealSection.background()}></div>
    <div class={tealSection.accentBar()}></div>

    <div class={tealSection.content()}>
      <div class="flex items-center gap-2 mb-3">
        <div class={tealIconBadge.wrapper()}>
          <div class={tealIconBadge.glow()}></div>
          <div class={tealIconBadge.badge()}>
            <FileText size={14} class="text-white" />
          </div>
        </div>
        <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
          {I18nService.getMessage('description')}
          <span class="text-slate-400 dark:text-slate-500 font-normal ml-1"
            >({I18nService.getMessage('optional')})</span
          >
        </Text>
      </div>

      <input
        id="description"
        type="text"
        bind:value={description}
        placeholder={I18nService.getMessage('ruleDescriptionPlaceholder')}
        class={formInputVariants({ state: 'teal' })}
      >
    </div>
  </div>

  <!-- Enabled Toggle -->
  <div class={amberSection.wrapper()}>
    <div class={amberSection.background()}></div>
    <div class={amberSection.accentBar()}></div>

    <div class={amberSection.content()}>
      <label for="enabled" class="flex items-center gap-3 cursor-pointer group">
        <div class={amberIconBadge.wrapper()}>
          <div class={amberIconBadge.glow()}></div>
          <div class={amberIconBadge.badge()}>
            <ToggleRight size={14} class="text-white" />
          </div>
        </div>

        <div class="flex-1">
          <Text weight="semibold" size="sm" classes="text-slate-700 dark:text-slate-200">
            {I18nService.getMessage('ruleEnabled')}
          </Text>
          <Text size="xs" color="muted">
            {enabled ? I18nService.getMessage('ruleActiveDescription') : I18nService.getMessage('ruleSkippedDescription')}
          </Text>
        </div>

        <div class="relative">
          <input id="enabled" type="checkbox" bind:checked={enabled} class="sr-only peer">
          <div
            class={`w-12 h-7 rounded-full transition-all duration-300 ${
            enabled
              ? 'bg-linear-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
              : 'bg-slate-300 dark:bg-slate-600'
          }`}
          >
            <div
              class={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
              enabled ? 'left-6' : 'left-1'
            }`}
            ></div>
          </div>
        </div>
      </label>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-2">
    <Button color="secondary" onclick={onCancel} type="button" classes="px-6">
      {I18nService.getMessage('cancel')}
    </Button>

    <Button
      type="submit"
      disabled={isSubmitting || !!patternError}
      variant="gradient"
      gradient="purple"
      classes="px-6"
    >
      {#snippet icon()}
        <Check size={16} />
      {/snippet}
      {rule ? I18nService.getMessage('saveRule') : I18nService.getMessage('addRule')}
    </Button>
  </div>
</form>
