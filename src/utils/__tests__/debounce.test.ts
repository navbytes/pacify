import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { debounce } from '../debounce'

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
