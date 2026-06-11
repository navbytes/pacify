<script lang="ts">
import { GitBranch, Route, Save, Settings, Sparkles, X } from 'lucide-svelte'
import { tick } from 'svelte'
import type {
  AutoProxyConfig,
  AutoProxyRouteType,
  AutoProxyRule,
  AutoProxySubscription,
  ProxyConfig,
  ProxyServer,
} from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import {
  gradientIconBadgeVariants,
  gradientSectionVariants,
  settingsCardVariants,
} from '@/utils/classPatterns/autoProxy'
import { cn } from '@/utils/cn'
import { getRandomProxyColor } from '@/utils/colors'
import { modalFocus } from '@/utils/modalFocus'
import { colors } from '@/utils/theme'
import Button from '../Button.svelte'
import FlexGroup from '../FlexGroup.svelte'
import LabelButton from '../LabelButton.svelte'
import SegmentedControl from '../SegmentedControl.svelte'
import Text from '../Text.svelte'
import ToggleSwitch from '../ToggleSwitch.svelte'
import AutoProxyRuleEditor from './AutoProxyRuleEditor.svelte'
import AutoProxyRuleList from './AutoProxyRuleList.svelte'
import FallbackConfig from './FallbackConfig.svelte'
import PatternTester from './PatternTester.svelte'
import SubscriptionList from './SubscriptionList.svelte'

interface Props {
  proxyConfig?: ProxyConfig
  availableProxies: ProxyConfig[]
  onSave: (config: Omit<ProxyConfig, 'id'>) => Promise<void>
  onCancel: () => void
}

let { proxyConfig = undefined, availableProxies, onSave, onCancel }: Props = $props()

// Basic settings state
let name = $state('')
// Use existing color for editing, random color for new Auto-Proxy configs
let color = $state('')
let badgeLabel = $state('')
let isActive = $state(false)

// Auto-Proxy config state
let rules = $state<AutoProxyRule[]>([])
let fallbackType = $state<AutoProxyRouteType>('direct')
let fallbackProxyId = $state<string | undefined>(undefined)
let fallbackInlineProxy = $state<ProxyServer | undefined>(undefined)
let subscriptions = $state<AutoProxySubscription[]>([])

// Initialize state from proxyConfig
$effect(() => {
  name = proxyConfig?.name || ''
  color = proxyConfig?.color || getRandomProxyColor()
  badgeLabel = proxyConfig?.badgeLabel || ''
  isActive = proxyConfig?.isActive || false
  rules = proxyConfig?.autoProxy?.rules || []
  subscriptions = proxyConfig?.autoProxy?.subscriptions || []
  fallbackType = proxyConfig?.autoProxy?.fallbackType || 'direct'
  fallbackProxyId = proxyConfig?.autoProxy?.fallbackProxyId
  fallbackInlineProxy = proxyConfig?.autoProxy?.fallbackInlineProxy
})

// UI state
let editingRule = $state<AutoProxyRule | null>(null)
let isAddingRule = $state(false)
let errorMessage = $state('')
let isSubmitting = $state(false)

// Stage the routing editor into tabs (item 15) instead of one dense scroll.
let activeSection = $state<'rules' | 'lists' | 'fallback' | 'test'>('rules')
let sectionTabs = $derived([
  { value: 'rules', label: I18nService.getMessage('apTabRules'), badge: rules.length || undefined },
  {
    value: 'lists',
    label: I18nService.getMessage('subscriptions'),
    badge: subscriptions.length || undefined,
  },
  { value: 'fallback', label: I18nService.getMessage('apTabFallback') },
  { value: 'test', label: I18nService.getMessage('apTabTest') },
])

// Badge preview - shows what the badge will display
let badgePreview = $derived(
  (badgeLabel.trim() || name.trim().slice(0, 3) || 'N/A').slice(0, 4).toUpperCase()
)

// Styling variants
const blueIconBadge = gradientIconBadgeVariants({ color: 'blue' })
const slateIconBadge = gradientIconBadgeVariants({ color: 'slate' })
const redSection = gradientSectionVariants({ color: 'red' })

function handleAddRule() {
  isAddingRule = true
  editingRule = null
}

