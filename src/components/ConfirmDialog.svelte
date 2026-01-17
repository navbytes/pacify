<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { AlertTriangle, X } from '@/utils/icons'
import { colors } from '@/utils/theme'
import Button from './Button.svelte'
import Text from './Text.svelte'

interface Props {
  open?: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

let {
  open = $bindable(false),
  title,
  message,
  confirmLabel = I18nService.getMessage('confirm'),
  cancelLabel = I18nService.getMessage('cancel'),
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props = $props()

function handleConfirm() {
  onConfirm()
  open = false
}

function handleCancel() {
  onCancel()
  open = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  }
}
</script>

{#if open}
  <div
    class={cn(modalVariants.overlay(), flexPatterns.center)}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <div class={cn(modalVariants.content({ size: 'md' }), 'mx-4 animate-scale-in')}>
      <!-- Header -->
      <div class={cn(modalVariants.header(), 'items-start justify-between')}>
        <div class={cn(flexPatterns.start, 'gap-3')}>
          <div
            class={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              variant === 'danger' && colors.danger.light,
              variant === 'warning' && colors.warning.light,
              variant === 'info' && colors.info.light
            )}
          >
            <AlertTriangle
              size={20}
              class={cn(
                variant === 'danger' && colors.danger.text,
                variant === 'warning' && colors.warning.text,
                variant === 'info' && colors.info.text
              )}
            />
          </div>
          <h3 id="dialog-title" class={cn('text-lg font-semibold', colors.text.default)}>
            {title}
          </h3>
        </div>
        <Button
          onclick={handleCancel}
          color="ghost"
          variant="minimal"
          aria-label={I18nService.getMessage('closeDialog')}
          classes={cn(
            colors.icon.muted,
            'p-2 min-w-[40px] min-h-[40px] hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          {#snippet icon()}
            <X size={20} />
          {/snippet}
        </Button>
      </div>

      <!-- Body -->
      <div class={modalVariants.body()}>
        <Text as="p" color="muted" classes="whitespace-pre-line">{message}</Text>
      </div>

      <!-- Footer -->
      <div class={modalVariants.footer()}>
        <Button color="secondary" onclick={handleCancel}>{cancelLabel}</Button>
        <Button
          color={variant === 'danger' ? 'error' : 'primary'}
          onclick={handleConfirm}
          data-testid="confirm-dialog-confirm-button"
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}

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
