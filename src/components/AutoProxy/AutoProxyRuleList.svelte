<script lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  GripVertical,
  Pencil,
  Plus,
  Route,
  Server,
  Trash,
  Zap,
} from 'lucide-svelte'
import type { AutoProxyRule, ProxyConfig } from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import {
  emptyStateCardVariants,
  gradientIconBadgeVariants,
  matchTypeBadgeGradients,
  matchTypeBadgeVariants,
  proxyTypeIconVariants,
  ruleListItemVariants,
  warningBadgeVariants,
} from '@/utils/classPatterns/autoProxy'
import { isOrphanedRule } from '@/utils/proxyModeHelpers'
import Button from '../Button.svelte'
import ConfirmDialog from '../ConfirmDialog.svelte'
import Text from '../Text.svelte'
import ToggleSwitch from '../ToggleSwitch.svelte'

interface Props {
  rules: AutoProxyRule[]
  availableProxies: ProxyConfig[]
  onAddRule: () => void
  onEditRule: (rule: AutoProxyRule) => void
  onDeleteRule: (ruleId: string) => void
  onToggleRule: (ruleId: string, enabled: boolean) => void
  onReorderRules: (rules: AutoProxyRule[]) => void
}

let {
  rules,
  availableProxies,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onReorderRules,
}: Props = $props()

let showDeleteDialog = $state(false)
let deleteConfirmRule = $state<AutoProxyRule | null>(null)
let draggedIndex = $state<number | null>(null)

// Styling variants
const purpleIconBadge = gradientIconBadgeVariants({ color: 'purple' })
const emptyState = emptyStateCardVariants({ color: 'purple' })
const matchTypeBadge = matchTypeBadgeVariants()

function getProxyName(rule: AutoProxyRule): string {
  if (rule.proxyType === 'direct') {
    return I18nService.getMessage('directConnection')
  }
  if (rule.proxyType === 'inline' && rule.inlineProxy) {
    return `${rule.inlineProxy.host}:${rule.inlineProxy.port}`
  }
  if (rule.proxyType === 'existing' && rule.proxyId) {
    const proxy = availableProxies.find((p) => p.id === rule.proxyId)
    return proxy?.name || I18nService.getMessage('unknownProxy')
  }
  return I18nService.getMessage('directConnection')
}

function getProxyColor(rule: AutoProxyRule): string {
  if (rule.proxyType === 'direct') return '#10b981' // green
  if (rule.proxyType === 'existing' && rule.proxyId) {
    const proxy = availableProxies.find((p) => p.id === rule.proxyId)
    return proxy?.color || '#6366f1'
  }
  return '#6366f1' // indigo for inline
}

function checkIsOrphaned(rule: AutoProxyRule): boolean {
  return isOrphanedRule(rule, availableProxies)
}

function getMatchTypeLabel(matchType: AutoProxyRule['matchType']): string {
  const labels = {
    wildcard: I18nService.getMessage('matchTypeWildcard'),
    exact: I18nService.getMessage('matchTypeExact'),
    regex: I18nService.getMessage('matchTypeRegex'),
    cidr: I18nService.getMessage('matchTypeCidr'),
  }
  return labels[matchType] || matchType
}

function handleDragStart(index: number) {
  draggedIndex = index
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (draggedIndex === null || draggedIndex === index) return

  // Reorder the rules
  const newRules = [...rules]
  const [draggedRule] = newRules.splice(draggedIndex, 1)
  newRules.splice(index, 0, draggedRule)

  // Update priorities
  const reorderedRules = newRules.map((r, i) => ({ ...r, priority: i }))
  onReorderRules(reorderedRules)
  draggedIndex = index
}

function handleDragEnd() {
  draggedIndex = null
}

function confirmDelete(rule: AutoProxyRule) {
  deleteConfirmRule = rule
  showDeleteDialog = true
}

function handleConfirmDelete() {
  if (deleteConfirmRule) {
    onDeleteRule(deleteConfirmRule.id)
    showDeleteDialog = false
    deleteConfirmRule = null
  }
}

function handleCancelDelete() {
  showDeleteDialog = false
  deleteConfirmRule = null
}
</script>

