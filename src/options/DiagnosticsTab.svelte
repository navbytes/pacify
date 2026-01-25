<script lang="ts">
import { onMount } from 'svelte'
import Button from '@/components/Button.svelte'
import Text from '@/components/Text.svelte'
import type { DiagnosticLogEntry } from '@/interfaces/error'
import type { ProxyConfig } from '@/interfaces/settings'
import { diagnosticsService } from '@/services/DiagnosticsService'
import { I18nService } from '@/services/i18n/i18nService'
import { SettingsReader } from '@/services/SettingsReader'
import { toastStore } from '@/stores/toastStore'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  Download,
  HardDrive,
  Info,
  Server,
  Shield,
  Trash2,
} from '@/utils/icons'

let logs = $state<DiagnosticLogEntry[]>([])
let expandedLogIds = $state<Set<string>>(new Set())
let isLoading = $state(true)

// System status state
let activeProxy = $state<ProxyConfig | null>(null)
let totalProxies = $state(0)
let storageUsage = $state<{ used: number; total: number } | null>(null)
let extensionVersion = $state('')

onMount(async () => {
  await Promise.all([loadLogs(), loadSystemStatus()])
  isLoading = false
})

async function loadSystemStatus() {
  try {
    // Load settings
    const settings = await SettingsReader.getSettings()
    totalProxies = settings.proxyConfigs.length
    activeProxy = settings.proxyConfigs.find((p) => p.isActive) || null

    // Get extension version
    const manifest = chrome.runtime.getManifest()
    extensionVersion = manifest.version

    // Get storage usage
    if (chrome.storage.local.getBytesInUse) {
      const bytesUsed = await chrome.storage.local.getBytesInUse(null)
      storageUsage = {
        used: bytesUsed,
        total: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
      }
    }
  } catch (error) {
    console.error('Failed to load system status:', error)
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getProxyModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    direct: I18nService.getMessage('modeDirect') || 'Direct',
    auto_detect: I18nService.getMessage('modeAutoDetect') || 'Auto-detect',
    pac_script: I18nService.getMessage('modePacScript') || 'PAC Script',
    fixed_servers: I18nService.getMessage('modeManual') || 'Manual',
    system: I18nService.getMessage('modeSystem') || 'System',
  }
  return labels[mode] || mode
}

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
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
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

  <!-- System Status Panel -->
  <div class="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Active Proxy Status -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
        >
          <Shield class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-400">
            {I18nService.getMessage('activeProxy') || 'Active Proxy'}
          </Text>
          <Text as="p" size="sm" weight="semibold" classes="text-slate-900 dark:text-slate-100">
            {#if activeProxy}
              {activeProxy.name}
            {:else}
              {I18nService.getMessage('noActiveProxy') || 'None'}
            {/if}
          </Text>
        </div>
      </div>
      {#if activeProxy}
        <div class="mt-2 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <Text as="span" size="xs" classes="text-slate-600 dark:text-slate-400">
            {getProxyModeLabel(activeProxy.mode)}
          </Text>
        </div>
      {:else}
        <div class="mt-2 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-slate-400"></span>
          <Text as="span" size="xs" classes="text-slate-600 dark:text-slate-400">
            {I18nService.getMessage('directConnection') || 'Direct connection'}
          </Text>
        </div>
      {/if}
    </div>

    <!-- Proxy Count -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
        >
          <Server class="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-400">
            {I18nService.getMessage('configuredProxies') || 'Configured Proxies'}
          </Text>
          <Text as="p" size="sm" weight="semibold" classes="text-slate-900 dark:text-slate-100">
            {totalProxies}
          </Text>
        </div>
      </div>
    </div>

    <!-- Storage Usage -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
        >
          <HardDrive class="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-400">
            {I18nService.getMessage('storageUsed') || 'Storage Used'}
          </Text>
          <Text as="p" size="sm" weight="semibold" classes="text-slate-900 dark:text-slate-100">
            {#if storageUsage}
              {formatBytes(storageUsage.used)}
            {:else}
              --
            {/if}
          </Text>
        </div>
      </div>
      {#if storageUsage}
        <div class="mt-2">
          <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-500 rounded-full transition-all"
              style="width: {Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%"
            ></div>
          </div>
          <Text as="p" size="xs" classes="mt-1 text-slate-500 dark:text-slate-400">
            {((storageUsage.used / storageUsage.total) * 100).toFixed(1)}% of
            {formatBytes(storageUsage.total)}
          </Text>
        </div>
      {/if}
    </div>

    <!-- Extension Info -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
        >
          <Activity class="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-400">
            {I18nService.getMessage('extensionVersion') || 'Extension Version'}
          </Text>
          <Text as="p" size="sm" weight="semibold" classes="text-slate-900 dark:text-slate-100">
            v{extensionVersion}
          </Text>
        </div>
      </div>
      <div class="mt-2">
        <Text as="p" size="xs" classes="text-slate-500 dark:text-slate-400">
          {I18nService.getMessage('logsCount') || 'Activity Logs'}: {logs.length}
        </Text>
      </div>
    </div>
  </div>

  <!-- Activity Log Section Header -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
      {I18nService.getMessage('activityLog') || 'Activity Log'}
    </h3>
  </div>

  <!-- Loading state -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if logs.length === 0}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4"
      >
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

              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{log.type}</p>
              <p class="text-sm text-slate-700 dark:text-slate-300 mt-1">{log.message}</p>
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
            <div
              class="px-4 pb-4 pl-12 space-y-3 border-t border-slate-200 dark:border-slate-700/50 pt-3"
            >
              {#if log.details}
                <div>
                  <Text
                    as="p"
                    size="xs"
                    weight="medium"
                    classes="text-slate-600 dark:text-slate-400 mb-1"
                  >
                    {I18nService.getMessage('details') || 'Details'}
                  </Text>
                  <Text
                    as="pre"
                    size="xs"
                    classes="text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-2 rounded"
                  >
                    {log.details}
                  </Text>
                </div>
              {/if}

              {#if log.url}
                <div>
                  <Text
                    as="p"
                    size="xs"
                    weight="medium"
                    classes="text-slate-600 dark:text-slate-400 mb-1"
                  >
                    {I18nService.getMessage('url') || 'URL'}
                  </Text>
                  <Text
                    as="p"
                    size="xs"
                    classes="text-slate-700 dark:text-slate-300 font-mono break-all"
                  >
                    {log.url}
                  </Text>
                </div>
              {/if}

              {#if log.stack}
                <div>
                  <Text
                    as="p"
                    size="xs"
                    weight="medium"
                    classes="text-slate-600 dark:text-slate-400 mb-1"
                  >
                    {I18nService.getMessage('stackTrace') || 'Stack Trace'}
                  </Text>
                  <Text
                    as="pre"
                    size="xs"
                    classes="text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-2 rounded max-h-64 overflow-auto"
                  >
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
