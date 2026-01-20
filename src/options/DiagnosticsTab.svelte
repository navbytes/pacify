<script lang="ts">
import { onMount } from 'svelte'
import Button from '@/components/Button.svelte'
import Text from '@/components/Text.svelte'
import type { DiagnosticLogEntry } from '@/interfaces/error'
import { I18nService } from '@/services/i18n/i18nService'
import { diagnosticsService } from '@/services/DiagnosticsService'
import { toastStore } from '@/stores/toastStore'
import { Download, Trash2, AlertCircle, AlertTriangle, Info, ChevronDown, CheckCheck } from '@/utils/icons'
import { formLabelVariants, inputVariants } from '@/utils/classPatterns'

let logs = $state<DiagnosticLogEntry[]>([])
let expandedLogIds = $state<Set<string>>(new Set())
let isLoading = $state(true)

onMount(async () => {
  await loadLogs()
  isLoading = false
})

async function loadLogs() {
  logs = await diagnosticsService.getLogs()
}

function toggleExpanded(logId: string) {
  if (expandedLogIds.has(logId)) {
    expandedLogIds.delete(logId)
  } else {
    expandedLogIds.add(logId)
    // Mark as read when expanded
    diagnosticsService.markAsRead([logId])
  }
  expandedLogIds = new Set(expandedLogIds) // Trigger reactivity
}

async function handleExport() {
  try {
    const json = await diagnosticsService.exportLogs()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pacify-diagnostics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toastStore.show(
      I18nService.getMessage('diagnosticsExported') || 'Diagnostics exported successfully',
      'success'
    )
  } catch (error) {
    console.error('Failed to export diagnostics:', error)
    toastStore.show(
      I18nService.getMessage('diagnosticsExportFailed') || 'Failed to export diagnostics',
      'error'
    )
  }
}

async function handleClear() {
  if (!confirm(I18nService.getMessage('confirmClearLogs') || 'Clear all diagnostic logs?')) {
    return
  }

  try {
    await diagnosticsService.clearLogs()
    logs = []
    expandedLogIds.clear()
    toastStore.show(
      I18nService.getMessage('diagnosticsCleared') || 'Diagnostics cleared successfully',
      'success'
    )
  } catch (error) {
    console.error('Failed to clear diagnostics:', error)
    toastStore.show(
      I18nService.getMessage('diagnosticsClearFailed') || 'Failed to clear diagnostics',
      'error'
    )
  }
}

async function handleMarkAllRead() {
  await diagnosticsService.markAllAsRead()
  await loadLogs()
  toastStore.show(
    I18nService.getMessage('allLogsMarkedRead') || 'All logs marked as read',
    'success'
  )
}

function getSeverityIcon(severity: DiagnosticLogEntry['severity']) {
  switch (severity) {
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
  }
}

function getSeverityColor(severity: DiagnosticLogEntry['severity']) {
  switch (severity) {
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
  }
}

