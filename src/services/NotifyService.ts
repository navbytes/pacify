import { ALERT_TYPES } from '../interfaces/error'
import { ERROR_TYPES } from '@/interfaces'

export class NotifyService {
  public static error(type: ERROR_TYPES, error: unknown, context = ''): void {
    console.error(context, type, error)

    // In a service worker, we can't show UI alerts directly
    // Instead, log errors and consider sending messages to UI contexts
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // We're in an extension context
      if (chrome.runtime.getURL('')) {
        // Check if we can get URL (not in service worker)
        this.showUIAlert(type, error)
      } else {
        // Service worker context - just log it
        console.error(`[${type}] Error:`, error)
      }
    } else {
      // Not in extension context, use regular alert if available
      this.showUIAlert(type, error)
    }
  }

  private static showUIAlert(type: ERROR_TYPES, _error: unknown): void {
    // Determine the message based on error type
    let message: string

    switch (type) {
      case ERROR_TYPES.BACKUP:
        message = ALERT_TYPES.BACKUP_FAILURE
        break
      case ERROR_TYPES.SAVE_SCRIPT:
        message = ALERT_TYPES.SAVE_FAILURE
        break
      default:
        message = ALERT_TYPES.UNKNOWN_ERROR
        break
    }

    // Show alert if in a window context
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    }
  }

  public static alert(message: ALERT_TYPES | string): void {
    // Only show UI alerts if in a window context
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    } else {
      // In service worker, just log the message
      console.info(`[ALERT] ${message}`)
    }
  }
}
