<script lang="ts">
import {
  AlertCircle,
  Check,
  Clock,
  Globe,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Rss,
  Trash,
  X,
} from 'lucide-svelte'
import type {
  AutoProxyRouteType,
  AutoProxySubscription,
  ProxyConfig,
  ProxyServer,
  SubscriptionFormat,
} from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import { SubscriptionParser } from '@/services/SubscriptionParser'
import {
  emptyStateCardVariants,
  formInputVariants,
  gradientIconBadgeVariants,
  gradientSectionVariants,
  sectionInnerContentVariants,
} from '@/utils/classPatterns/autoProxy'
import Button from '../Button.svelte'
import ConfirmDialog from '../ConfirmDialog.svelte'
import Text from '../Text.svelte'
import ToggleSwitch from '../ToggleSwitch.svelte'
import ProxySelector from './ProxySelector.svelte'

interface Props {
  subscriptions: AutoProxySubscription[]
  availableProxies: ProxyConfig[]
  onUpdate: (subscriptions: AutoProxySubscription[]) => void
}

let { subscriptions, availableProxies, onUpdate }: Props = $props()

// UI state
let isAdding = $state(false)
let editingId = $state<string | null>(null)
let showDeleteDialog = $state(false)
let deleteTarget = $state<AutoProxySubscription | null>(null)
let refreshingIds = $state<Set<string>>(new Set())

// Form state for adding/editing subscription
let formName = $state('')
let formUrl = $state('')
let formFormat = $state<SubscriptionFormat>('auto')
let formProxyType = $state<AutoProxyRouteType>('direct')
let formProxyId = $state<string | undefined>(undefined)
let formInlineProxy = $state<ProxyServer | undefined>(undefined)
let formUpdateInterval = $state(60) // default 60 minutes
let formError = $state('')
let formLoading = $state(false)

let isEditing = $derived(editingId !== null)

const cyanIconBadge = gradientIconBadgeVariants({ color: 'cyan' })
const emptyState = emptyStateCardVariants({ color: 'slate' })
const cyanSection = gradientSectionVariants({ color: 'cyan' })

function resetForm() {
  formName = ''
  formUrl = ''
  formFormat = 'auto'
  formProxyType = 'direct'
  formProxyId = undefined
  formInlineProxy = undefined
  formUpdateInterval = 60
  formError = ''
  formLoading = false
  editingId = null
}

function handleStartAdd() {
  resetForm()
  isAdding = true
}

function handleStartEdit(sub: AutoProxySubscription) {
  formName = sub.name
  formUrl = sub.url
  formFormat = sub.format
  formProxyType = sub.proxyType
  formProxyId = sub.proxyId
  formInlineProxy = sub.inlineProxy
  formUpdateInterval = sub.updateInterval
  formError = ''
  formLoading = false
  editingId = sub.id
  isAdding = true
}

function handleCancelAdd() {
  isAdding = false
  resetForm()
}

function handleProxyChange(
  newProxyType: AutoProxyRouteType,
  newProxyId?: string,
  newInlineProxy?: ProxyServer
) {
  formProxyType = newProxyType
  formProxyId = newProxyId
  formInlineProxy = newInlineProxy
}