function handleEditRule(rule: AutoProxyRule) {
  editingRule = rule
  isAddingRule = false
}

function handleSaveRule(ruleData: Omit<AutoProxyRule, 'id' | 'priority'>) {
  const currentEditingRule = editingRule
  if (currentEditingRule) {
    // Update existing rule
    rules = rules.map((r) =>
      r.id === currentEditingRule.id
        ? { ...ruleData, id: currentEditingRule.id, priority: currentEditingRule.priority }
        : r
    )
  } else {
    // Add new rule
    const newRule: AutoProxyRule = {
      ...ruleData,
      id: crypto.randomUUID(),
      priority: rules.length, // Add at the end
    }
    rules = [...rules, newRule]
  }

  editingRule = null
  isAddingRule = false
}

function handleCancelRuleEdit() {
  editingRule = null
  isAddingRule = false
}

function handleDeleteRule(ruleId: string) {
  rules = rules.filter((r) => r.id !== ruleId)
  // Recalculate priorities
  rules = rules.map((r, i) => ({ ...r, priority: i }))
}

function handleToggleRule(ruleId: string, enabled: boolean) {
  rules = rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
}

function handleReorderRules(newRules: AutoProxyRule[]) {
  rules = newRules
}

function handleSubscriptionsUpdate(newSubscriptions: AutoProxySubscription[]) {
  subscriptions = newSubscriptions
}

function handleFallbackChange(
  newFallbackType: AutoProxyRouteType,
  newFallbackProxyId?: string,
  newFallbackInlineProxy?: ProxyServer
) {
  fallbackType = newFallbackType
  fallbackProxyId = newFallbackProxyId
  fallbackInlineProxy = newFallbackInlineProxy
}

