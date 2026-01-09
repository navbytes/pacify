import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { measureComponent, PerformanceMonitor } from '../performance'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMeasures()
    PerformanceMonitor.setEnabled(true)
    mock.restore()
  })

  describe('startMeasure and endMeasure', () => {
    test('should measure performance of an operation', () => {
      PerformanceMonitor.startMeasure('test-operation')

      // Simulate work
      const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0)
      expect(sum).toBeGreaterThan(0)

      const result = PerformanceMonitor.endMeasure('test-operation')

      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    test('should return undefined for non-existent measure', () => {
      const result = PerformanceMonitor.endMeasure('non-existent')

      expect(result).toBeUndefined()
    })

    test('should track metadata', () => {
      PerformanceMonitor.startMeasure('test', { action: 'save', count: 5 })
      PerformanceMonitor.endMeasure('test')

      const measures = PerformanceMonitor.getMeasures()
      expect(measures.length).toBeGreaterThan(0)
      expect(measures[measures.length - 1].data).toEqual({ action: 'save', count: 5 })
    })

    test('should handle multiple concurrent measures', () => {
      PerformanceMonitor.startMeasure('operation1')
      PerformanceMonitor.startMeasure('operation2')

      const duration1 = PerformanceMonitor.endMeasure('operation1')
      const duration2 = PerformanceMonitor.endMeasure('operation2')

      expect(duration1).toBeGreaterThanOrEqual(0)
      expect(duration2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('measureFunction', () => {
    test('should wrap function and measure performance', () => {
      const testFn = mock(() => 'result')
      const wrapped = PerformanceMonitor.measureFunction('test-fn', testFn)

      const result = wrapped()

      expect(result).toBe('result')
      expect(testFn).toHaveBeenCalled()

      const measures = PerformanceMonitor.getMeasures()
      expect(measures.some((m) => m.name === 'test-fn')).toBe(true)
    })

    test('should handle async functions', async () => {
      const asyncFn = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async-result'
      })

      const wrapped = PerformanceMonitor.measureFunction('async-fn', asyncFn)
      const result = await wrapped()

      expect(result).toBe('async-result')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'async-fn')
      expect(measure).toBeDefined()
      expect(measure?.endTime).toBeGreaterThan(0)
    })

    test('should handle async function errors and still measure', async () => {
      const errorFn = mock(async () => {
        throw new Error('Test error')
      })

      const wrapped = PerformanceMonitor.measureFunction('error-fn', errorFn)

      await expect(wrapped()).rejects.toThrow('Test error')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'error-fn')
      expect(measure).toBeDefined()
      expect(measure?.data?.error).toBeDefined()
    })

    test('should pass arguments to wrapped function', () => {
      const testFn = mock((a: number, b: number) => a + b)
      const wrapped = PerformanceMonitor.measureFunction('add', testFn)

      const result = wrapped(5, 3)

      expect(result).toBe(8)
      expect(testFn).toHaveBeenCalledWith(5, 3)
    })
  })

  describe('getMeasures', () => {
    test('should return all completed measures', () => {
      PerformanceMonitor.startMeasure('measure1')
      PerformanceMonitor.endMeasure('measure1')

      PerformanceMonitor.startMeasure('measure2')
      PerformanceMonitor.endMeasure('measure2')

      const measures = PerformanceMonitor.getMeasures()

      expect(measures.length).toBeGreaterThanOrEqual(2)
      expect(measures.every((m) => m.endTime && m.endTime > 0)).toBe(true)
    })

    test('should not include incomplete measures', () => {
      PerformanceMonitor.startMeasure('incomplete')

      const measures = PerformanceMonitor.getMeasures()

      expect(measures.find((m) => m.name === 'incomplete')).toBeUndefined()
    })

    test('should include start and end times', () => {
      PerformanceMonitor.startMeasure('timed')
      PerformanceMonitor.endMeasure('timed')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'timed')

      expect(measure?.startTime).toBeGreaterThan(0)
      expect(measure?.endTime).toBeGreaterThan(0)
    })
  })

  describe('clearMeasures', () => {
    test('should clear all measures', () => {
      PerformanceMonitor.startMeasure('test')
      PerformanceMonitor.endMeasure('test')

      expect(PerformanceMonitor.getMeasures().length).toBeGreaterThan(0)

      PerformanceMonitor.clearMeasures()

      expect(PerformanceMonitor.getMeasures().length).toBe(0)
    })

    test('should clear active measures', () => {
      PerformanceMonitor.startMeasure('active')
      PerformanceMonitor.clearMeasures()

      const duration = PerformanceMonitor.endMeasure('active')

      expect(duration).toBeUndefined()
    })
  })

  describe('enabled/disabled state', () => {
    test('should be enabled by default', () => {
      expect(PerformanceMonitor.isEnabled()).toBe(true)
    })

    test('should allow disabling monitoring', () => {
      PerformanceMonitor.setEnabled(false)
      expect(PerformanceMonitor.isEnabled()).toBe(false)

      PerformanceMonitor.setEnabled(true) // Reset
    })

    test('should not measure when disabled', () => {
      PerformanceMonitor.setEnabled(false)
      PerformanceMonitor.startMeasure('disabled-test')
      const result = PerformanceMonitor.endMeasure('disabled-test')

      expect(result).toBeUndefined()

      PerformanceMonitor.setEnabled(true) // Reset
    })
  })

  describe('performance API integration', () => {
    test('should handle missing performance.mark gracefully', () => {
      const originalMark = global.performance?.mark
      if (global.performance) {
        delete (global.performance as any).mark
      }

      expect(() => {
        PerformanceMonitor.startMeasure('no-mark-test')
        PerformanceMonitor.endMeasure('no-mark-test')
      }).not.toThrow()

      // Restore
      if (global.performance && originalMark) {
        global.performance.mark = originalMark
      }
    })

    test('should handle performance.measure errors gracefully', () => {
      const originalMeasure = global.performance?.measure
      if (global.performance) {
        global.performance.measure = () => {
          throw new Error('Measure failed')
        }
      }

      expect(() => {
        PerformanceMonitor.startMeasure('error-measure-test')
        PerformanceMonitor.endMeasure('error-measure-test')
      }).not.toThrow()

      // Restore
      if (global.performance && originalMeasure) {
        global.performance.measure = originalMeasure
      }
    })

    test('should log slow operations', () => {
      const originalWarn = console.warn
      const mockWarn = mock()
      console.warn = mockWarn

      // Mock performance.now to return predictable values
      const originalNow = performance.now
      let callCount = 0
      performance.now = () => {
        callCount++
        return callCount === 1 ? 0 : 150 // 150ms duration
      }

      PerformanceMonitor.startMeasure('slow-op')
      PerformanceMonitor.endMeasure('slow-op')

      expect(mockWarn).toHaveBeenCalledWith(
        'Slow operation detected: slow-op took 150.00ms',
        undefined
      )

      // Restore
      console.warn = originalWarn
      performance.now = originalNow
    })
  })

  describe('edge cases', () => {
    test('should handle endMeasure with additional data', () => {
      PerformanceMonitor.startMeasure('with-data', { initial: 'data' })
      PerformanceMonitor.endMeasure('with-data', { final: 'data' })

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'with-data')

      expect(measure?.data).toEqual({ initial: 'data', final: 'data' })
    })

    test('should handle measureFunction with no arguments', () => {
      const testFn = mock(() => 'no-args')
      const wrapped = PerformanceMonitor.measureFunction('no-args-fn', testFn)

      const result = wrapped()
      expect(result).toBe('no-args')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'no-args-fn')
      expect(measure?.data?.args).toBeUndefined()
    })
  })
})

