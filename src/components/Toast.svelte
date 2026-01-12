<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { type ToastType, toastStore } from '@/stores/toastStore'
import { toastVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { AlertCircle, CheckCircle, Info, X, XCircle } from '@/utils/icons'
import Button from './Button.svelte'
import Text from './Text.svelte'

let toasts = $derived($toastStore)

function getIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertCircle
    case 'info':
      return Info
  }
}
</script>

<div
  class="fixed top-4 right-4 z-50 max-w-md flex flex-col gap-2"
  role="region"
  aria-label="Notifications"
  aria-live="polite"
  aria-atomic="false"
>
  {#each toasts as toast (toast.id)}
    {@const Icon = getIcon(toast.type)}
    <div
      class={cn(toastVariants({ intent: toast.type }), 'animate-slide-in')}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon size={20} class="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <Text as="p" size="sm" weight="medium" classes="flex-1">{toast.message}</Text>
      <Button
        onclick={() => toastStore.dismiss(toast.id)}
        color="ghost"
        variant="minimal"
        aria-label={I18nService.getMessage('closeNotification') || 'Close notification'}
        classes="flex-shrink-0 opacity-70 hover:opacity-100 min-h-[44px] min-w-[44px] hover:bg-white/20"
      >
        {#snippet icon()}
          <X size={16} aria-hidden="true" />
        {/snippet}
      </Button>
    </div>
  {/each}
</div>

<style>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
