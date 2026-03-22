<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { flexPatterns, modalVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Keyboard, X } from '@/utils/icons'
import { colors } from '@/utils/theme'
import Button from './Button.svelte'
import Text from './Text.svelte'

interface Props {
  open?: boolean
  onClose: () => void
}

let { open = $bindable(false), onClose }: Props = $props()

interface ShortcutGroup {
  titleKey: string
  titleFallback: string
  shortcuts: Array<{
    keys: string[]
    descriptionKey: string
    descriptionFallback: string
  }>
}

const shortcutGroups: ShortcutGroup[] = [
  {
    titleKey: 'shortcutsGroupGeneral',
    titleFallback: 'General',
    shortcuts: [
      {
        keys: ['Ctrl', 'N'],
        descriptionKey: 'shortcutNewProxy',
        descriptionFallback: 'Create new proxy configuration',
      },
      {
        keys: ['Ctrl', 'K'],
        descriptionKey: 'shortcutSearch',
        descriptionFallback: 'Open search',
      },
      {
        keys: ['Esc'],
        descriptionKey: 'shortcutCloseModal',
        descriptionFallback: 'Close current modal',
      },
      {
        keys: ['?'],
        descriptionKey: 'shortcutShowHelp',
        descriptionFallback: 'Show keyboard shortcuts',
      },
    ],
  },
  {
    titleKey: 'shortcutsGroupNavigation',
    titleFallback: 'Navigation',
    shortcuts: [
      {
        keys: ['Tab'],
        descriptionKey: 'shortcutNextElement',
        descriptionFallback: 'Move to next element',
      },
      {
        keys: ['Shift', 'Tab'],
        descriptionKey: 'shortcutPrevElement',
        descriptionFallback: 'Move to previous element',
      },
      {
        keys: ['Enter'],
        descriptionKey: 'shortcutActivate',
        descriptionFallback: 'Activate focused element',
      },
      {
        keys: ['Space'],
        descriptionKey: 'shortcutToggle',
        descriptionFallback: 'Toggle switches and checkboxes',
      },
    ],
  },
  {
    titleKey: 'shortcutsGroupProxyList',
    titleFallback: 'Proxy List',
    shortcuts: [
      {
        keys: ['\u2191', '\u2193'],
        descriptionKey: 'shortcutNavigateList',
        descriptionFallback: 'Navigate through proxy list',
      },
      {
        keys: ['Enter'],
        descriptionKey: 'shortcutActivateProxy',
        descriptionFallback: 'Activate selected proxy',
      },
      {
        keys: ['E'],
        descriptionKey: 'shortcutEditProxy',
        descriptionFallback: 'Edit selected proxy',
      },
      {
        keys: ['Delete'],
        descriptionKey: 'shortcutDeleteProxy',
        descriptionFallback: 'Delete selected proxy',
      },
    ],
  },
]

function getMessage(key: string, fallback: string): string {
  return I18nService.getMessage(key) || fallback
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    onClose()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    onClose()
  }
}

// Use Cmd on Mac, Ctrl on other platforms
const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
function formatKey(key: string): string {
  if (key === 'Ctrl') return isMac ? '\u2318' : 'Ctrl'
  if (key === 'Alt') return isMac ? '\u2325' : 'Alt'
  if (key === 'Shift') return '\u21E7'
  return key
}
</script>

{#if open}
  <div
    class={cn(modalVariants.overlay(), flexPatterns.center)}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
    tabindex="-1"
  >
    <div class={cn(modalVariants.content({ size: 'lg' }), 'mx-4 animate-scale-in')}>
      <!-- Header -->
      <div class={cn(modalVariants.header(), 'items-start justify-between')}>
        <div class={cn(flexPatterns.start, 'gap-3')}>
          <div
            class={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              'bg-blue-100 dark:bg-blue-900/30'
            )}
          >
            <Keyboard size={20} class="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 id="shortcuts-title" class={cn('text-lg font-semibold', colors.text.default)}>
              {getMessage('keyboardShortcuts', 'Keyboard Shortcuts')}
            </h2>
            <Text as="p" color="muted" size="sm">
              {getMessage('keyboardShortcutsDescription', 'Use these shortcuts to work faster')}
            </Text>
          </div>
        </div>
        <Button
          onclick={onClose}
          color="ghost"
          variant="minimal"
          aria-label={getMessage('close', 'Close')}
          classes="p-2 min-w-[40px] min-h-[40px]"
        >
          {#snippet icon()}
            <X size={20} />
          {/snippet}
        </Button>
      </div>

      <!-- Body -->
      <div class={cn(modalVariants.body(), 'max-h-[60vh] overflow-y-auto')}>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {#each shortcutGroups as group}
            <div>
              <Text
                as="h3"
                weight="semibold"
                size="sm"
                classes="mb-3 uppercase tracking-wider text-slate-500 dark:text-slate-300"
              >
                {getMessage(group.titleKey, group.titleFallback)}
              </Text>
              <div class="space-y-2">
                {#each group.shortcuts as shortcut}
                  <div class={cn(flexPatterns.between, 'gap-4 py-2')}>
                    <Text as="span" color="muted" size="sm">
                      {getMessage(shortcut.descriptionKey, shortcut.descriptionFallback)}
                    </Text>
                    <div class={cn(flexPatterns.centerVertical, 'gap-1 shrink-0')}>
                      {#each shortcut.keys as key, i}
                        {#if i > 0}
                          <span class="text-slate-400 text-xs">+</span>
                        {/if}
                        <kbd
                          class={cn(
                            'px-2 py-1 text-xs font-mono font-semibold rounded',
                            'bg-slate-100 dark:bg-slate-700',
                            'border border-slate-300 dark:border-slate-600',
                            'text-slate-700 dark:text-slate-300',
                            'shadow-sm'
                          )}
                        >
                          {formatKey(key)}
                        </kbd>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class={cn(modalVariants.footer(), 'justify-center')}>
        <Text as="p" color="muted" size="sm">
          {getMessage('shortcutsTip', 'Press ? anywhere to show this help')}
        </Text>
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
