interface PerformanceEvent {
  name: string
  startTime: number
  endTime?: number
  data?: Record<string, unknown>
}

export class PerformanceMonitor {
  private static events: Map<string, PerformanceEvent> = new Map()
  private static measures: PerformanceEvent[] = []
  private static enabled: boolean = true

  /**
   * Start measuring a performance event
   */
  static startMeasure(name: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return

    this.events.set(name, {
      name,
      startTime: performance.now(),
      data,
    })

    // Also use the built-in Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`)
    }
  }

  /**
   * End measuring a performance event
   */
  static endMeasure(name: string, additionalData?: Record<string, unknown>): number | undefined {
    if (!this.enabled) return

    const event = this.events.get(name)
    if (!event) {
      console.warn(`No performance measurement found for: ${name}`)
      return
    }

    const endTime = performance.now()
    event.endTime = endTime

    if (additionalData) {
      event.data = { ...event.data, ...additionalData }
    }

    const duration = endTime - event.startTime

    // Store the completed measure
    this.measures.push({ ...event })
    this.events.delete(name)

    // Also use the built-in Performance API if available
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, `${name}-start`)
      } catch {
        // Ignore errors from performance API
      }
    }

    // Log the measure
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, event.data)
    }

    return duration
  }

  /**
   * Create a wrapper function that measures performance
   */
  static measureFunction<T extends (...args: never[]) => unknown>(
    name: string,
    fn: T,
    _threshold: number = 100
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      this.startMeasure(name, { args: args.length > 0 ? args : undefined })
      const result = fn(...args)

      // Handle promises
      if (result instanceof Promise) {
        return result
          .then((value) => {
            this.endMeasure(name)
            return value
          })
          .catch((error) => {
            this.endMeasure(name, { error: error.message })
            throw error
          }) as ReturnType<T>
      }

      this.endMeasure(name)
      return result as ReturnType<T>
    }
  }

  /**
   * Get all completed performance measures
   */
  static getMeasures(): readonly PerformanceEvent[] {
    return [...this.measures]
  }

  /**
   * Clear all performance measures
   */
  static clearMeasures(): void {
    this.measures = []
    this.events.clear()

    // Also clear the Performance API if available
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if performance monitoring is enabled
   */
  static isEnabled(): boolean {
    return this.enabled
  }
}

// HOC for measuring component render performance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function measureComponent(component: any, name?: string): any {
  const componentName = name || component.name || 'UnnamedComponent'

  // Store original component lifecycle hooks
  const originalOnMount = component.prototype.onMount
  const originalOnDestroy = component.prototype.onDestroy

  // Wrap the component's lifecycle hooks with performance measurement
  component.prototype.onMount = function (...args: unknown[]) {
    PerformanceMonitor.startMeasure(`render:${componentName}`)
    if (originalOnMount) {
      return originalOnMount.apply(this, args)
    }
  }

  component.prototype.onDestroy = function (...args: unknown[]) {
    PerformanceMonitor.endMeasure(`render:${componentName}`)
    if (originalOnDestroy) {
      return originalOnDestroy.apply(this, args)
    }
  }

  return component
}
