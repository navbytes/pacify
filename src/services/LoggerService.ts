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

  /**
   * Create a child logger with a prefix
   */
  createLogger(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix)
  }
}

/**
 * Child Logger with prefix support
 */
class ChildLogger {
  constructor(
    private parent: LoggerService,
    private prefix: string
  ) {}

  private formatMessage(message: string): string {
    return `[${this.prefix}] ${message}`
  }

  trace(message: string, ...args: unknown[]): void {
    this.parent.trace(this.formatMessage(message), ...args)
  }

  debug(message: string, ...args: unknown[]): void {
    this.parent.debug(this.formatMessage(message), ...args)
  }

  info(message: string, ...args: unknown[]): void {
    this.parent.info(this.formatMessage(message), ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    this.parent.warn(this.formatMessage(message), ...args)
  }

  error(message: string, ...args: unknown[]): void {
    this.parent.error(this.formatMessage(message), ...args)
  }
}

// Export singleton instance
export const logger = new LoggerService()
export type { LoggerService, ChildLogger }
