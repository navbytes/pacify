<script lang="ts">
import SectionHeader from '@/components/ProxyConfigs/SectionHeader.svelte'
import Text from '@/components/Text.svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { keyboardShortcutCardVariants } from '@/utils/classPatterns'
import { Keyboard } from '@/utils/icons'

const styles = keyboardShortcutCardVariants({ color: 'indigo' })

const shortcuts = $derived([
  {
    label: I18nService.getMessage('toggleSearch'),
    keys: I18nService.getMessage('keyboardShortcutCtrlCmdK'),
  },
  {
    label: I18nService.getMessage('keyboardShortcutNewProxy'),
    keys: I18nService.getMessage('keyboardShortcutCtrlCmdN'),
  },
  {
    label: I18nService.getMessage('hideSearch'),
    keys: I18nService.getMessage('keyboardShortcutEscape'),
  },
  {
    label: I18nService.getMessage('keyboardShortcutToggleProxy'),
    keys: I18nService.getMessage('keyboardShortcutNumbers'),
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
    {#each shortcuts as { label, keys }}
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
        </div>
      </div>
    {/each}
  </div>
</div>
