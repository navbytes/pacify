<script lang="ts">
import { GitBranch, Route, Save, Settings, Sparkles, X } from 'lucide-svelte'
import { onMount } from 'svelte'
import type {
  AutoProxyConfig,
  AutoProxyRouteType,
  AutoProxyRule,
  ProxyConfig,
  ProxyServer,
} from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import {
  gradientIconBadgeVariants,
  gradientSectionVariants,
  modalBackdropVariants,
  modalContentVariants,
  ruleCountBadgeVariants,
  settingsCardVariants,
} from '@/utils/classPatterns/autoProxy'
import { getRandomProxyColor } from '@/utils/colors'
import Button from '../Button.svelte'
import FlexGroup from '../FlexGroup.svelte'
import LabelButton from '../LabelButton.svelte'
import Text from '../Text.svelte'
import ToggleSwitch from '../ToggleSwitch.svelte'
import AutoProxyRuleEditor from './AutoProxyRuleEditor.svelte'
import AutoProxyRuleList from './AutoProxyRuleList.svelte'
import FallbackConfig from './FallbackConfig.svelte'
import PatternTester from './PatternTester.svelte'

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

// Initialize state from proxyConfig
$effect(() => {
  name = proxyConfig?.name || ''
  color = proxyConfig?.color || getRandomProxyColor()
  badgeLabel = proxyConfig?.badgeLabel || ''
  isActive = proxyConfig?.isActive || false
  rules = proxyConfig?.autoProxy?.rules || []
  fallbackType = proxyConfig?.autoProxy?.fallbackType || 'direct'
  fallbackProxyId = proxyConfig?.autoProxy?.fallbackProxyId
  fallbackInlineProxy = proxyConfig?.autoProxy?.fallbackInlineProxy
})

// UI state
let editingRule = $state<AutoProxyRule | null>(null)
let isAddingRule = $state(false)
let errorMessage = $state('')
let isSubmitting = $state(false)
let isVisible = $state(false)

// Badge preview - shows what the badge will display
let badgePreview = $derived(
  (badgeLabel.trim() || name.trim().slice(0, 3) || 'N/A').slice(0, 4).toUpperCase()
)

// Styling variants
const orangeIconBadge = gradientIconBadgeVariants({ color: 'amber', size: 'lg' })
const blueIconBadge = gradientIconBadgeVariants({ color: 'blue' })
const slateIconBadge = gradientIconBadgeVariants({ color: 'slate' })
const redSection = gradientSectionVariants({ color: 'red' })

onMount(() => {
  // Trigger entrance animation
  requestAnimationFrame(() => {
    isVisible = true
  })
})

// Derived modal variants based on visibility
let modalContent = $derived(
  modalContentVariants({ visible: isVisible, size: 'xl', color: 'orange' })
)
let modalBackdrop = $derived(modalBackdropVariants({ visible: isVisible }))

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
    return
  }

  if (rules.length === 0) {
    errorMessage = I18nService.getMessage('atLeastOneRule')
    return
  }

  isSubmitting = true

  try {
    const autoProxyConfig: AutoProxyConfig = {
      rules,
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
  } finally {
    isSubmitting = false
  }
}

