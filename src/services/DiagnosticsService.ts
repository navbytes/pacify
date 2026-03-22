import type { DiagnosticLogEntry, ErrorSeverity } from '@/interfaces/error'

const STORAGE_KEY = 'diagnostic_logs'
const MAX_LOG_ENTRIES = 1000
const MAX_LOG_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Service for managing diagnostic logs
 * Stores error, warning, and info messages for debugging and diagnostics
 */
class DiagnosticsService {
  /**
   * Add a new diagnostic log entry
   */
  async addLog(
    severity: ErrorSeverity,
    type: string,
    message: string,
    options?: {
      proxyName?: string
      proxyId?: string
      details?: string
      url?: string
      stack?: string
    }
  ): Promise<void> {
    const entry: DiagnosticLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      severity,
      type,
      message,
      ...options,
      read: false,
    }

    const logs = await this.getLogs()
    logs.unshift(entry) // Add to beginning (newest first)

    // Trim to max entries and age
    const trimmedLogs = logs
      .slice(0, MAX_LOG_ENTRIES)
      .filter((log) => Date.now() - log.timestamp < MAX_LOG_AGE_MS)

    await chrome.storage.local.set({ [STORAGE_KEY]: trimmedLogs })
  }

  /**
   * Get all diagnostic logs
   */
  async getLogs(): Promise<DiagnosticLogEntry[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return (result[STORAGE_KEY] as DiagnosticLogEntry[]) || []
  }

  /**
   * Get unread log count
   */
  async getUnreadCount(): Promise<number> {
    const logs = await this.getLogs()
    return logs.filter((log) => !log.read).length
  }

  /**
   * Mark logs as read
   */
  async markAsRead(logIds: string[]): Promise<void> {
    const logs = await this.getLogs()
    const updatedLogs = logs.map((log) => (logIds.includes(log.id) ? { ...log, read: true } : log))
    await chrome.storage.local.set({ [STORAGE_KEY]: updatedLogs })
  }

  /**
   * Mark all logs as read
   */
  async markAllAsRead(): Promise<void> {
    const logs = await this.getLogs()
    const updatedLogs = logs.map((log) => ({ ...log, read: true }))
    await chrome.storage.local.set({ [STORAGE_KEY]: updatedLogs })
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY)
  }

  /**
   * Export logs as JSON
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs()
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Helper method to log errors
   */
  async logError(
    type: string,
    message: string,
    options?: Parameters<typeof this.addLog>[3]
  ): Promise<void> {
    await this.addLog('error', type, message, options)
  }

  /**
   * Helper method to log warnings
   */
  async logWarning(
    type: string,
    message: string,
    options?: Parameters<typeof this.addLog>[3]
  ): Promise<void> {
    await this.addLog('warning', type, message, options)
  }

  /**
   * Helper method to log info
   */
  async logInfo(
    type: string,
    message: string,
    options?: Parameters<typeof this.addLog>[3]
  ): Promise<void> {
    await this.addLog('info', type, message, options)
  }
}

export const diagnosticsService = new DiagnosticsService()
