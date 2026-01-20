<script lang="ts">
import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
import Text from '@/components/Text.svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { keyboardShortcutCardVariants } from '@/utils/classPatterns'
import { Keyboard } from '@/utils/icons'

const styles = keyboardShortcutCardVariants({ color: 'slate' })

const shortcuts = $derived([
  {
    label: I18nService.getMessage('toggleSearch'),
    keys: I18nService.getMessage('keyboardShortcutCtrlCmdK'),
    note: null,
  },
  {
    label: I18nService.getMessage('keyboardShortcutNewProxy'),
    keys: I18nService.getMessage('keyboardShortcutCtrlCmdN'),
    note: null,
  },
  {
    label: I18nService.getMessage('hideSearch'),
    keys: I18nService.getMessage('keyboardShortcutEscape'),
    note: null,
  },
  {
    label: I18nService.getMessage('keyboardShortcutToggleProxy'),
    keys: I18nService.getMessage('keyboardShortcutNumbers'),
    note: I18nService.getMessage('keyboardShortcutQuickSwitchOnly'),
  },
])
</script>

<div>
  <SectionHeader
    icon={Keyboard}
    title={I18nService.getMessage('keyboardShortcuts')}
    iconColor="purple"
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each shortcuts as { label, keys, note }}
      <div class={styles.wrapper()}>
        <!-- Background gradient -->
        <div class={styles.background()}></div>

        <!-- Decorative elements -->
        <div class={styles.decorativeBlur()}></div>

        <!-- Top accent -->
        <div class={styles.accentBar()}></div>

        <div class={styles.content()}>
          <kbd class={styles.kbd()}>{keys}</kbd>
          <Text size="sm" color="muted" classes="leading-tight">{label}</Text>
          {#if note}
            <Text size="xs" color="muted" classes="leading-tight mt-1 italic opacity-80">
              {note}
            </Text>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Warning note -->
  <div
    class="mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
  >
    <Text size="sm" color="muted" classes="flex items-start gap-2">
      <span class="text-amber-600 dark:text-amber-400 shrink-0">⚠️</span>
      <span>{I18nService.getMessage('keyboardShortcutsNote')}</span>
    </Text>
  </div>
</div>