function handleClose() {
  isVisible = false
  setTimeout(onCancel, 200)
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

// Filter out the current config from available proxies (can't reference itself)
let selectableProxies = $derived(
  availableProxies.filter((p) => p.id !== proxyConfig?.id && p.autoProxy === undefined)
)
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop with blur -->
<div class={modalBackdrop.container()}>
  <!-- Animated background -->
  <div class={modalBackdrop.background()} onclick={handleClose} role="presentation"></div>

  <!-- Modal -->
  <div class={modalContent.wrapper()} role="dialog" aria-labelledby="auto-proxy-title">
    <!-- Decorative gradient accent -->
    <div class={modalContent.accentBar()}></div>

    <!-- Header -->
    <div class={modalContent.header()}>
      <!-- Background pattern -->
      <div class={modalContent.headerBackground()}></div>

      <div class="relative flex items-center justify-between">
        <FlexGroup direction="horizontal" alignItems="center" childrenGap="md">
          <!-- Animated icon container -->
          <div class={orangeIconBadge.wrapper()}>
            <div class="{orangeIconBadge.glow()} animate-pulse"></div>
            <div class={orangeIconBadge.badge()}>
              <GitBranch size={24} class="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h2 id="auto-proxy-title" class="text-xl font-bold text-slate-900 dark:text-white">
              {proxyConfig ? I18nService.getMessage('editAutoProxy') : I18nService.getMessage('createAutoProxy')}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Route size={14} />
              {I18nService.getMessage('autoProxySubtitle')}
            </p>
          </div>
        </FlexGroup>

        <Button
          onclick={handleClose}
          color="ghost"
          variant="minimal"
          aria-label={I18nService.getMessage('close')}
          classes="p-2 min-w-11 min-h-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {#snippet icon()}
            <X size={20} />
          {/snippet}
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div class={modalContent.body()}>
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
                class="block text-sm font-medium text-slate-600 dark:text-slate-400"
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
            <Text size="sm" weight="medium" classes="block text-slate-600 dark:text-slate-400">
              {I18nService.getMessage('color')}
              <span class="text-orange-500">*</span>
            </Text>
            <div
              class="relative w-12 h-12 rounded-xl shadow-lg cursor-pointer overflow-hidden group transition-transform duration-200 hover:scale-105"
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
            <Text size="sm" weight="medium" classes="block text-slate-600 dark:text-slate-400">
              {I18nService.getMessage('active')}
            </Text>
            <ToggleSwitch bind:checked={isActive} />
          </div>
        </FlexGroup>

        <!-- Badge Label Input with Preview -->
        <div class="space-y-2">
          <div class="flex items-center justify-between mb-1">
            <label
              for="badgeLabel"
              class="block text-sm font-medium text-slate-600 dark:text-slate-400"
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
                class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
              >
              <div
                class="absolute inset-0 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity duration-200"
              ></div>
            </div>
            <!-- Badge Preview -->
            <div
              class="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Text size="xs" color="muted" weight="medium">Preview:</Text>
              <div
                class="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                style="background-color: {color}"
              >
                {badgePreview}
              </div>
            </div>
          </div>
          <Text size="xs" color="muted">{I18nService.getMessage('badgeLabelHelp')}</Text>
        </div>
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
        <!-- Rules List -->
        <AutoProxyRuleList
          {rules}
          availableProxies={selectableProxies}
          onAddRule={handleAddRule}
          onEditRule={handleEditRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={handleToggleRule}
          onReorderRules={handleReorderRules}
        />

        <!-- Fallback Configuration -->
        <FallbackConfig
          {fallbackType}
          {fallbackProxyId}
          {fallbackInlineProxy}
          availableProxies={selectableProxies}
          onchange={handleFallbackChange}
        />

        <!-- Pattern Tester -->
        {#if rules.length > 0}
          <PatternTester {rules} availableProxies={selectableProxies} />
        {/if}
      {/if}

      <!-- Error Message -->
      {#if errorMessage}
        <div class={redSection.wrapper()}>
          <div class={redSection.background()}></div>
          <div class={redSection.accentBar()}></div>
          <div class="relative p-4 {redSection.content()}">
            <p class="text-red-700 dark:text-red-300 text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class={modalContent.footer()}>
      <!-- Subtle gradient background -->
      <div class={modalContent.footerBackground()}></div>

      <div class="relative">
        <FlexGroup direction="horizontal" justifyContent="between" alignItems="center">
          <!-- Rule count badge -->
          <div class={ruleCountBadgeVariants({ color: 'slate' })}>
            <Route size={14} />
            <span
              >{I18nService.getMessage('rulesConfigured', [String(rules.length), rules.length === 1 ? I18nService.getMessage('ruleSingular') : I18nService.getMessage('rulePlural')])}</span
            >
          </div>

          <FlexGroup direction="horizontal" childrenGap="sm">
            <Button color="secondary" onclick={handleClose}>
              {I18nService.getMessage('cancel')}
            </Button>
            <Button
              onclick={handleSubmit}
              disabled={isSubmitting || isAddingRule || !!editingRule}
              variant="gradient"
              gradient="orange"
            >
              {#snippet icon()}
                <Save size={16} />
              {/snippet}
              {proxyConfig ? I18nService.getMessage('saveChanges') : I18nService.getMessage('createAutoProxy')}
            </Button>
          </FlexGroup>
        </FlexGroup>
      </div>
    </div>
  </div>
</div>