describe('measureComponent', () => {
  test('should wrap component lifecycle hooks', () => {
    const mockComponent = {
      name: 'TestComponent',
      prototype: {
        onMount: mock(),
        onDestroy: mock(),
      },
    }

    const wrappedComponent = measureComponent(mockComponent)

    expect(wrappedComponent).toBe(mockComponent)
    expect(typeof mockComponent.prototype.onMount).toBe('function')
    expect(typeof mockComponent.prototype.onDestroy).toBe('function')
  })

  test('should measure component render performance', () => {
    const originalOnMount = mock()
    const originalOnDestroy = mock()

    const mockComponent = {
      name: 'MeasuredComponent',
      prototype: {
        onMount: originalOnMount,
        onDestroy: originalOnDestroy,
      },
    }

    measureComponent(mockComponent)

    // Simulate component lifecycle
    const componentInstance = {}
    mockComponent.prototype.onMount.call(componentInstance)
    mockComponent.prototype.onDestroy.call(componentInstance)

    expect(originalOnMount).toHaveBeenCalled()
    expect(originalOnDestroy).toHaveBeenCalled()

    const measures = PerformanceMonitor.getMeasures()
    const renderMeasure = measures.find((m) => m.name === 'render:MeasuredComponent')
    expect(renderMeasure).toBeDefined()
  })

  test('should use custom name when provided', () => {
    const mockComponent = {
      prototype: {
        onMount: mock(),
        onDestroy: mock(),
      },
    }

    measureComponent(mockComponent, 'CustomName')

    const componentInstance = {}
    mockComponent.prototype.onMount.call(componentInstance)
    mockComponent.prototype.onDestroy.call(componentInstance)

    const measures = PerformanceMonitor.getMeasures()
    const renderMeasure = measures.find((m) => m.name === 'render:CustomName')
    expect(renderMeasure).toBeDefined()
  })

  test('should handle component without lifecycle hooks', () => {
    const mockComponent = {
      name: 'NoLifecycle',
      prototype: {} as { onMount?: () => void; onDestroy?: () => void },
    }

    expect(() => measureComponent(mockComponent)).not.toThrow()

    const componentInstance = {}

    // Should be able to call the wrapped methods
    // After measureComponent, the prototype will have these methods
    const prototype = mockComponent.prototype as { onMount?: () => void; onDestroy?: () => void }
    expect(() => {
      prototype.onMount?.call(componentInstance)
      prototype.onDestroy?.call(componentInstance)
    }).not.toThrow()
  })

  test('should handle unnamed component', () => {
    const mockComponent = {
      prototype: {
        onMount: mock(),
        onDestroy: mock(),
      },
    }

    measureComponent(mockComponent)

    const componentInstance = {}
    mockComponent.prototype.onMount.call(componentInstance)
    mockComponent.prototype.onDestroy.call(componentInstance)

    const measures = PerformanceMonitor.getMeasures()
    const renderMeasure = measures.find((m) => m.name === 'render:UnnamedComponent')
    expect(renderMeasure).toBeDefined()
  })

  test('should pass arguments to original lifecycle hooks', () => {
    const originalOnMount = mock()
    const originalOnDestroy = mock()

    const mockComponent = {
      name: 'ArgsComponent',
      prototype: {
        onMount: originalOnMount,
        onDestroy: originalOnDestroy,
      },
    }

    measureComponent(mockComponent)

    const componentInstance = {}
    const mountArgs = ['arg1', 'arg2']
    const destroyArgs = ['destroyArg']

    mockComponent.prototype.onMount.call(componentInstance, ...mountArgs)
    mockComponent.prototype.onDestroy.call(componentInstance, ...destroyArgs)

    expect(originalOnMount).toHaveBeenCalledWith(...mountArgs)
    expect(originalOnDestroy).toHaveBeenCalledWith(...destroyArgs)
  })
})
