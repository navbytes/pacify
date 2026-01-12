interface PerformanceEvent {
  name: string
  startTime: number
  endTime?: number
  data?: Record<string, unknown>
}

// biome-ignore lint/complexity/noStaticOnlyClass: Utility class pattern provides namespace and consistent API
export class PerformanceMonitor {
  private static events: Map<string, PerformanceEvent> = new Map()
  private static measures: PerformanceEvent[] = []
  private static enabled: boolean = true

  /**
   * Start measuring a performance event
   */
  static startMeasure(name: string, data?: Record<string, unknown>): void {
    if (!PerformanceMonitor.enabled) return

    PerformanceMonitor.events.set(name, {
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
    if (!PerformanceMonitor.enabled) return

    const event = PerformanceMonitor.events.get(name)
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
    PerformanceMonitor.measures.push({ ...event })
    PerformanceMonitor.events.delete(name)

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
      PerformanceMonitor.startMeasure(name, { args: args.length > 0 ? args : undefined })
      const result = fn(...args)

      // Handle promises
      if (result instanceof Promise) {
        return result
          .then((value) => {
            PerformanceMonitor.endMeasure(name)
            return value
          })
          .catch((error) => {
            PerformanceMonitor.endMeasure(name, { error: error.message })
            throw error
          }) as ReturnType<T>
      }

      PerformanceMonitor.endMeasure(name)
      return result as ReturnType<T>
    }
  }

  /**
   * Get all completed performance measures
   */
  static getMeasures(): readonly PerformanceEvent[] {
    return [...PerformanceMonitor.measures]
  }

  /**
   * Clear all performance measures
   */
  static clearMeasures(): void {
    PerformanceMonitor.measures = []
    PerformanceMonitor.events.clear()

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
    PerformanceMonitor.enabled = enabled
  }

  /**
   * Check if performance monitoring is enabled
   */
  static isEnabled(): boolean {
    return PerformanceMonitor.enabled
  }
}

// Interface for class-based components with lifecycle hooks
interface ComponentWithLifecycle {
  name?: string
  prototype: {
    onMount?: (...args: unknown[]) => unknown
    onDestroy?: (...args: unknown[]) => unknown
  }
}

// HOC for measuring component render performance
export function measureComponent<T extends ComponentWithLifecycle>(component: T, name?: string): T {
  const componentName = name || component.name || 'UnnamedComponent'

  // Store original component lifecycle hooks
  const originalOnMount = component.prototype.onMount
  const originalOnDestroy = component.prototype.onDestroy

  // Wrap the component's lifecycle hooks with performance measurement
  component.prototype.onMount = function (...args: unknown[]): unknown {
    PerformanceMonitor.startMeasure(`render:${componentName}`)
    if (originalOnMount) {
      return originalOnMount.apply(this, args)
    }
    return undefined
  }

  component.prototype.onDestroy = function (...args: unknown[]): unknown {
    PerformanceMonitor.endMeasure(`render:${componentName}`)
    if (originalOnDestroy) {
      return originalOnDestroy.apply(this, args)
    }
    return undefined
  }

  return component
}