function getSeverityBg(severity: DiagnosticLogEntry['severity']) {
  switch (severity) {
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp

  // Less than 1 minute
  if (diff < 60000) {
    return I18nService.getMessage('justNow') || 'Just now'
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  // Show full date
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<div class="max-w-6xl mx-auto py-8 px-4">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {I18nService.getMessage('diagnostics') || 'Diagnostics'}
      </h2>
      <Text as="p" size="sm" classes="mt-1 text-slate-600 dark:text-slate-400">
        {I18nService.getMessage('diagnosticsDesc') ||
          'View error logs and diagnostic information for debugging'}
      </Text>
    </div>

    <div class="flex items-center gap-2">
      {#if logs.length > 0}
        <Button color="secondary" size="sm" onclick={handleMarkAllRead}>
          {#snippet icon()}
            <CheckCheck class="w-4 h-4" />
          {/snippet}
          {I18nService.getMessage('markAllRead') || 'Mark all read'}
        </Button>

        <Button color="secondary" size="sm" onclick={handleExport}>
          {#snippet icon()}
            <Download class="w-4 h-4" />
          {/snippet}
          {I18nService.getMessage('export') || 'Export'}
        </Button>

        <Button color="error" size="sm" onclick={handleClear}>
          {#snippet icon()}
            <Trash2 class="w-4 h-4" />
          {/snippet}
          {I18nService.getMessage('clearAll') || 'Clear all'}
        </Button>
      {/if}
    </div>
  </div>

  <!-- Loading state -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if logs.length === 0}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
        <CheckCheck class="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {I18nService.getMessage('noErrors') || 'No errors detected'}
      </h3>
      <Text as="p" size="sm" classes="text-slate-600 dark:text-slate-400">
        {I18nService.getMessage('noErrorsDesc') || 'Your proxies are working fine!'}
      </Text>
    </div>
  {:else}
    <!-- Log entries -->
    <div class="space-y-3">
      {#each logs as log (log.id)}
        {@const SeverityIcon = getSeverityIcon(log.severity)}
        {@const isExpanded = expandedLogIds.has(log.id)}
        <div
          class="border rounded-lg overflow-hidden transition-all {getSeverityBg(log.severity)} {
            !log.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
          }"
        >
          <!-- Log header (always visible) -->
          <button
            type="button"
            onclick={() => toggleExpanded(log.id)}
            class="w-full px-4 py-3 flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <!-- Severity icon -->
            <SeverityIcon class="w-5 h-5 {getSeverityColor(log.severity)} shrink-0 mt-0.5" />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-sm uppercase {getSeverityColor(log.severity)}">
                  {log.severity}
                </span>
                <span class="text-slate-400 dark:text-slate-500">•</span>
                <span class="text-sm text-slate-600 dark:text-slate-400">
                  {formatTimestamp(log.timestamp)}
                </span>
                {#if log.proxyName}
                  <span class="text-slate-400 dark:text-slate-500">•</span>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {log.proxyName}
                  </span>
                {/if}
              </div>

              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                {log.type}
              </p>
              <p class="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {log.message}
              </p>
            </div>

            <!-- Expand icon -->
            <ChevronDown
              class="w-5 h-5 text-slate-400 shrink-0 transition-transform {isExpanded
                ? 'rotate-180'
                : ''}"
            />
          </button>

          <!-- Expanded details -->
          {#if isExpanded}
            <div class="px-4 pb-4 pl-12 space-y-3 border-t border-slate-200 dark:border-slate-700/50 pt-3">
              {#if log.details}
                <div>
                  <Text as="p" size="xs" weight="medium" classes="text-slate-600 dark:text-slate-400 mb-1">
                    {I18nService.getMessage('details') || 'Details'}
                  </Text>
                  <Text as="pre" size="xs" classes="text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-2 rounded">
                    {log.details}
                  </Text>
                </div>
              {/if}

              {#if log.url}
                <div>
                  <Text as="p" size="xs" weight="medium" classes="text-slate-600 dark:text-slate-400 mb-1">
                    {I18nService.getMessage('url') || 'URL'}
                  </Text>
                  <Text as="p" size="xs" classes="text-slate-700 dark:text-slate-300 font-mono break-all">
                    {log.url}
                  </Text>
                </div>
              {/if}

              {#if log.stack}
                <div>
                  <Text as="p" size="xs" weight="medium" classes="text-slate-600 dark:text-slate-400 mb-1">
                    {I18nService.getMessage('stackTrace') || 'Stack Trace'}
                  </Text>
                  <Text as="pre" size="xs" classes="text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-2 rounded max-h-64 overflow-auto">
                    {log.stack}
                  </Text>
                </div>
              {/if}

              <div class="text-xs text-slate-500 dark:text-slate-400">
                {I18nService.getMessage('logId') || 'ID'}: {log.id}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
