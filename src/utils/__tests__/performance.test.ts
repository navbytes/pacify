import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceMonitor } from '../performance'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMeasures()
    PerformanceMonitor.setEnabled(true)
    vi.clearAllMocks()
  })

  describe('startMeasure and endMeasure', () => {
    it('should measure performance of an operation', () => {
      PerformanceMonitor.startMeasure('test-operation')

      // Simulate work
      const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0)
      expect(sum).toBeGreaterThan(0)

      const result = PerformanceMonitor.endMeasure('test-operation')

      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    it('should return undefined for non-existent measure', () => {
      const result = PerformanceMonitor.endMeasure('non-existent')

      expect(result).toBeUndefined()
    })

    it('should track metadata', () => {
      PerformanceMonitor.startMeasure('test', { action: 'save', count: 5 })
      PerformanceMonitor.endMeasure('test')

      const measures = PerformanceMonitor.getMeasures()
      expect(measures.length).toBeGreaterThan(0)
      expect(measures[measures.length - 1].data).toEqual({ action: 'save', count: 5 })
    })

    it('should handle multiple concurrent measures', () => {
      PerformanceMonitor.startMeasure('operation1')
      PerformanceMonitor.startMeasure('operation2')

      const duration1 = PerformanceMonitor.endMeasure('operation1')
      const duration2 = PerformanceMonitor.endMeasure('operation2')

      expect(duration1).toBeGreaterThanOrEqual(0)
      expect(duration2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('measureFunction', () => {
    it('should wrap function and measure performance', () => {
      const testFn = vi.fn(() => 'result')
      const wrapped = PerformanceMonitor.measureFunction('test-fn', testFn)

      const result = wrapped()

      expect(result).toBe('result')
      expect(testFn).toHaveBeenCalled()

      const measures = PerformanceMonitor.getMeasures()
      expect(measures.some((m) => m.name === 'test-fn')).toBe(true)
    })

    it('should handle async functions', async () => {
      const asyncFn = vi.fn(async () => {
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

    it('should handle async function errors and still measure', async () => {
      const errorFn = vi.fn(async () => {
        throw new Error('Test error')
      })

      const wrapped = PerformanceMonitor.measureFunction('error-fn', errorFn)

      await expect(wrapped()).rejects.toThrow('Test error')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'error-fn')
      expect(measure).toBeDefined()
      expect(measure?.data?.error).toBeDefined()
    })

    it('should pass arguments to wrapped function', () => {
      const testFn = vi.fn((a: number, b: number) => a + b)
      const wrapped = PerformanceMonitor.measureFunction('add', testFn)

      const result = wrapped(5, 3)

      expect(result).toBe(8)
      expect(testFn).toHaveBeenCalledWith(5, 3)
    })
  })

  describe('getMeasures', () => {
    it('should return all completed measures', () => {
      PerformanceMonitor.startMeasure('measure1')
      PerformanceMonitor.endMeasure('measure1')

      PerformanceMonitor.startMeasure('measure2')
      PerformanceMonitor.endMeasure('measure2')

      const measures = PerformanceMonitor.getMeasures()

      expect(measures.length).toBeGreaterThanOrEqual(2)
      expect(measures.every((m) => m.endTime && m.endTime > 0)).toBe(true)
    })

    it('should not include incomplete measures', () => {
      PerformanceMonitor.startMeasure('incomplete')

      const measures = PerformanceMonitor.getMeasures()

      expect(measures.find((m) => m.name === 'incomplete')).toBeUndefined()
    })

    it('should include start and end times', () => {
      PerformanceMonitor.startMeasure('timed')
      PerformanceMonitor.endMeasure('timed')

      const measures = PerformanceMonitor.getMeasures()
      const measure = measures.find((m) => m.name === 'timed')

      expect(measure?.startTime).toBeGreaterThan(0)
      expect(measure?.endTime).toBeGreaterThan(0)
    })
  })

  describe('clearMeasures', () => {
    it('should clear all measures', () => {
      PerformanceMonitor.startMeasure('test')
      PerformanceMonitor.endMeasure('test')

      expect(PerformanceMonitor.getMeasures().length).toBeGreaterThan(0)

      PerformanceMonitor.clearMeasures()

      expect(PerformanceMonitor.getMeasures().length).toBe(0)
    })

    it('should clear active measures', () => {
      PerformanceMonitor.startMeasure('active')
      PerformanceMonitor.clearMeasures()

      const duration = PerformanceMonitor.endMeasure('active')

      expect(duration).toBeUndefined()
    })
  })

  describe('enabled/disabled state', () => {
    it('should be enabled by default', () => {
      expect(PerformanceMonitor.isEnabled()).toBe(true)
    })

    it('should allow disabling monitoring', () => {
      PerformanceMonitor.setEnabled(false)
      expect(PerformanceMonitor.isEnabled()).toBe(false)

      PerformanceMonitor.setEnabled(true) // Reset
    })

    it('should not measure when disabled', () => {
      PerformanceMonitor.setEnabled(false)
      PerformanceMonitor.startMeasure('disabled-test')
      const result = PerformanceMonitor.endMeasure('disabled-test')

      expect(result).toBeUndefined()

      PerformanceMonitor.setEnabled(true) // Reset
    })
  })
})
