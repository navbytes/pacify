<script lang="ts">
import type { ExportFormat } from '@/services/export'
import { ExportService } from '@/services/export'
import { I18nService } from '@/services/i18n/i18nService'
import { settingsStore } from '@/stores/settingsStore'
import { toastStore } from '@/stores/toastStore'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Download, X } from '@/utils/icons'
import { colors } from '@/utils/theme'
import Button from './Button.svelte'
import Text from './Text.svelte'

interface Props {
  onClose: () => void
}

let { onClose }: Props = $props()

let settings = $derived($settingsStore)
let format = $state<ExportFormat>('pacify')

const FORMATS: { id: ExportFormat; labelKey: string; descKey: string }[] = [
  { id: 'pacify', labelKey: 'exportFormatPacify', descKey: 'exportFormatPacifyDesc' },
  {
    id: 'switchyomega',
    labelKey: 'exportFormatSwitchyOmega',
    descKey: 'exportFormatSwitchyOmegaDesc',
  },
  { id: 'foxyproxy', labelKey: 'exportFormatFoxyProxy', descKey: 'exportFormatFoxyProxyDesc' },
]

function handleExport() {
  try {
    const artifact = ExportService.build(format, settings)
    ExportService.download(artifact)
    toastStore.show(I18nService.getMessage('exportSuccess'), 'success')
    onClose()
  } catch {
    toastStore.show(I18nService.getMessage('exportFailed'), 'error')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') onClose()
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) onClose()
}
</script>

<div
  class={cn(modalVariants.overlay(), flexPatterns.center)}
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="export-dialog-title"
  tabindex="-1"
>
  <div class={cn(modalVariants.content({ size: 'md' }), 'mx-4 animate-scale-in')}>
    <!-- Header -->
    <div class={cn(modalVariants.header(), 'items-start justify-between')}>
      <div class={cn(flexPatterns.start, 'gap-3')}>
        <div
          class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40"
        >
          <Download size={20} class="text-emerald-600 dark:text-emerald-300" />
        </div>
        <div>
          <h3 id="export-dialog-title" class={cn('text-lg font-semibold', colors.text.default)}>
            {I18nService.getMessage('exportTitle')}
          </h3>
          <Text as="p" size="sm" color="muted">{I18nService.getMessage('exportSubtitle')}</Text>
        </div>
      </div>
      <Button
        onclick={onClose}
        color="ghost"
        variant="minimal"
        aria-label={I18nService.getMessage('close')}
        classes={cn(colors.icon.muted, 'p-2 min-w-[40px] min-h-[40px]')}
        data-testid="export-close-btn"
      >
        {#snippet icon()}
          <X size={20} />
        {/snippet}
      </Button>
    </div>

    <!-- Body -->
    <div class={modalVariants.body()}>
      <fieldset class="space-y-2">
        <legend class="text-sm font-medium mb-2">
          {I18nService.getMessage('exportFormatLabel')}
        </legend>
        {#each FORMATS as option (option.id)}
          <label
            class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <input
              type="radio"
              value={option.id}
              bind:group={format}
              class="mt-1"
              data-testid="export-format-{option.id}"
            >
            <div>
              <Text size="sm" weight="medium" classes="block">
                {I18nService.getMessage(option.labelKey)}
              </Text>
              <Text as="p" size="xs" color="muted">{I18nService.getMessage(option.descKey)}</Text>
            </div>
          </label>
        {/each}
      </fieldset>
    </div>

    <!-- Footer -->
    <div class={modalVariants.footer()}>
      <Button color="secondary" onclick={onClose}>{I18nService.getMessage('cancel')}</Button>
      <Button color="primary" onclick={handleExport} data-testid="export-confirm-btn">
        {#snippet icon()}
          <Download size={16} />
        {/snippet}
        {I18nService.getMessage('exportConfirmBtn')}
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
