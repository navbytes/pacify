<script lang="ts">
import { onMount } from 'svelte'
import { fade } from 'svelte/transition'
import { I18nService } from '@/services/i18n/i18nService'
import {
  flexPatterns,
  modalBackdropVariants,
  modalGlassmorphismVariants,
} from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import { Keyboard, X } from '@/utils/icons'
import AnimatedIconBadge from './AnimatedIconBadge.svelte'
import Button from './Button.svelte'
import ModalDecorations from './ModalDecorations.svelte'
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
    titleKey: 'shortcutsGroupBrowser',
    titleFallback: 'Browser-Wide',
    shortcuts: [
      {
        keys: ['Alt', 'Shift', 'P'],
        descriptionKey: 'shortcutQuickSwitch',
        descriptionFallback: 'Quick switch to next proxy',
      },
      {
        keys: ['Alt', 'Shift', 'O'],
        descriptionKey: 'shortcutDisableProxy',
        descriptionFallback: 'Disable proxy (direct connection)',
      },
      {
        keys: ['px'],
        descriptionKey: 'shortcutOmnibox',
        descriptionFallback: 'Type "px" in address bar to search proxies',
      },
    ],
  },
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

// Animation state
let isVisible = $state(false)
let modalRef = $state<HTMLDivElement>()
let previouslyFocusedElement: HTMLElement | null = null

onMount(() => {
  // Store the previously focused element
  previouslyFocusedElement = document.activeElement as HTMLElement

  // Lock body scroll
  document.body.classList.add('modal-open')

  // Trigger entrance animation
  requestAnimationFrame(() => {
    isVisible = true
  })

  return () => {
    // Unlock body scroll
    document.body.classList.remove('modal-open')
    // Return focus when modal closes
    previouslyFocusedElement?.focus()
  }
})

function handleClose() {
  isVisible = false
  setTimeout(onClose, 200)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose()
  }

  // Trap focus within modal
  if (event.key === 'Tab' && modalRef) {
    const focusableElements = modalRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
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

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop with blur and gradient -->
    <div
      class="absolute inset-0 transition-all duration-300"
      class:opacity-100={isVisible}
      class:opacity-0={!isVisible}
      onclick={handleClose}
      onkeydown={(e) => e.key === 'Escape' && handleClose()}
      role="button"
      tabindex="-1"
      aria-label="Close modal"
    >
      <div class={modalBackdropVariants()}></div>
    </div>

    <!-- Modal Content -->
    <div
      bind:this={modalRef}
      class="relative w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-300"
      class:scale-100={isVisible}
      class:opacity-100={isVisible}
      class:scale-95={!isVisible}
      class:opacity-0={!isVisible}
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      <!-- Glassmorphism container -->
      <div class={modalGlassmorphismVariants()}>
        <!-- Modal decorations -->
        <ModalDecorations
          accentGradient="tealBlue"
          decorations={[
          { position: 'topRight', color: 'tealCyan' },
          { position: 'bottomLeft', color: 'bluePurple' },
        ]}
        />

        <!-- Header -->
        <div class="relative px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <AnimatedIconBadge icon={Keyboard} />
              <div>
                <h2
                  id="shortcuts-title"
                  class="text-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  {getMessage('keyboardShortcuts', 'Keyboard Shortcuts')}
                </h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {getMessage('keyboardShortcutsDescription', 'Use these shortcuts to work faster')}
                </p>
              </div>
            </div>

            <Button
              onclick={handleClose}
              color="ghost"
              variant="minimal"
              aria-label={getMessage('close', 'Close')}
              classes="p-2 min-w-11 min-h-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {#snippet icon()}
                <X size={20} />
              {/snippet}
            </Button>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div class="grid gap-6 md:grid-cols-2">
            {#each shortcutGroups as group}
              <div>
                <Text
                  as="h3"
                  weight="semibold"
                  size="sm"
                  classes="mb-3 uppercase tracking-wider text-slate-500 dark:text-slate-400"
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
        <div
          class="relative px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
        >
          <div class="flex flex-col items-center gap-1">
            <Text as="p" color="muted" size="sm">
              {getMessage('shortcutsTip', 'Press ? anywhere to show this help')}
            </Text>
            <Text as="p" color="muted" size="xs">
              {getMessage('customizeShortcutsHint', 'Browser-wide shortcuts can be customized at chrome://extensions/shortcuts')}
            </Text>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
