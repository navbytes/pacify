import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { debounce, throttle } from '../debounce'

describe('debounce', () => {
  beforeEach(() => {
    // Bun doesn't have fake timers yet, so we'll test differently
  })

  afterEach(() => {
    // Cleanup
  })

  test('should delay function execution', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100)

    debouncedFunc()
    expect(func).not.toHaveBeenCalled()

    // Wait for debounce period
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should call function only once for multiple rapid calls', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100)

    debouncedFunc()
    debouncedFunc()
    debouncedFunc()

    // Wait for debounce period
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should call function immediately when immediate is true', () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100, true)

    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should pass arguments correctly', async () => {
    const func = mock((_arg1: string, _arg2: string) => {})
    const debouncedFunc = debounce(func, 100)

    debouncedFunc('arg1', 'arg2')

    // Wait for debounce period
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).toHaveBeenCalledWith('arg1', 'arg2')
  })

  test('should use default wait time when not specified', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func) // Default 300ms

    debouncedFunc()

    // Should not be called before default wait time
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(func).not.toHaveBeenCalled()

    // Should be called after default wait time
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should use default immediate false when not specified', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100) // Default immediate = false

    debouncedFunc()
    expect(func).not.toHaveBeenCalled() // Should not be called immediately

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should cancel pending execution', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100)

    debouncedFunc()
    debouncedFunc.cancel()

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).not.toHaveBeenCalled()
  })

  test('should handle cancel when no timeout is pending', () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100)

    // Cancel without calling the function first
    expect(() => debouncedFunc.cancel()).not.toThrow()
  })

  test('should preserve this context', async () => {
    let capturedThis: any
    function testFunc(this: any) {
      capturedThis = this
    }

    const context = { name: 'test context' }
    const debouncedFunc = debounce(testFunc, 50)

    debouncedFunc.call(context)

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(capturedThis).toBe(context)
  })

  test('should not call function twice in immediate mode with rapid calls', async () => {
    const func = mock(() => {})
    const debouncedFunc = debounce(func, 100, true)

    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Rapid calls should not trigger additional calls
    debouncedFunc()
    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // After wait period, should be able to call again
    await new Promise((resolve) => setTimeout(resolve, 150))
    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(2)
  })
})

describe('throttle', () => {
  test('should create a throttled function', () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    expect(typeof throttledFunc).toBe('function')
  })

  test('should use default wait time when not specified', () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func) // Default 300ms

    expect(typeof throttledFunc).toBe('function')
  })

  test('should call function immediately on first invocation', () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)
  })

  test('should throttle subsequent calls', async () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    // First call should execute immediately
    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Rapid subsequent calls should be throttled
    throttledFunc()
    throttledFunc()
    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Should call again after throttle period
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(func).toHaveBeenCalledTimes(2)
  })

  test('should pass arguments correctly', async () => {
    const func = mock((_arg1: string, _arg2: string) => {})
    const throttledFunc = throttle(func, 50)

    throttledFunc('arg1', 'arg2')
    expect(func).toHaveBeenCalledWith('arg1', 'arg2')

    // Subsequent call with different args
    throttledFunc('arg3', 'arg4')

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(func).toHaveBeenCalledWith('arg3', 'arg4')
  })

  test('should preserve this context', () => {
    let capturedThis: any
    function testFunc(this: any) {
      capturedThis = this
    }

    const context = { name: 'test context' }
    const throttledFunc = throttle(testFunc, 50)

    throttledFunc.call(context)
    expect(capturedThis).toBe(context)
  })

  test('should handle edge case when remaining time is greater than wait', async () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    // Mock Date.now to test edge case
    const originalDateNow = Date.now
    let mockTime = 1000
    Date.now = () => mockTime

    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Simulate time going backwards (edge case)
    mockTime = 500
    throttledFunc()

    // Should still work correctly
    expect(func).toHaveBeenCalledTimes(2)

    // Restore Date.now
    Date.now = originalDateNow
  })

  test('should clear timeout when condition is met', async () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Wait longer than the throttle period
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Next call should execute immediately
    throttledFunc()
    expect(func).toHaveBeenCalledTimes(2)
  })

  // This test covers the setTimeout branch in throttle
  test('should set timeout for delayed execution', async () => {
    const func = mock(() => {})
    const throttledFunc = throttle(func, 100)

    // First call executes immediately
    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Rapid call within throttle period
    await new Promise((resolve) => setTimeout(resolve, 50))
    throttledFunc()
    expect(func).toHaveBeenCalledTimes(1)

    // Should execute the delayed call
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(func).toHaveBeenCalledTimes(2)
  })
})
