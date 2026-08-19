import log from 'loglevel'

/**
 * Centralized logger.
 *
 * This is `loglevel`'s global instance with the environment's default level
 * applied. It is re-exported (rather than wrapped) on purpose: loglevel binds
 * the real `console` methods, so devtools still reports the calling file and
 * line. A wrapper class would attribute every log to this module instead.
 */
log.setLevel(import.meta.env.MODE === 'production' ? 'warn' : 'debug')

export const logger = log
