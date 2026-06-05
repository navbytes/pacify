<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import type { ImportResult, ImportSourceType, ImportStrategy } from '@/services/import'
import { ImportService } from '@/services/import'
import { SettingsWriter } from '@/services/SettingsWriter'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { AlertTriangle, Check, Download, FileText, Upload, X } from '@/utils/icons'
import { colors } from '@/utils/theme'
import Button from './Button.svelte'
import Text from './Text.svelte'

interface Props {
  onImported: () => Promise<void>
  onClose: () => void
}

let { onImported, onClose }: Props = $props()

type Step = 'input' | 'preview' | 'done'

let step = $state<Step>('input')
let rawText = $state('')
let errorMessage = $state('')
let isBusy = $state(false)
let result = $state<ImportResult | null>(null)
let strategy = $state<ImportStrategy>('merge')
let backupDone = $state(false)
let fileInput: HTMLInputElement | undefined = $state()

const SOURCE_LABEL_KEYS: Record<ImportSourceType, string> = {
  switchyomega: 'importSourceSwitchyOmega',
  foxyproxy: 'importSourceFoxyProxy',
  pac: 'importSourcePac',
  pacify: 'importSourcePacify',
  unknown: 'importSourceUnknown',
}

function sourceLabel(source: ImportSourceType): string {
  return I18nService.getMessage(SOURCE_LABEL_KEYS[source])
}

function resolveError(error: unknown): string {
  const key = error instanceof Error ? error.message : 'importFailed'
  // Messages thrown by ImportService are i18n keys; getMessage falls back to the key.
  return I18nService.getMessage(key)
}

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  errorMessage = ''
  isBusy = true
  try {
    result = await ImportService.parseFile(file)
    rawText = ''
    step = 'preview'
  } catch (error) {
    errorMessage = resolveError(error)
  } finally {
    isBusy = false
    input.value = ''
  }
}

function handleParseText() {
  errorMessage = ''
  if (!rawText.trim()) {
    errorMessage = I18nService.getMessage('importPasteEmpty')
    return
  }
  try {
    result = ImportService.parse(rawText)
    step = 'preview'
  } catch (error) {
    errorMessage = resolveError(error)
  }
}

async function handleBackup() {
  try {
    await SettingsWriter.backupSettings()
    backupDone = true
  } catch {
    errorMessage = I18nService.getMessage('backupFailed')
  }
}

async function handleConfirm() {
  if (!result) return
  errorMessage = ''
  isBusy = true
  try {
    await ImportService.commit(result, strategy)
    await onImported()
    step = 'done'
  } catch (error) {
    errorMessage = resolveError(error)
  } finally {
    isBusy = false
  }
}

function handleBack() {
  step = 'input'
  result = null
  errorMessage = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') onClose()
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) onClose()
}

let warnings = $derived(result?.report.warnings ?? [])
let skippedCount = $derived(warnings.filter((w) => w.level === 'skipped').length)
</script>

<div
  class={cn(modalVariants.overlay(), flexPatterns.center)}
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="import-dialog-title"
  tabindex="-1"
