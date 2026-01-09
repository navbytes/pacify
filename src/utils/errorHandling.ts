// src/utils/errorHandling.ts

import type { ERROR_TYPES } from '@/interfaces'
import { logger } from '@/services/LoggerService'
import { NotificationService } from '@/services/NotificationService'

export type ErrorHandler = (error: unknown) => void

/**
 * Creates a function that wraps an async operation with error handling
 *
 * @param operation - The async operation to execute
 * @param errorType - The type of error for logging
 * @param customHandler - Optional custom error handler
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  errorType: ERROR_TYPES,
  customHandler?: ErrorHandler
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await operation(...args)
    } catch (error) {
      // Default error handling
      await NotificationService.error(errorType, error)

      // Custom error handling if provided
      if (customHandler) {
        customHandler(error)
      }

      // Rethrow the error for the caller to handle
      throw error
    }
  }) as T
}

/**
 * Creates a function that wraps an async operation with error handling and provides a fallback
 *
 * @param operation - The async operation to execute
 * @param errorType - The type of error for logging
 * @param fallbackValue - The value to return if the operation fails
 */
export function withErrorHandlingAndFallback<
  T extends (...args: any[]) => Promise<any>,
  R = Awaited<ReturnType<T>>,
>(operation: T, errorType: ERROR_TYPES, fallbackValue: R): (...args: Parameters<T>) => Promise<R> {
  return async (...args: Parameters<T>): Promise<R> => {
    try {
      return (await operation(...args)) as R
    } catch (error) {
      await NotificationService.error(errorType, error)
      return fallbackValue
    }
  }
}

/**
 * Creates a function that retries a failed operation
 *
 * @param operation - The async operation to execute
 * @param errorType - The type of error for logging
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Base delay between retries (will increase exponentially)
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  errorType: ERROR_TYPES,
  maxRetries: number = 3,
  delayMs: number = 1000
): T {
  return (async (...args: Parameters<T>) => {
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation(...args)
      } catch (error) {
        lastError = error

        if (attempt <= maxRetries) {
          // Log error but continue with retry
          logger.warn(`Operation failed (attempt ${attempt}/${maxRetries + 1}). Retrying...`, error)

          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** (attempt - 1)))
        }
      }
    }

    // If we reach here, all retries failed
    await NotificationService.error(errorType, lastError)
    throw lastError
  }) as T
}
