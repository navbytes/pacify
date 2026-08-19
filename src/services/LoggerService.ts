import log from 'loglevel'

/**
 * Logger Service
 * Centralized logging utility with configurable log levels
 */
class LoggerService {
  private logger = log

  constructor() {
    // Set default log level based on environment
    if (import.meta.env.MODE === 'production') {
      this.logger.setLevel('warn')
    } else {
      this.logger.setLevel('debug')
    }
  }

  /**
   * Set the logging level
   */
  setLevel(level: log.LogLevelDesc): void {
    this.logger.setLevel(level)
  }

  /**
   * Get current log level
   */
  getLevel(): number {
    return this.logger.getLevel()
  }

  /**
   * Trace level logging (most verbose)
   */
  trace(message: string, ...args: unknown[]): void {
    this.logger.trace(message, ...args)
  }

  /**
   * Debug level logging
   */
  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args)
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args)
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...args)
  }

  /**
   * Error level logging
   */
  error(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...args)
  }
}

// Export singleton instance
export const logger = new LoggerService()
export type { LoggerService }
