import { describe, test, expect, mock } from 'bun:test'
import { NotifyService } from '../NotifyService'
import { ERROR_TYPES, ALERT_TYPES } from '@/interfaces'

describe('NotifyService', () => {
  describe('error method', () => {
    test('should have error method', () => {
      expect(typeof NotifyService.error).toBe('function')
    })

    test('should call console.error', () => {
      const originalError = console.error
      const mockError = mock()
      console.error = mockError

      // Mock chrome to avoid chrome.runtime.getURL error
      const originalChrome = (globalThis as any).chrome
      ;(globalThis as any).chrome = undefined

      const error = new Error('Test error')
      NotifyService.error(ERROR_TYPES.BACKUP, error, 'context')

      expect(mockError).toHaveBeenCalledWith('context', 'Backup failed', error)

      // Restore
      console.error = originalError
      ;(globalThis as any).chrome = originalChrome
    })
  })

  describe('alert method', () => {
    test('should have alert method', () => {
      expect(typeof NotifyService.alert).toBe('function')
    })

    test('should not throw when called', () => {
      expect(() => {
        NotifyService.alert(ALERT_TYPES.BACKUP_FAILURE)
      }).not.toThrow()
    })

    test('should handle string messages', () => {
      expect(() => {
        NotifyService.alert('Custom message')
      }).not.toThrow()
    })
  })
})
