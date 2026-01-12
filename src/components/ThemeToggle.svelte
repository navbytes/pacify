<script lang="ts">
import { type Theme, themeStore } from '@/stores/themeStore'
import { Monitor, Moon, Sun } from '@/utils/icons'
import SegmentedControl from './SegmentedControl.svelte'

let currentTheme = $derived($themeStore)

const themeOptions = [
  { value: 'light' as Theme, icon: Sun },
  { value: 'dark' as Theme, icon: Moon },
  { value: 'system' as Theme, icon: Monitor },
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
  aria-label="Theme selector"
/>