async function handleAdd() {
  formError = ''

  if (!formName.trim()) {
    formError = I18nService.getMessage('subscriptionNameRequired')
    return
  }

  if (!formUrl.trim()) {
    formError = I18nService.getMessage('subscriptionUrlRequired')
    return
  }

  // Validate URL
  try {
    new URL(formUrl.trim())
  } catch {
    formError = I18nService.getMessage('subscriptionUrlInvalid')
    return
  }

  // When editing, check if URL or format changed — only re-fetch if so
  const existingSub = editingId ? subscriptions.find((s) => s.id === editingId) : null
  const urlChanged =
    !existingSub || existingSub.url !== formUrl.trim() || existingSub.format !== formFormat

  let cachedRules = existingSub?.cachedRules
  let ruleCount = existingSub?.ruleCount
  let lastUpdated = existingSub?.lastUpdated

  if (urlChanged) {
    formLoading = true

    try {
      const parsed = await SubscriptionParser.fetchAndParse(formUrl.trim(), formFormat)

      if (parsed.domains.length === 0) {
        formError = I18nService.getMessage('subscriptionNoRules')
        formLoading = false
        return
      }

      cachedRules = parsed.domains
      ruleCount = parsed.domains.length
      lastUpdated = Date.now()
    } catch (error) {
      formError =
        error instanceof Error ? error.message : I18nService.getMessage('subscriptionFetchFailed')
      formLoading = false
      return
    }
  }

  const subData: AutoProxySubscription = {
    id: editingId || crypto.randomUUID(),
    name: formName.trim(),
    url: formUrl.trim(),
    format: formFormat,
    enabled: existingSub?.enabled ?? true,
    proxyType: formProxyType,
    proxyId: formProxyId,
    inlineProxy: formInlineProxy,
    updateInterval: formUpdateInterval,
    lastUpdated,
    ruleCount,
    cachedRules,
  }

  if (editingId) {
    onUpdate(subscriptions.map((s) => (s.id === editingId ? subData : s)))
  } else {
    onUpdate([...subscriptions, subData])
  }

  isAdding = false
  resetForm()
  formLoading = false
}

function handleToggle(subId: string, enabled: boolean) {
  onUpdate(subscriptions.map((s) => (s.id === subId ? { ...s, enabled } : s)))
}

function confirmDelete(sub: AutoProxySubscription) {
  deleteTarget = sub
  showDeleteDialog = true
}

function handleConfirmDelete() {
  if (deleteTarget) {
    onUpdate(subscriptions.filter((s) => s.id !== deleteTarget!.id))
    showDeleteDialog = false
    deleteTarget = null
  }
}

function handleCancelDelete() {
  showDeleteDialog = false
  deleteTarget = null
}

async function handleRefresh(sub: AutoProxySubscription) {
  const newRefreshing = new Set(refreshingIds)
  newRefreshing.add(sub.id)
  refreshingIds = newRefreshing

  try {
    const parsed = await SubscriptionParser.fetchAndParse(sub.url, sub.format)

    onUpdate(
      subscriptions.map((s) =>
        s.id === sub.id
          ? {
              ...s,
              cachedRules: parsed.domains,
              ruleCount: parsed.domains.length,
              lastUpdated: Date.now(),
              lastError: undefined,
            }
          : s
      )
    )
  } catch (error) {
    onUpdate(
      subscriptions.map((s) =>
        s.id === sub.id
          ? { ...s, lastError: error instanceof Error ? error.message : 'Refresh failed' }
          : s
      )
    )
  } finally {
    const updated = new Set(refreshingIds)
    updated.delete(sub.id)
    refreshingIds = updated
  }
}

function formatLastUpdated(timestamp?: number): string {
  if (!timestamp) return I18nService.getMessage('never')
  const date = new Date(timestamp)
  const now = Date.now()
  const diffMinutes = Math.floor((now - timestamp) / 60000)

  if (diffMinutes < 1) return I18nService.getMessage('justNow')
  if (diffMinutes < 60) return I18nService.getMessage('minutesAgo', [String(diffMinutes)])
  if (diffMinutes < 1440)
    return I18nService.getMessage('hoursAgo', [String(Math.floor(diffMinutes / 60))])
  return date.toLocaleDateString()
}

const formatOptions: { value: SubscriptionFormat; label: string }[] = [
  { value: 'auto', label: I18nService.getMessage('formatAuto') },
  { value: 'abp', label: I18nService.getMessage('formatAbp') },
  { value: 'domains', label: I18nService.getMessage('formatDomains') },
]

const intervalOptions: { value: number; label: string }[] = [
  { value: 0, label: I18nService.getMessage('intervalManual') },
  { value: 30, label: I18nService.getMessage('intervalMinutes', ['30']) },
  { value: 60, label: I18nService.getMessage('intervalHour', ['1']) },
  { value: 360, label: I18nService.getMessage('intervalHours', ['6']) },
  { value: 720, label: I18nService.getMessage('intervalHours', ['12']) },
  { value: 1440, label: I18nService.getMessage('intervalDay', ['1']) },
]
</script>

