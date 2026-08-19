import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { ERROR_TYPES } from '@/interfaces'
import { NotificationService } from '@/services/NotificationService'
import { withErrorHandling, withErrorHandlingAndFallback } from '../errorHandling'

describe('errorHandling utilities', () => {
  let originalNotificationError: typeof NotificationService.error
  let mockNotificationError: any

  beforeEach(() => {
    // Store original and create a spy
    originalNotificationError = NotificationService.error
    mockNotificationError = mock(() => Promise.resolve())
    NotificationService.error = mockNotificationError
  })

  afterEach(() => {
    // Restore original method
    NotificationService.error = originalNotificationError
  })

  describe('withErrorHandling', () => {
    test('should execute operation successfully when no error occurs', async () => {
      const mockOperation = mock().mockResolvedValue('success')
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.BACKUP)

      const result = await wrappedOperation('arg1', 'arg2')

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockNotificationError).not.toHaveBeenCalled()
    })

    test('should handle errors and call error handler', async () => {
      const testError = new Error('Test error')
      const mockOperation = mock().mockRejectedValue(testError)
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.SAVE_SCRIPT)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockNotificationError).toHaveBeenCalledWith(ERROR_TYPES.SAVE_SCRIPT, testError)
    })

    test('should call custom error handler when provided', async () => {
      const testError = new Error('Custom error')
      const mockOperation = mock().mockRejectedValue(testError)
      const customHandler = mock()
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.BACKUP, customHandler)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockNotificationError).toHaveBeenCalledWith(ERROR_TYPES.BACKUP, testError)
      expect(customHandler).toHaveBeenCalledWith(testError)
    })

    test('should preserve function signature and arguments', async () => {
      const mockOperation = mock(async (a: string, b: number) => `${a}-${b}`)
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.FETCH_SETTINGS)

      const result = await wrappedOperation('test', 123)

      expect(result).toBe('test-123')
      expect(mockOperation).toHaveBeenCalledWith('test', 123)
    })

    test('should handle synchronous errors', async () => {
      const testError = new Error('Sync error')
      const mockOperation = mock(() => {
        throw testError
      })
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.SAVE_SETTINGS)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockNotificationError).toHaveBeenCalledWith(ERROR_TYPES.SAVE_SETTINGS, testError)
    })
  })

  describe('withErrorHandlingAndFallback', () => {
    test('should return operation result when successful', async () => {
      const mockOperation = mock().mockResolvedValue('success')
      const wrappedOperation = withErrorHandlingAndFallback(
        mockOperation,
        ERROR_TYPES.FETCH_SETTINGS,
        'fallback'
      )

      const result = await wrappedOperation('arg1')

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledWith('arg1')
      expect(mockNotificationError).not.toHaveBeenCalled()
    })

    test('should return fallback value when operation fails', async () => {
      const testError = new Error('Operation failed')
      const mockOperation = mock().mockRejectedValue(testError)
      const fallbackValue = { default: 'settings' }
      const wrappedOperation = withErrorHandlingAndFallback(
        mockOperation,
        ERROR_TYPES.FETCH_SETTINGS,
        fallbackValue
      )

      const result = await wrappedOperation()

      expect(result).toBe(fallbackValue)
      expect(mockNotificationError).toHaveBeenCalledWith(ERROR_TYPES.FETCH_SETTINGS, testError)
    })

    test('should handle complex return types', async () => {
      interface ComplexType {
        data: string[]
        count: number
      }

      const successResult: ComplexType = { data: ['a', 'b'], count: 2 }
      const fallbackResult: ComplexType = { data: [], count: 0 }

      const mockOperation = mock().mockResolvedValue(successResult)
      const wrappedOperation = withErrorHandlingAndFallback(
        mockOperation,
        ERROR_TYPES.BACKUP,
        fallbackResult
      )

      const result = await wrappedOperation()

      expect(result).toBe(successResult)
      expect(result.data).toEqual(['a', 'b'])
      expect(result.count).toBe(2)
    })

    test('should preserve argument types', async () => {
      const mockOperation = mock(async (str: string, num: number) => str.repeat(num))
      const wrappedOperation = withErrorHandlingAndFallback(
        mockOperation,
        ERROR_TYPES.SAVE_SCRIPT,
        'default'
      )

      const result = await wrappedOperation('hello', 3)

      expect(result).toBe('hellohellohello')
      expect(mockOperation).toHaveBeenCalledWith('hello', 3)
    })
  })
})
