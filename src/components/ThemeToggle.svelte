<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { type Theme, themeStore } from '@/stores/themeStore'
import { Monitor, Moon, Sun } from '@/utils/icons'
import SegmentedControl from './SegmentedControl.svelte'

let currentTheme = $derived($themeStore)

const themeOptions = [
  { value: 'light' as Theme, icon: Sun, ariaLabel: I18nService.getMessage('themeLight') },
  { value: 'dark' as Theme, icon: Moon, ariaLabel: I18nService.getMessage('themeDark') },
  { value: 'system' as Theme, icon: Monitor, ariaLabel: I18nService.getMessage('themeSystem') },
]

async function handleThemeChange(theme: string) {
  try {
    await themeStore.setTheme(theme as Theme)
  } catch (error) {
    console.error('Failed to change theme:', error)
  }
}
</script>

<SegmentedControl
  options={themeOptions}
  value={currentTheme}
  onchange={handleThemeChange}
  size="sm"
  variant="pills"
  aria-label="Theme selector"
/>