<div class="space-y-4">
  <!-- Section Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class={cyanIconBadge.wrapper()}>
        <div class={cyanIconBadge.badge()}>
          <Rss size={18} class="text-white" />
        </div>
      </div>
      <div>
        <Text weight="semibold" classes="text-slate-800 dark:text-slate-200">
          {I18nService.getMessage('subscriptions')}
        </Text>
        <Text size="xs" color="muted">{I18nService.getMessage('subscriptionsDescription')}</Text>
      </div>
    </div>
    {#if !isAdding}
      <Button
        onclick={handleStartAdd}
        variant="gradient"
        gradient="cyan"
        size="sm"
        data-testid="add-subscription-btn"
      >
        {#snippet icon()}
          <Plus size={16} />
        {/snippet}
        {I18nService.getMessage('addSubscription')}
      </Button>
    {:else if isEditing}
      <Text size="sm" color="muted" classes="italic">
        {I18nService.getMessage('editSubscription')}
      </Text>
    {/if}
  </div>

  <!-- Add Subscription Form -->
  {#if isAdding}
    <div class={cyanSection.wrapper()}>
      <div class={cyanSection.background()}></div>
      <div class={cyanSection.accentBar()}></div>

      <div class={cyanSection.content()}>
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label
              for="sub-name"
              class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              {I18nService.getMessage('subscriptionName')}
              <span class="text-cyan-500">*</span>
            </label>
            <input
              id="sub-name"
              type="text"
              bind:value={formName}
              placeholder={I18nService.getMessage('subscriptionNamePlaceholder')}
              class={formInputVariants({ state: 'cyan' })}
              data-testid="subscription-name-input"
            >
          </div>

          <!-- URL -->
          <div>
            <label
              for="sub-url"
              class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              {I18nService.getMessage('subscriptionUrl')}
              <span class="text-cyan-500">*</span>
            </label>
            <input
              id="sub-url"
              type="url"
              bind:value={formUrl}
              placeholder="https://example.com/rules.txt"
              class={formInputVariants({ state: 'cyan', variant: 'mono' })}
              data-testid="subscription-url-input"
            >
          </div>

          <!-- Format & Interval row -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                for="sub-format"
                class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                {I18nService.getMessage('subscriptionFormat')}
              </label>
              <select
                id="sub-format"
                bind:value={formFormat}
                class="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all"
              >
                {#each formatOptions as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label
                for="sub-interval"
                class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                {I18nService.getMessage('subscriptionInterval')}
              </label>
              <select
                id="sub-interval"
                bind:value={formUpdateInterval}
                class="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all"
              >
                {#each intervalOptions as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Proxy Selection -->
          <div>
            <Text weight="medium" size="sm" classes="text-slate-600 dark:text-slate-400 mb-2 block">
              {I18nService.getMessage('routeTo')}
            </Text>
            <div class={sectionInnerContentVariants({ color: 'cyan' })}>
              <ProxySelector
                proxyType={formProxyType}
                proxyId={formProxyId}
                inlineProxy={formInlineProxy}
                {availableProxies}
                onchange={handleProxyChange}
              />
            </div>
          </div>

          <!-- Error -->
          {#if formError}
            <div
              class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <AlertCircle size={16} class="text-red-500 shrink-0" />
              <Text size="sm" classes="text-red-600 dark:text-red-400">{formError}</Text>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-1">
            <Button
              color="secondary"
              onclick={handleCancelAdd}
              disabled={formLoading}
              data-testid="subscription-cancel-btn"
            >
              {I18nService.getMessage('cancel')}
            </Button>
            <Button
              onclick={handleAdd}
              disabled={formLoading}
              variant="gradient"
              gradient="cyan"
              data-testid="subscription-add-btn"
            >
              {#snippet icon()}
                {#if formLoading}
                  <Loader2 size={16} class="animate-spin" />
                {:else}
                  <Check size={16} />
                {/if}
              {/snippet}
              {formLoading ? I18nService.getMessage('subscriptionFetching') : isEditing ? I18nService.getMessage('saveSubscription') : I18nService.getMessage('addSubscription')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Subscription List -->
  {#if subscriptions.length > 0}
    <div class="space-y-3" role="list">
      {#each subscriptions as sub (sub.id)}
        {@const isRefreshing = refreshingIds.has(sub.id)}
        <div
          role="listitem"
          class="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01]"
          class:opacity-50={!sub.enabled}
        >
          <!-- Background -->
          <div
            class="absolute inset-0 bg-linear-to-r from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700"
          ></div>

          <!-- Accent bar -->
          <div
            class="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-cyan-500 to-blue-500 transition-opacity"
            class:opacity-100={sub.enabled}
            class:opacity-40={!sub.enabled}
          ></div>

          <!-- Error overlay -->
          {#if sub.lastError}
            <div
              class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-500 to-orange-500"
            ></div>
          {/if}

          <!-- Content -->
          <div
            class="relative p-4 pl-5 border border-l-0 rounded-xl rounded-l-none border-slate-200/80 dark:border-slate-700/50"
          >
            <div class="flex items-center gap-4">
              <!-- Icon -->
              <div class="shrink-0 p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Globe size={18} class="text-cyan-600 dark:text-cyan-400" />
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <Text weight="semibold" size="sm" classes="text-slate-800 dark:text-slate-200">
                    {sub.name}
                  </Text>
                  {#if sub.ruleCount !== undefined}
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-linear-to-r from-cyan-500 to-blue-500"
                    >
                      {sub.ruleCount}
                      {I18nService.getMessage('rules')}
                    </span>
                  {/if}
                </div>

                <div class="flex items-center gap-3 mt-1">
                  <code class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
                    {sub.url}
                  </code>
                </div>

                <div class="flex items-center gap-3 mt-1.5">
                  <span class="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {formatLastUpdated(sub.lastUpdated)}
                  </span>
                  {#if sub.lastError}
                    <span class="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      {sub.lastError}
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <ToggleSwitch
                  checked={sub.enabled}
                  onchange={(checked) => handleToggle(sub.id, checked)}
                />

                <Button
                  onclick={() => handleStartEdit(sub)}
                  color="ghost"
                  variant="minimal"
                  aria-label={I18nService.getMessage('editSubscription')}
                  classes="p-2 min-w-[40px] min-h-[40px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  data-testid="edit-subscription-btn-{sub.id}"
                >
                  {#snippet icon()}
                    <Pencil size={16} />
                  {/snippet}
                </Button>

                <Button
                  onclick={() => handleRefresh(sub)}
                  color="ghost"
                  variant="minimal"
                  disabled={isRefreshing}
                  aria-label={I18nService.getMessage('refreshSubscription')}
                  classes="p-2 min-w-[40px] min-h-[40px] text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                  data-testid="refresh-subscription-btn-{sub.id}"
                >
                  {#snippet icon()}
                    <RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
                  {/snippet}
                </Button>

                <Button
                  onclick={() => confirmDelete(sub)}
                  color="ghost"
                  variant="minimal"
                  aria-label={I18nService.getMessage('deleteSubscription')}
                  classes="p-2 min-w-[40px] min-h-[40px] text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  data-testid="delete-subscription-btn-{sub.id}"
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
  {:else if !isAdding}
    <!-- Empty State -->
    <div class={emptyState.wrapper()}>
      <div class={emptyState.background()}></div>
      <div class={emptyState.content()}>
        <div class={emptyState.iconWrapper()}>
          <Rss size={32} class="text-slate-400 dark:text-slate-500" />
        </div>
        <h3 class={emptyState.title()}>{I18nService.getMessage('noSubscriptions')}</h3>
        <p class={emptyState.description()}>
          {I18nService.getMessage('noSubscriptionsDescription')}
        </p>
        <Button
          onclick={handleStartAdd}
          variant="gradient"
          gradient="cyan"
          data-testid="add-subscription-empty-btn"
        >
          {#snippet icon()}
            <Plus size={18} />
          {/snippet}
          {I18nService.getMessage('addSubscription')}
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title={I18nService.getMessage('deleteSubscriptionTitle')}
  message={I18nService.getMessage('deleteSubscriptionMessage', deleteTarget?.name || '')}
  confirmLabel={I18nService.getMessage('delete')}
  cancelLabel={I18nService.getMessage('cancel')}
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
/>