<div class="space-y-4">
  <!-- Section Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class={purpleIconBadge.wrapper()}>
        <div class={purpleIconBadge.glow()}></div>
        <div class={purpleIconBadge.badge()}>
          <Route size={18} class="text-white" />
        </div>
      </div>
      <div>
        <Text weight="semibold" classes="text-slate-800 dark:text-slate-200">
          {I18nService.getMessage('routingRules') || 'Routing Rules'}
        </Text>
        <Text size="xs" color="muted">
          {I18nService.getMessage('rulesConfigured', [String(rules.length), rules.length === 1 ? I18nService.getMessage('ruleSingular') : I18nService.getMessage('rulePlural')])}
        </Text>
      </div>
    </div>
    <Button onclick={onAddRule} variant="gradient" gradient="purple" size="sm">
      {#snippet icon()}
        <Plus size={16} />
      {/snippet}
      {I18nService.getMessage('addRule')}
    </Button>
  </div>

  <!-- Rules List -->
  {#if rules.length > 0}
    <div class="space-y-3" role="list">
      {#each rules.toSorted((a, b) => a.priority - b.priority) as rule, index (rule.id)}
        {@const isOrphaned = checkIsOrphaned(rule)}
        {@const proxyColor = getProxyColor(rule)}
        {@const isDragging = draggedIndex === index}
        {@const ruleItem = ruleListItemVariants({
          enabled: rule.enabled,
          dragging: isDragging,
          orphaned: isOrphaned,
        })}
        <div
          role="listitem"
          draggable="true"
          ondragstart={() => handleDragStart(index)}
          ondragover={(e) => handleDragOver(e, index)}
          ondragend={handleDragEnd}
          class={ruleItem.wrapper()}
        >
          <!-- Card background with subtle gradient -->
          <div class={ruleItem.background()}></div>

          <!-- Left accent bar -->
          <div
            class={ruleItem.accentBar()}
            class:opacity-100={rule.enabled}
            class:opacity-40={!rule.enabled}
            style="background: linear-gradient(to bottom, {proxyColor}, {proxyColor}88)"
          ></div>

          <!-- Orphaned warning overlay -->
          {#if isOrphaned}
            <div
              class="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5"
            ></div>
            <div
              class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500"
            ></div>
          {/if}

          <!-- Content -->
          <div class={ruleItem.content()}>
            <div class="flex items-center gap-4">
              <!-- Drag Handle -->
              <div class={ruleItem.dragHandle()} title={I18nService.getMessage('dragToReorder')}>
                <GripVertical size={20} strokeWidth={2.5} />
              </div>

              <!-- Priority number -->
              <div class={ruleItem.priorityBadge()}>
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400"
                  >{index + 1}</span
                >
              </div>

              <!-- Pattern and Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Pattern code block -->
                  <code class={ruleItem.patternCode()}>{rule.pattern}</code>

                  <!-- Match type badge -->
                  <span
                    class="{matchTypeBadge} {matchTypeBadgeGradients[rule.matchType] || 'from-gray-500 to-gray-600'}"
                  >
                    {getMatchTypeLabel(rule.matchType)}
                  </span>

                  <!-- Arrow indicator -->
                  <ArrowRight size={14} class="text-slate-400 flex-shrink-0" />

                  <!-- Proxy destination -->
                  <div class="flex items-center gap-1.5">
                    {#if rule.proxyType === 'direct'}
                      <div class={proxyTypeIconVariants({ type: 'direct' })}>
                        <Zap size={12} class="text-green-600 dark:text-green-400" />
                      </div>
                    {:else if rule.proxyType === 'inline'}
                      <div class={proxyTypeIconVariants({ type: 'inline' })}>
                        <Server size={12} class="text-indigo-600 dark:text-indigo-400" />
                      </div>
                    {:else}
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {proxyColor}"
                      ></div>
                    {/if}
                    <span class="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {getProxyName(rule)}
                    </span>
                  </div>
                </div>

                <!-- Description and warnings -->
                {#if rule.description || isOrphaned}
                  <div class="flex items-center gap-2 mt-1.5">
                    {#if isOrphaned}
                      <span class={warningBadgeVariants({ color: 'amber' })}>
                        <AlertTriangle size={12} />
                        {I18nService.getMessage('referencedProxyDeleted')}
                      </span>
                    {/if}
                    {#if rule.description}
                      <Text size="xs" color="muted" classes="italic">{rule.description}</Text>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Actions -->
              <div class={ruleItem.actions()}>
                <ToggleSwitch
                  checked={rule.enabled}
                  onchange={(checked) => onToggleRule(rule.id, checked)}
                  aria-label={I18nService.getMessage(rule.enabled ? 'ruleDisabled' : 'ruleEnabled')}
                />

                <Button
                  onclick={() => onEditRule(rule)}
                  color="ghost"
                  variant="minimal"
                  aria-label={I18nService.getMessage('editRule')}
                  classes="p-2 min-w-[40px] min-h-[40px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  {#snippet icon()}
                    <Pencil size={16} />
                  {/snippet}
                </Button>

                <Button
                  onclick={() => confirmDelete(rule)}
                  color="ghost"
                  variant="minimal"
                  aria-label={I18nService.getMessage('deleteRule')}
                  classes="p-2 min-w-[40px] min-h-[40px] text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  {#snippet icon()}
                    <Trash size={16} />
                  {/snippet}
                </Button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class={emptyState.wrapper()}>
      <!-- Background decoration -->
      <div class={emptyState.background()}></div>

      <div class={emptyState.content()}>
        <div class={emptyState.iconWrapper()}>
          <Route size={32} class="text-purple-600 dark:text-purple-400" />
        </div>
        <h3 class={emptyState.title()}>
          {I18nService.getMessage('noRulesYet') || 'No rules defined yet'}
        </h3>
        <p class={emptyState.description()}>
          {I18nService.getMessage('noRulesDescription') || 'Add rules to define how URLs should be routed to different proxies'}
        </p>
        <Button onclick={onAddRule} variant="gradient" gradient="purple">
          {#snippet icon()}
            <Plus size={18} />
          {/snippet}
          {I18nService.getMessage('addRule') || 'Add Rule'}
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title={I18nService.getMessage('deleteRuleTitle') || 'Delete Rule'}
  message={I18nService.getMessage('deleteRuleMessage', deleteConfirmRule?.pattern || '') || `Are you sure you want to delete the rule "${deleteConfirmRule?.pattern}"?`}
  confirmLabel={I18nService.getMessage('delete')}
  cancelLabel={I18nService.getMessage('cancel')}
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
/>
