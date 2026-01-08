import { browserService } from './chrome/BrowserService'
import { StorageService } from './StorageService'
import { ERROR_TYPES } from '@/interfaces'
import { ALERT_TYPES } from '@/interfaces/error'
import { toastStore, type ToastType } from '@/stores/toastStore'

/**
 * Notification context determines where notifications are shown
 */
type NotificationContext = 'foreground' | 'background'

/**
 * Notification options for the unified service
 */
interface NotificationOptions {
  title?: string
  message: string
  type?: ToastType
  duration?: number
  requireInteraction?: boolean
  context?: NotificationContext
}

/**
 * Unified notification service that intelligently chooses between:
 * - Chrome system notifications (for background events)
 * - In-app toasts (for foreground UI feedback)
 *
 * Respects user's notification preferences from settings.
 */
export class NotificationService {
  private static readonly DEFAULT_ICON = 'icons/icon128.png'
  private static readonly EXTENSION_NAME = 'Pacify'

  /**
   * Check if Chrome notifications are enabled in user settings
   */
  private static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const preferences = await StorageService.getPreferences()
      return preferences?.notifications ?? true
    } catch {
      return true // Fallback to enabled if we can't read settings
    }
  }

  /**
   * Determine if we're in a UI context (popup or options page)
   */
  private static isUIContext(): boolean {
    return typeof window !== 'undefined' && window.document !== undefined
  }

  /**
   * Show a notification using the appropriate method
   */
  static async show(options: NotificationOptions): Promise<void> {
    const {
      title,
      message,
      type = 'info',
      duration = 3000,
      requireInteraction = false,
      context = this.isUIContext() ? 'foreground' : 'background',
    } = options

    // For foreground context, prefer toasts
    if (context === 'foreground' && this.isUIContext()) {
      toastStore.show(message, type, duration)
      return
    }

    // For background context, use Chrome notifications if enabled
    const notificationsEnabled = await this.areNotificationsEnabled()
    if (notificationsEnabled && context === 'background') {
      try {
        await this.showChromeNotification({
          title: title || this.EXTENSION_NAME,
          message,
          type,
          requireInteraction,
        })
      } catch (error) {
        console.error('Failed to show Chrome notification:', error)
        // Fallback to toast if in UI context
        if (this.isUIContext()) {
          toastStore.show(message, type, duration)
        }
      }
    } else if (this.isUIContext()) {
      // Fallback to toast if notifications disabled but we're in UI
      toastStore.show(message, type, duration)
    }
  }

  /**
   * Show a Chrome system notification
   */
  private static async showChromeNotification(options: {
    title: string
    message: string
    type: ToastType
    requireInteraction: boolean
  }): Promise<void> {
    const { title, message, type, requireInteraction } = options

    await browserService.notifications.create(crypto.randomUUID(), {
      type: 'basic',
      iconUrl: this.DEFAULT_ICON,
      title,
      message,
      priority: type === 'error' ? 2 : type === 'warning' ? 1 : 0,
      requireInteraction,
    })
  }

  /**
   * Show a success notification
   */
  static async success(message: string, options?: Partial<NotificationOptions>): Promise<void> {
    await this.show({
      message,
      type: 'success',
      ...options,
    })
  }

  /**
   * Show an error notification
   */
  static async error(
    messageOrType: string | ERROR_TYPES,
    errorOrContext?: unknown,
    context?: string
  ): Promise<void> {
    let message: string
    let notificationContext: NotificationContext = 'background'

    // Handle legacy NotifyService.error(ERROR_TYPES, error, context) signature
    if (typeof messageOrType !== 'string') {
      const errorType = messageOrType
      const error = errorOrContext

      // Log for debugging
      console.error(context || '', errorType, error)

      // Map error type to user-friendly message
      message = this.getErrorMessage(errorType)

      // Errors from background should show as system notifications
      notificationContext = 'background'
    } else {
      // Direct string message
      message = messageOrType
      notificationContext = this.isUIContext() ? 'foreground' : 'background'
    }

    await this.show({
      message,
      type: 'error',
      duration: 5000, // Longer duration for errors
      requireInteraction: false,
      context: notificationContext,
    })
  }

  /**
   * Show a warning notification
   */
  static async warning(message: string, options?: Partial<NotificationOptions>): Promise<void> {
    await this.show({
      message,
      type: 'warning',
      duration: 4000,
      ...options,
    })
  }

  /**
   * Show an info notification
   */
  static async info(message: string, options?: Partial<NotificationOptions>): Promise<void> {
    await this.show({
      message,
      type: 'info',
      ...options,
    })
  }

  /**
   * Legacy alert method for backward compatibility
   * @deprecated Use NotificationService.info() or NotificationService.warning() instead
   */
  static alert(message: ALERT_TYPES | string): void {
    // In UI context, use toast
    if (this.isUIContext()) {
      toastStore.show(message, 'warning', 4000)
    } else {
      // In service worker, just log
      console.info(`[ALERT] ${message}`)
    }
  }

  /**
   * Map error types to user-friendly messages
   */
  private static getErrorMessage(type: ERROR_TYPES): string {
    switch (type) {
      case ERROR_TYPES.BACKUP:
        return ALERT_TYPES.BACKUP_FAILURE
      case ERROR_TYPES.SAVE_SCRIPT:
      case ERROR_TYPES.SAVE_SETTINGS:
        return ALERT_TYPES.SAVE_FAILURE
      case ERROR_TYPES.FETCH_SETTINGS:
      case ERROR_TYPES.LOAD_SETTINGS:
        return 'Failed to load settings'
      case ERROR_TYPES.SET_PROXY:
        return 'Failed to set proxy configuration'
      case ERROR_TYPES.CLEAR_PROXY:
        return 'Failed to clear proxy configuration'
      case ERROR_TYPES.DELETE_SCRIPT:
        return 'Failed to delete script'
      default:
        return ALERT_TYPES.UNKNOWN_ERROR
    }
  }

  /**
   * Show a notification for proxy switching events (for automatic mode)
   */
  static async proxySwitch(proxyName: string, url?: string): Promise<void> {
    const message = url
      ? `Switched to "${proxyName}" for ${new URL(url).hostname}`
      : `Switched to "${proxyName}"`

    await this.show({
      title: 'Proxy Switched',
      message,
      type: 'info',
      duration: 3000,
      context: 'background',
    })
  }

  /**
   * Show a notification for proxy errors
   */
  static async proxyError(proxyName: string, error: string): Promise<void> {
    await this.show({
      title: 'Proxy Error',
      message: `Failed to use "${proxyName}": ${error}`,
      type: 'error',
      duration: 5000,
      requireInteraction: true,
      context: 'background',
    })
  }
}
