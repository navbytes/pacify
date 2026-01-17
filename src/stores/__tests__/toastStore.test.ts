import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { get } from 'svelte/store'
import { toastStore } from '../toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    toastStore.clear()
  })

  afterEach(() => {
    // Clean up after each test
    toastStore.clear()
  })

  describe('show', () => {
    test('adds a toast to the store', () => {
      toastStore.show('Test message', 'info')

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Test message')
      expect(toasts[0].type).toBe('info')
    })

    test('returns the toast id', () => {
      const id = toastStore.show('Test message')

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    test('uses default type of info', () => {
      toastStore.show('Test message')

      const toasts = get(toastStore)
      expect(toasts[0].type).toBe('info')
    })

    test('accepts success type', () => {
      toastStore.show('Success!', 'success')

      const toasts = get(toastStore)
      expect(toasts[0].type).toBe('success')
    })

    test('accepts error type', () => {
      toastStore.show('Error!', 'error')

      const toasts = get(toastStore)
      expect(toasts[0].type).toBe('error')
    })

    test('accepts warning type', () => {
      toastStore.show('Warning!', 'warning')

      const toasts = get(toastStore)
      expect(toasts[0].type).toBe('warning')
    })

    test('uses default duration of 3000ms', () => {
      toastStore.show('Test message')

      const toasts = get(toastStore)
      expect(toasts[0].duration).toBe(3000)
    })

    test('accepts custom duration', () => {
      toastStore.show('Test message', 'info', 5000)

      const toasts = get(toastStore)
      expect(toasts[0].duration).toBe(5000)
    })

    test('can add multiple toasts', () => {
      toastStore.show('Message 1', 'info')
      toastStore.show('Message 2', 'success')
      toastStore.show('Message 3', 'error')

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(3)
    })

    test('automatically removes toast after duration', async () => {
      toastStore.show('Auto-remove', 'info', 50) // 50ms for fast test

      // Toast should be present immediately
      let toasts = get(toastStore)
      expect(toasts).toHaveLength(1)

      // Wait for auto-removal
      await new Promise((resolve) => setTimeout(resolve, 100))

      toasts = get(toastStore)
      expect(toasts).toHaveLength(0)
    })

    test('does not auto-remove when duration is 0', async () => {
      toastStore.show('Persistent', 'info', 0)

      let toasts = get(toastStore)
      expect(toasts).toHaveLength(1)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should still be present
      toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
    })

    test('each toast has unique id', () => {
      const id1 = toastStore.show('Message 1')
      const id2 = toastStore.show('Message 2')
      const id3 = toastStore.show('Message 3')

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })
  })

  describe('dismiss', () => {
    test('removes a specific toast by id', () => {
      const id1 = toastStore.show('Message 1')
      const id2 = toastStore.show('Message 2')
      const id3 = toastStore.show('Message 3')

      let toasts = get(toastStore)
      expect(toasts).toHaveLength(3)

      toastStore.dismiss(id2)

      toasts = get(toastStore)
      expect(toasts).toHaveLength(2)
      expect(toasts.find((t) => t.id === id1)).toBeDefined()
      expect(toasts.find((t) => t.id === id2)).toBeUndefined()
      expect(toasts.find((t) => t.id === id3)).toBeDefined()
    })

    test('does nothing when id does not exist', () => {
      toastStore.show('Message 1')
      toastStore.show('Message 2')

      let toasts = get(toastStore)
      expect(toasts).toHaveLength(2)

      toastStore.dismiss('non-existent-id')

      toasts = get(toastStore)
      expect(toasts).toHaveLength(2)
    })

    test('can dismiss first toast', () => {
      const id1 = toastStore.show('First')
      toastStore.show('Second')

      toastStore.dismiss(id1)

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Second')
    })

    test('can dismiss last toast', () => {
      toastStore.show('First')
      const id2 = toastStore.show('Last')

      toastStore.dismiss(id2)

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('First')
    })

    test('can dismiss only toast', () => {
      const id = toastStore.show('Only one')

      toastStore.dismiss(id)

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(0)
    })
  })

  describe('clear', () => {
    test('removes all toasts', () => {
      toastStore.show('Message 1')
      toastStore.show('Message 2')
      toastStore.show('Message 3')

      let toasts = get(toastStore)
      expect(toasts).toHaveLength(3)

      toastStore.clear()

      toasts = get(toastStore)
      expect(toasts).toHaveLength(0)
    })

    test('does nothing when already empty', () => {
      const toasts = get(toastStore)
      expect(toasts).toHaveLength(0)

      // Should not throw
      expect(() => toastStore.clear()).not.toThrow()

      expect(get(toastStore)).toHaveLength(0)
    })
  })

  describe('subscribe', () => {
    test('provides subscription mechanism', () => {
      let callCount = 0
      let lastValue: unknown[] = []

      const unsubscribe = toastStore.subscribe((value) => {
        callCount++
        lastValue = value
      })

      // Initial call
      expect(callCount).toBe(1)
      expect(lastValue).toHaveLength(0)

      // Add a toast
      toastStore.show('Test')
      expect(callCount).toBe(2)
      expect(lastValue).toHaveLength(1)

      // Clear
      toastStore.clear()
      expect(callCount).toBe(3)
      expect(lastValue).toHaveLength(0)

      unsubscribe()
    })

    test('unsubscribe stops updates', () => {
      let callCount = 0

      const unsubscribe = toastStore.subscribe(() => {
        callCount++
      })

      // Initial call
      expect(callCount).toBe(1)

      unsubscribe()

      // Add toast after unsubscribe
      toastStore.show('Test')

      // Should not have been called again
      expect(callCount).toBe(1)
    })
  })

  describe('edge cases', () => {
    test('handles empty message', () => {
      toastStore.show('')

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('')
    })

    test('handles special characters in message', () => {
      const message = 'Special: <script>alert("xss")</script> 你好 🎉'
      toastStore.show(message)

      const toasts = get(toastStore)
      expect(toasts[0].message).toBe(message)
    })

    test('handles very long message', () => {
      const longMessage = 'x'.repeat(10000)
      toastStore.show(longMessage)

      const toasts = get(toastStore)
      expect(toasts[0].message).toBe(longMessage)
    })

    test('handles negative duration as 0', () => {
      // Implementation might treat negative as "no auto-remove"
      toastStore.show('Test', 'info', -1000)

      const toasts = get(toastStore)
      expect(toasts).toHaveLength(1)
    })
  })
})
