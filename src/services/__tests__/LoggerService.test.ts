import { beforeEach, describe, expect, test } from 'bun:test'
import { logger } from '../LoggerService'

describe('LoggerService', () => {
  describe('log level management', () => {
    test('can set and get log level', () => {
      // Set to a specific level
      logger.setLevel('info')
      const level = logger.getLevel()

      // loglevel uses numeric levels: 0=TRACE, 1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=SILENT
      expect(level).toBe(2) // INFO level
    })

    test('can set to debug level', () => {
      logger.setLevel('debug')
      const level = logger.getLevel()
      expect(level).toBe(1) // DEBUG level
    })

    test('can set to warn level', () => {
      logger.setLevel('warn')
      const level = logger.getLevel()
      expect(level).toBe(3) // WARN level
    })

    test('can set to error level', () => {
      logger.setLevel('error')
      const level = logger.getLevel()
      expect(level).toBe(4) // ERROR level
    })

    test('can set to trace level', () => {
      logger.setLevel('trace')
      const level = logger.getLevel()
      expect(level).toBe(0) // TRACE level
    })
  })

  describe('logging methods', () => {
    beforeEach(() => {
      // Set to trace to ensure all messages are logged
      logger.setLevel('trace')
    })

    test('trace method does not throw', () => {
      expect(() => logger.trace('trace message')).not.toThrow()
    })

    test('debug method does not throw', () => {
      expect(() => logger.debug('debug message')).not.toThrow()
    })

    test('info method does not throw', () => {
      expect(() => logger.info('info message')).not.toThrow()
    })

    test('warn method does not throw', () => {
      expect(() => logger.warn('warn message')).not.toThrow()
    })

    test('error method does not throw', () => {
      expect(() => logger.error('error message')).not.toThrow()
    })

    test('log methods accept additional arguments', () => {
      expect(() => logger.info('message', { data: 'test' }, 123, true)).not.toThrow()
    })

    test('log methods accept multiple additional arguments', () => {
      expect(() => logger.debug('test', 'arg1', 'arg2', 'arg3', { key: 'value' })).not.toThrow()
    })
  })

  describe('log level filtering', () => {
    test('respects log level settings', () => {
      // This is a behavioral test - when level is set high,
      // lower level messages should not be logged (but the methods don't throw)
      logger.setLevel('error')

      // All these should not throw regardless of level
      expect(() => logger.trace('should be filtered')).not.toThrow()
      expect(() => logger.debug('should be filtered')).not.toThrow()
      expect(() => logger.info('should be filtered')).not.toThrow()
      expect(() => logger.warn('should be filtered')).not.toThrow()
      expect(() => logger.error('should be logged')).not.toThrow()
    })
  })

  describe('edge cases', () => {
    test('handles empty message', () => {
      expect(() => logger.info('')).not.toThrow()
    })

    test('handles undefined arguments', () => {
      expect(() => logger.info('message', undefined)).not.toThrow()
    })

    test('handles null arguments', () => {
      expect(() => logger.info('message', null)).not.toThrow()
    })

    test('handles complex objects', () => {
      const complexObject = {
        nested: {
          deep: {
            value: [1, 2, 3],
          },
        },
        circular: {} as Record<string, unknown>,
      }

      expect(() => logger.info('complex', complexObject)).not.toThrow()
    })

    test('handles Error objects', () => {
      const error = new Error('Test error')
      expect(() => logger.error('Error occurred:', error)).not.toThrow()
    })

    test('handles special characters in messages', () => {
      expect(() => logger.info('Special: 你好 🎉 <script>alert(1)</script>')).not.toThrow()
    })
  })
})