>
  <div class={cn(modalVariants.content({ size: 'lg' }), 'mx-4 animate-scale-in')}>
    <!-- Header -->
    <div class={cn(modalVariants.header(), 'items-start justify-between')}>
      <div class={cn(flexPatterns.start, 'gap-3')}>
        <div
          class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40"
        >
          <Upload size={20} class="text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <h3 id="import-dialog-title" class={cn('text-lg font-semibold', colors.text.default)}>
            {I18nService.getMessage('importTitle')}
          </h3>
          <Text as="p" size="sm" color="muted">{I18nService.getMessage('importSubtitle')}</Text>
        </div>
      </div>
      <Button
        onclick={onClose}
        color="ghost"
        variant="minimal"
        aria-label={I18nService.getMessage('close')}
        classes={cn(colors.icon.muted, 'p-2 min-w-[40px] min-h-[40px]')}
        data-testid="import-close-btn"
      >
        {#snippet icon()}
          <X size={20} />
        {/snippet}
      </Button>
    </div>

    <!-- Body -->
    <div class={modalVariants.body()}>
      {#if step === 'input'}
        <Text as="p" size="sm" color="muted" classes="mb-4">
          {I18nService.getMessage('importInputHelp')}
        </Text>

        <!-- File upload -->
        <Button color="secondary" onclick={() => fileInput?.click()} data-testid="import-file-btn">
          {#snippet icon()}
            <FileText size={18} />
          {/snippet}
          {I18nService.getMessage('importChooseFile')}
        </Button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".json,.bak,.pac,application/json,text/plain"
          onchange={handleFile}
          class="hidden"
          aria-label={I18nService.getMessage('importChooseFile')}
          data-testid="import-file-input"
        >

        <!-- Paste fallback -->
        <div class="mt-5">
          <Text as="label" size="sm" weight="medium" classes="block mb-1">
            {I18nService.getMessage('importPasteLabel')}
          </Text>
          <textarea
            bind:value={rawText}
            rows="6"
            placeholder={I18nService.getMessage('importPastePlaceholder')}
            class="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            data-testid="import-paste-input"
          ></textarea>
          <div class="mt-2 flex justify-end">
            <Button
              color="primary"
              onclick={handleParseText}
              disabled={isBusy}
              data-testid="import-parse-btn"
            >
              {I18nService.getMessage('importPreviewBtn')}
            </Button>
          </div>
        </div>
      {:else if step === 'preview' && result}
        <!-- Summary -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <div class={cn(flexPatterns.start, 'gap-2 mb-3')}>
            <Check size={18} class="text-emerald-500" />
            <Text weight="semibold">
              {I18nService.getMessage('importDetected', sourceLabel(result.report.source))}
            </Text>
          </div>
          <Text as="p" size="sm" color="muted">
            {I18nService.getMessage('importSummary', [
              String(result.report.proxyCount),
              String(result.report.ruleCount),
            ])}
          </Text>
        </div>

        <!-- Warnings / skipped -->
        {#if warnings.length > 0}
          <div
            class="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 mb-4"
          >
            <div class={cn(flexPatterns.start, 'gap-2 mb-2')}>
              <AlertTriangle size={16} class="text-amber-500" />
              <Text size="sm" weight="medium" classes="text-amber-700 dark:text-amber-300">
                {I18nService.getMessage('importWarningsTitle', [
                  String(warnings.length),
                  String(skippedCount),
                ])}
              </Text>
            </div>
            <ul class="space-y-1 max-h-40 overflow-y-auto">
              {#each warnings as warning, i (i)}
                <li class="text-xs text-amber-800 dark:text-amber-200">
                  <span class="font-medium">{warning.context}:</span>
                  {warning.message}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Strategy -->
        <fieldset class="mb-4">
          <legend class="text-sm font-medium mb-2">
            {I18nService.getMessage('importStrategyLabel')}
          </legend>
          <label class="flex items-center gap-2 mb-1 cursor-pointer">
            <input
              type="radio"
              value="merge"
              bind:group={strategy}
              data-testid="import-strategy-merge"
            >
            <Text size="sm">{I18nService.getMessage('importStrategyMerge')}</Text>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="replace"
              bind:group={strategy}
              data-testid="import-strategy-replace"
            >
            <Text size="sm">{I18nService.getMessage('importStrategyReplace')}</Text>
          </label>
        </fieldset>

        <!-- Pre-import backup nudge -->
        <div
          class="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-between gap-3"
        >
          <Text size="xs" color="muted">
            {backupDone
              ? I18nService.getMessage('importBackupDone')
              : I18nService.getMessage('importBackupHint')}
          </Text>
          <Button color="secondary" onclick={handleBackup} data-testid="import-backup-btn">
            {#snippet icon()}
              <Download size={16} />
            {/snippet}
            {I18nService.getMessage('backupSettings')}
          </Button>
        </div>
      {:else if step === 'done'}
        <div class="text-center py-6">
          <div
            class="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3"
          >
            <Check size={24} class="text-emerald-600 dark:text-emerald-300" />
          </div>
          <Text weight="semibold" classes="block mb-1">
            {I18nService.getMessage('importDoneTitle')}
          </Text>
          {#if result}
            <Text as="p" size="sm" color="muted">
              {I18nService.getMessage('importDoneSummary', String(result.report.proxyCount))}
            </Text>
          {/if}
        </div>
      {/if}

      {#if errorMessage}
        <div class="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 p-3">
          <Text as="p" size="sm" classes="text-red-700 dark:text-red-300">{errorMessage}</Text>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class={modalVariants.footer()}>
      {#if step === 'preview'}
        <Button color="secondary" onclick={handleBack} data-testid="import-back-btn">
          {I18nService.getMessage('back')}
        </Button>
        <Button
          color="primary"
          onclick={handleConfirm}
          disabled={isBusy}
          data-testid="import-confirm-btn"
        >
          {I18nService.getMessage('importConfirmBtn')}
        </Button>
      {:else if step === 'done'}
        <Button color="primary" onclick={onClose} data-testid="import-done-btn">
          {I18nService.getMessage('done')}
        </Button>
      {:else}
        <Button color="secondary" onclick={onClose}>{I18nService.getMessage('cancel')}</Button>
      {/if}
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
