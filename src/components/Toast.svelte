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

<FlexGroup direction="vertical" childrenGap="xs" classes="fixed top-4 right-4 z-50 max-w-md">
  {#each toasts as toast (toast.id)}
    {@const Icon = getIcon(toast.type)}
    <FlexGroup
      alignItems="start"
      childrenGap="sm"
      classes="p-4 rounded-lg border-l-4 shadow-lg animate-slide-in backdrop-blur-sm {getColors(
        toast.type
      )}"
    >
      <Icon size={20} class="flex-shrink-0 mt-0.5" />
      <Text as="p" size="sm" weight="medium" classes="flex-1">{toast.message}</Text>
      <button
        onclick={() => toastStore.dismiss(toast.id)}
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label={I18nService.getMessage('closeNotification')}
      >
        <X size={16} />
      </button>
    </FlexGroup>
  {/each}
</FlexGroup>

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