async function handleSubmit() {
  errorMessage = ''

  if (!name.trim()) {
    errorMessage = I18nService.getMessage('nameRequired')
    tick().then(() => {
      document
        .querySelector('[data-error-message]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }

  const enabledSubscriptions = subscriptions.filter((s) => s.enabled && (s.ruleCount || 0) > 0)
  if (rules.length === 0 && enabledSubscriptions.length === 0) {
    errorMessage = I18nService.getMessage('atLeastOneRule')
    tick().then(() => {
      document
        .querySelector('[data-error-message]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }

  isSubmitting = true

  try {
    const autoProxyConfig: AutoProxyConfig = {
      rules,
      subscriptions: subscriptions.length > 0 ? subscriptions : undefined,
      fallbackType,
      fallbackProxyId,
      fallbackInlineProxy,
    }

    const config: Omit<ProxyConfig, 'id'> = {
      name: name.trim(),
      color,
      badgeLabel: badgeLabel.trim() || undefined,
      isActive,
      quickSwitch: proxyConfig?.quickSwitch,
      mode: 'pac_script', // Auto-Proxy uses PAC script mode under the hood
      autoProxy: autoProxyConfig,
    }

    await onSave(config)
  } catch (error) {
    console.error('Error saving Auto-Proxy config:', error)
    errorMessage = error instanceof Error ? error.message : I18nService.getMessage('failedToSave')
    tick().then(() => {
      document
        .querySelector('[data-error-message]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  } finally {
    isSubmitting = false
  }
}

function handleClose() {
  onCancel()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isAddingRule || editingRule) {
      handleCancelRuleEdit()
    } else {
      handleClose()
    }
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) handleClose()
}

// Filter out the current config from available proxies (can't reference itself)
let selectableProxies = $derived(
  availableProxies.filter((p) => p.id !== proxyConfig?.id && p.autoProxy === undefined)
)
</script>

<div
  class={cn(modalVariants.overlay(), flexPatterns.center)}
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="auto-proxy-title"
  tabindex="-1"
>
  <!-- Modal -->
  <div
    class={cn(
      modalVariants.content({ size: 'xl' }),
      'mx-4 animate-scale-in flex flex-col max-h-[90vh] overflow-hidden'
    )}
    use:modalFocus
    tabindex="-1"
  >
    <!-- Accent bar for editor identity -->
    <div class="h-1 shrink-0 bg-linear-to-r from-orange-500 to-amber-500"></div>

    <!-- Header -->
    <div class={cn(modalVariants.header(), 'items-start')}>
      <div class="flex items-center gap-3">
        <!-- Icon badge -->
        <div
          class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/40"
        >
          <GitBranch size={20} class="text-orange-600 dark:text-orange-300" />
        </div>
        <div>
          <h2 id="auto-proxy-title" class={cn('text-lg font-semibold', colors.text.default)}>
            {proxyConfig ? I18nService.getMessage('editAutoProxy') : I18nService.getMessage('createAutoProxy')}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
            <Route size={14} />
            {I18nService.getMessage('autoProxySubtitle')}
          </p>
        </div>
      </div>

      <Button
        onclick={handleClose}
        color="ghost"
        variant="minimal"
        aria-label={I18nService.getMessage('close')}
        classes="p-2 min-w-11 min-h-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        data-testid="auto-proxy-close-btn"
      >
        {#snippet icon()}
          <X size={20} />
        {/snippet}
      </Button>
    </div>

    <!-- Content -->
    <div class={cn(modalVariants.body(), 'overflow-y-auto space-y-4')}>
      <!-- Basic Settings Card -->
      <div class={settingsCardVariants({ color: 'slate' })}>
        <FlexGroup direction="horizontal" alignItems="center" childrenGap="sm" classes="mb-4">
          <div class={slateIconBadge.wrapper()}>
            <div class={slateIconBadge.badge()}>
              <Settings size={16} class="text-white" />
            </div>
          </div>
          <Text weight="semibold" classes="text-slate-700 dark:text-slate-300">
            {I18nService.getMessage('basicSettings')}
          </Text>
        </FlexGroup>

        <!-- Configuration Name, Color, and Active Toggle in one row -->
        <FlexGroup childrenGap="lg" alignItems="center" justifyContent="between" classes="mb-4">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <label
                for="name"
                class="block text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                {I18nService.getMessage('configurationName')}
                <span class="text-orange-500">*</span>
              </label>
              <Text size="xs" color="muted" classes="font-medium">{name.length}/50</Text>
            </div>
            <div class="relative group">
              <input
                id="name"
                type="text"
                maxlength="50"
                bind:value={name}
                placeholder={I18nService.getMessage('autoProxyNamePlaceholder')}
                class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
              >
              <div
                class="absolute inset-0 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity duration-200"
              ></div>
            </div>
          </div>

          <!-- Color Picker -->
          <div class="space-y-2">
            <Text size="sm" weight="medium" classes="block text-slate-600 dark:text-slate-300">
              {I18nService.getMessage('color')}
              <span class="text-orange-500">*</span>
            </Text>
            <div
              class="relative w-12 h-12 rounded-xl shadow-md cursor-pointer overflow-hidden group transition-transform duration-200 hover:scale-105"
              style="background-color: {color}"
            >
              <div
                class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              ></div>
              <LabelButton color="secondary" hideType="invisible" minimal>
                {#snippet children()}
                  <Text classes="relative inline-flex w-12 h-12">&nbsp;</Text>
                {/snippet}
                {#snippet input()}
                  <input type="color" bind:value={color}>
                {/snippet}
              </LabelButton>
            </div>
          </div>

          <!-- Active Toggle -->
          <div class="space-y-2">
            <Text size="sm" weight="medium" classes="block text-slate-600 dark:text-slate-300">
              {I18nService.getMessage('active')}
            </Text>
            <ToggleSwitch bind:checked={isActive} />
          </div>
        </FlexGroup>

        <!-- Badge label is a power-user toolbar cosmetic — keep it out of the
             default create, behind an Advanced disclosure (matches the proxy
             editor). -->
        <details class="group">
          <summary
            class="flex items-center gap-1.5 cursor-pointer select-none text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 list-none"
          >
            <span class="transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
            {I18nService.getMessage('advancedOptions') || 'Advanced'}
          </summary>
          <div class="mt-3 space-y-2">
            <div class="flex items-center justify-between mb-1">
              <label
                for="badgeLabel"
                class="block text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                {I18nService.getMessage('badgeLabel')}
                <span class="text-xs text-slate-500 ml-1">(Optional)</span>
              </label>
              <Text size="xs" color="muted" classes="font-medium">{badgeLabel.length}/4</Text>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex-1 relative group">
                <input
                  id="badgeLabel"
                  type="text"
                  maxlength="4"
                  bind:value={badgeLabel}
                  placeholder="Auto"
                  data-testid="config-badge-input"
                  class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                >
                <div
                  class="absolute inset-0 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity duration-200"
                ></div>
              </div>
              <div
                class="shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                style="background-color: {color}"
                aria-hidden="true"
              >
                {badgePreview}
              </div>
            </div>
            <Text size="xs" color="muted">{I18nService.getMessage('badgeLabelHelp')}</Text>
          </div>
        </details>
      </div>

      <!-- Rule Editor (when adding/editing) -->
      {#if isAddingRule || editingRule}
        <div class={settingsCardVariants({ color: 'blue' })}>
          <!-- Animated border glow -->
          <div
            class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 animate-pulse rounded-xl"
          ></div>

          <div class="relative">
            <FlexGroup direction="horizontal" alignItems="center" childrenGap="sm" classes="mb-4">
              <div class={blueIconBadge.wrapper()}>
                <div class={blueIconBadge.badge()}>
                  <Sparkles size={16} class="text-white" />
                </div>
              </div>
              <Text weight="semibold" classes="text-blue-700 dark:text-blue-300">
                {editingRule ? I18nService.getMessage('editRule') : I18nService.getMessage('addRule')}
              </Text>
            </FlexGroup>
            <AutoProxyRuleEditor
              rule={editingRule || undefined}
              availableProxies={selectableProxies}
              onSave={handleSaveRule}
              onCancel={handleCancelRuleEdit}
            />
          </div>
        </div>
      {:else}
        <!-- Staged into tabs so the editor isn't one dense scroll (item 15) -->
        <SegmentedControl
          options={sectionTabs}
          value={activeSection}
          onchange={(v) => (activeSection = v as typeof activeSection)}
          size="sm"
          fullWidth
          aria-label={I18nService.getMessage('autoProxyMode')}
        />

        {#if activeSection === 'rules'}
          <AutoProxyRuleList
            {rules}
            availableProxies={selectableProxies}
            onAddRule={handleAddRule}
            onEditRule={handleEditRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
            onReorderRules={handleReorderRules}
          />
        {:else if activeSection === 'lists'}
          <SubscriptionList
            {subscriptions}
            availableProxies={selectableProxies}
            onUpdate={handleSubscriptionsUpdate}
          />
        {:else if activeSection === 'fallback'}
          <FallbackConfig
            {fallbackType}
            {fallbackProxyId}
            {fallbackInlineProxy}
            availableProxies={selectableProxies}
            onchange={handleFallbackChange}
          />
        {:else if activeSection === 'test'}
          <PatternTester
            {rules}
            {subscriptions}
            {fallbackType}
            {fallbackProxyId}
            {fallbackInlineProxy}
            availableProxies={selectableProxies}
          />
        {/if}
      {/if}

      <!-- Error Message -->
      {#if errorMessage}
        <div class={redSection.wrapper()} data-error-message>
          <div class={redSection.background()}></div>
          <div class={redSection.accentBar()}></div>
          <div class="relative p-4 {redSection.content()}">
            <p class="text-red-700 dark:text-red-300 text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class={modalVariants.footer()}>
      <Button color="secondary" onclick={handleClose} data-testid="auto-proxy-cancel-btn">
        {I18nService.getMessage('cancel')}
      </Button>
      <Button
        onclick={handleSubmit}
        disabled={isSubmitting || isAddingRule || !!editingRule}
        variant="gradient"
        gradient="orange"
        data-testid="auto-proxy-save-btn"
      >
        {#snippet icon()}
          <Save size={16} />
        {/snippet}
        {proxyConfig ? I18nService.getMessage('saveChanges') : I18nService.getMessage('createAutoProxy')}
      </Button>
    </div>
  </div>
</div>

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
  animation: scale-in 0.2s ease-out;
}
</style>
