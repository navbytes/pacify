/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - Whether to invoke the function on the leading edge instead of the trailing edge
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number = 300,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  }

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}

/**
 * Creates a throttled function that only invokes the provided function at most once
 * per every `wait` milliseconds.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let previous = 0

  return function (this: unknown, ...args: Parameters<T>): void {
    const now = Date.now()

    if (!previous) previous = now

    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }

      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}
