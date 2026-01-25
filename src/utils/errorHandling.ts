// src/utils/errorHandling.ts

import type { ERROR_TYPES } from '@/interfaces'
import { logger } from '@/services/LoggerService'
import { NotificationService } from '@/services/NotificationService'

export type ErrorHandler = (error: unknown) => void

/**
 * Chrome proxy error patterns and their user-friendly messages
 */
const PROXY_ERROR_PATTERNS: Array<{ pattern: RegExp; messageKey: string; fallback: string }> = [
  {
    pattern: /PAC.*script.*error|FindProxyForURL/i,
    messageKey: 'pacScriptError',
    fallback: 'PAC script contains errors. Please check the script syntax.',
  },
  {
    pattern: /invalid.*pac|pac.*invalid/i,
    messageKey: 'invalidPacScript',
    fallback: 'Invalid PAC script. Please ensure it contains a valid FindProxyForURL function.',
  },
  {
    pattern: /failed.*fetch|fetch.*failed|network.*error/i,
    messageKey: 'pacFetchFailed',
    fallback: 'Failed to fetch PAC script from URL. Please check the URL and network connection.',
  },
  {
    pattern: /permission|not.*allowed|access.*denied/i,
    messageKey: 'proxyPermissionDenied',
    fallback: 'Permission denied. The extension may not have the required permissions.',
  },
  {
    pattern: /controlled.*by.*other|another.*extension/i,
    messageKey: 'proxyControlledByOther',
    fallback: 'Proxy settings are controlled by another extension.',
  },
  {
    pattern: /policy|managed|enterprise/i,
    messageKey: 'proxyManagedByPolicy',
    fallback: "Proxy settings are managed by your organization's policy.",
  },
  {
    pattern: /invalid.*host|host.*invalid|bad.*address/i,
    messageKey: 'invalidProxyHost',
    fallback: 'Invalid proxy host address. Please check the server configuration.',
  },
  {
    pattern: /invalid.*port|port.*invalid|bad.*port/i,
    messageKey: 'invalidProxyPort',
    fallback: 'Invalid proxy port. Please enter a valid port number (1-65535).',
  },
  {
    pattern: /timeout|timed.*out/i,
    messageKey: 'proxyTimeout',
    fallback: 'Connection timed out. The proxy server may be unreachable.',
  },
]

/**
 * Parses a Chrome proxy error and returns a user-friendly message
 *
 * @param error - The error from Chrome proxy API
 * @returns Object with messageKey for i18n and fallback message
 */
export function parseProxyError(error: unknown): { messageKey: string; fallback: string } {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)

  // Check against known error patterns
  for (const { pattern, messageKey, fallback } of PROXY_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return { messageKey, fallback }
    }
  }

  // Generic fallback
  return {
    messageKey: 'proxySettingsFailed',
    fallback: `Failed to apply proxy settings: ${errorMessage}`,
  }
}

/**
 * Creates a function that wraps an async operation with error handling
 *
 * @param operation - The async operation to execute
 * @param errorType - The type of error for logging
 * @param customHandler - Optional custom error handler
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function wrapper requires any for proper type inference
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
  // biome-ignore lint/suspicious/noExplicitAny: Generic function wrapper requires any for proper type inference
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
// biome-ignore lint/suspicious/noExplicitAny: Generic function wrapper requires any for proper type inference
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
