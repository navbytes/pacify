<script lang="ts">
  import { AlertTriangle, X } from 'lucide-svelte'
  import Button from './Button.svelte'
  import Text from './Text.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <div
      class="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in"
    >
      <!-- Header -->
      <div
        class="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700"
      >
        <div class="flex items-start gap-3">
          <div
            class={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : ''}
              ${variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
              ${variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
            `}
          >
            <AlertTriangle
              size={20}
              class={`
                ${variant === 'danger' ? 'text-red-600 dark:text-red-400' : ''}
                ${variant === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                ${variant === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
              `}
            />
          </div>
          <h3 id="dialog-title" class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>
        <button
          onclick={handleCancel}
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label={I18nService.getMessage('closeDialog')}
        >
          <X size={20} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <Text as="p" color="muted">
          {message}
        </Text>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700"
      >
        <Button color="secondary" onclick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button color={variant === 'danger' ? 'error' : 'primary'} onclick={handleConfirm}>
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
