import type { Action } from 'svelte/action'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Svelte action that makes a modal accessible:
 * - remembers the element focused before the modal opened,
 * - moves focus into the modal on mount,
 * - traps Tab / Shift+Tab within the modal,
 * - restores focus to the originally-focused element on destroy.
 *
 * Usage: `<div use:modalFocus> … </div>` on the modal's content container.
 */
export const modalFocus: Action<HTMLElement> = (node) => {
  const previouslyFocused = document.activeElement as HTMLElement | null

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    )
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const focusable = getFocusable()
    if (focusable.length === 0) {
      event.preventDefault()
      node.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (event.shiftKey && (active === first || !node.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // Move focus into the modal once it has rendered.
  requestAnimationFrame(() => {
    const focusable = getFocusable()
    ;(focusable[0] ?? node).focus()
  })

  node.addEventListener('keydown', handleKeydown)

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown)
      // Restore focus to the trigger if it's still in the document.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    },
  }
}
