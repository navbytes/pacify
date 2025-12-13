<script lang="ts">
  import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-svelte'
  import { toastStore, type ToastType } from '@/stores/toastStore'
  import Text from './Text.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

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

  function getColors(type: ToastType) {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200'
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
      class="flex items-start gap-2 p-4 rounded-lg border-l-4 shadow-lg animate-slide-in backdrop-blur-sm {getColors(
        toast.type
      )}"
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon size={20} class="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <Text as="p" size="sm" weight="medium" classes="flex-1">{toast.message}</Text>
      <button
        onclick={() => toastStore.dismiss(toast.id)}
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50"
        aria-label={I18nService.getMessage('closeNotification') || 'Close notification'}
      >
        <X size={16} aria-hidden="true" />
      </button>
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
