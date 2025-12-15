<script lang="ts">
  import { Sun, Moon, Monitor } from '@/utils/icons'
  import { themeStore, type Theme } from '@/stores/themeStore'
  import { cn } from '@/utils/cn'
  import { buttonVariants } from '@/utils/classPatterns'

  let currentTheme = $derived($themeStore)

  const themes: { value: Theme; icon: any; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  async function handleThemeChange(theme: Theme) {
    console.log('Theme change requested:', theme)
    try {
      await themeStore.setTheme(theme)
      console.log('Theme changed successfully to:', theme)
    } catch (error) {
      console.error('Failed to change theme:', error)
    }
  }
</script>

<div
  class="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
  role="group"
  aria-label="Theme selector"
>
  {#each themes as { value, icon: Icon, label }}
    <button
      type="button"
      onclick={() => handleThemeChange(value)}
      class={cn(
        buttonVariants({
          variant: currentTheme === value ? 'solid' : 'minimal',
          intent: currentTheme === value ? 'primary' : 'secondary',
          size: 'sm',
        }),
        'min-w-[44px] !min-h-[36px]'
      )}
      aria-label={`Switch to ${label.toLowerCase()} theme`}
      aria-pressed={currentTheme === value}
    >
      <Icon size={18} aria-hidden="true" />
      <span class="sr-only">{label}</span>
    </button>
  {/each}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
