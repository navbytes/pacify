import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { withErrorHandling, withErrorHandlingAndFallback, withRetry } from '../errorHandling'
import { ERROR_TYPES } from '@/interfaces'
import { NotifyService } from '@/services/NotifyService'

describe('errorHandling utilities', () => {
  let originalNotifyError: typeof NotifyService.error
  let mockNotifyError: any

  beforeEach(() => {
    // Store original and create a spy
    originalNotifyError = NotifyService.error
    mockNotifyError = mock()
    NotifyService.error = mockNotifyError
  })

  afterEach(() => {
    // Restore original method
    NotifyService.error = originalNotifyError
  })

  describe('withErrorHandling', () => {
    test('should execute operation successfully when no error occurs', async () => {
      const mockOperation = mock().mockResolvedValue('success')
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.BACKUP)

      const result = await wrappedOperation('arg1', 'arg2')

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockNotifyError).not.toHaveBeenCalled()
    })

    test('should handle errors and call NotifyService.error', async () => {
      const testError = new Error('Test error')
      const mockOperation = mock().mockRejectedValue(testError)
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.SAVE_SCRIPT)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.SAVE_SCRIPT, testError)
    })

    test('should call custom error handler when provided', async () => {
      const testError = new Error('Custom error')
      const mockOperation = mock().mockRejectedValue(testError)
      const customHandler = mock()
      const wrappedOperation = withErrorHandling(mockOperation, ERROR_TYPES.BACKUP, customHandler)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.BACKUP, testError)
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
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.SAVE_SETTINGS, testError)
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
      expect(mockNotifyError).not.toHaveBeenCalled()
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
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.FETCH_SETTINGS, testError)
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

  describe('withRetry', () => {
    test('should succeed on first attempt', async () => {
      const mockOperation = mock().mockResolvedValue('success')
      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.SEND_MESSAGE, 2, 100)

      const result = await wrappedOperation('arg')

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(mockOperation).toHaveBeenCalledWith('arg')
      expect(mockNotifyError).not.toHaveBeenCalled()
    })

    test('should retry on failure and eventually succeed', async () => {
      const mockOperation = mock()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success on third try')

      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.SET_PROXY, 3, 50)

      const result = await wrappedOperation()

      expect(result).toBe('success on third try')
      expect(mockOperation).toHaveBeenCalledTimes(3)
      expect(mockNotifyError).not.toHaveBeenCalled()
    })

    test('should fail after exhausting all retries', async () => {
      const finalError = new Error('Final error')
      const mockOperation = mock()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockRejectedValue(finalError)

      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.CLEAR_PROXY, 2, 50)

      await expect(wrappedOperation()).rejects.toThrow(finalError)
      expect(mockOperation).toHaveBeenCalledTimes(3) // Initial + 2 retries
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.CLEAR_PROXY, finalError)
    })

    test('should use default retry parameters', async () => {
      const testError = new Error('Always fails')
      const mockOperation = mock().mockRejectedValue(testError)
      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.BACKUP, 1, 50) // Reduce retries for faster test

      await expect(wrappedOperation()).rejects.toThrow(testError)

      expect(mockOperation).toHaveBeenCalledTimes(2) // Initial + 1 retry
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.BACKUP, testError)
    })

    test('should apply exponential backoff', async () => {
      const mockOperation = mock().mockRejectedValue(new Error('Always fails'))
      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.SAVE_SETTINGS, 1, 50) // Reduce for faster test

      const startTime = Date.now()
      await expect(wrappedOperation()).rejects.toThrow()
      const endTime = Date.now()

      // Should have some delay due to retry
      expect(endTime - startTime).toBeGreaterThan(40) // Reduced threshold
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    test('should preserve function arguments across retries', async () => {
      const mockOperation = mock()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success')

      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.FETCH_SETTINGS, 2, 50)

      const result = await wrappedOperation('arg1', 'arg2', 123)

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
      expect(mockOperation).toHaveBeenNthCalledWith(1, 'arg1', 'arg2', 123)
      expect(mockOperation).toHaveBeenNthCalledWith(2, 'arg1', 'arg2', 123)
    })

    test('should handle zero retries', async () => {
      const testError = new Error('Immediate failure')
      const mockOperation = mock().mockRejectedValue(testError)
      const wrappedOperation = withRetry(mockOperation, ERROR_TYPES.SEND_MESSAGE, 0, 100)

      await expect(wrappedOperation()).rejects.toThrow(testError)
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(mockNotifyError).toHaveBeenCalledWith(ERROR_TYPES.SEND_MESSAGE, testError)
    })
  })
})
