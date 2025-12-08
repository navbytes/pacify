import type { ProxyStats } from '@/interfaces'
import { StorageService } from './StorageService'

/**
 * ProxyStatsService - Privacy-focused usage statistics
 * Phase 2: User Experience
 *
 * Tracks proxy usage patterns locally to help users:
 * - Identify frequently used proxies
 * - Find unused proxies for cleanup
 * - See how much time is spent on each proxy
 *
 * Privacy principles:
 * - All data stored locally (Chrome local storage, NOT sync)
 * - No external tracking or analytics
 * - User can clear stats anytime
 * - Opt-in (can be disabled in settings)
 */
export class ProxyStatsService {
  private static readonly STATS_STORAGE_KEY = 'proxy_stats'
  private static activeProxy: { id: string; startTime: number } | null = null

  /**
   * Record when a proxy is activated
   */
  static async recordActivation(proxyId: string): Promise<void> {
    try {
      // If there's already an active proxy, deactivate it first
      if (this.activeProxy) {
        await this.recordDeactivation()
      }

      // Get existing stats
      const allStats = await this.getAllStats()
      const stats = allStats[proxyId] || this.createNewStats(proxyId)

      // Update stats
      stats.activationCount++
      stats.lastActivated = new Date()

      // Save updated stats
      allStats[proxyId] = stats
      await this.saveStats(allStats)

      // Track active proxy
      this.activeProxy = {
        id: proxyId,
        startTime: Date.now()
      }
    } catch (error) {
      console.error('Failed to record activation:', error)
    }
  }

  /**
   * Record when a proxy is deactivated (tracks duration)
   */
  static async recordDeactivation(): Promise<void> {
    try {
      if (!this.activeProxy) return

      const { id, startTime } = this.activeProxy
      const duration = Date.now() - startTime

      // Get existing stats
      const allStats = await this.getAllStats()
      const stats = allStats[id]

      if (stats) {
        // Add duration to total active time
        stats.totalActiveTime += duration
        stats.lastDeactivated = new Date()

        // Save updated stats
        allStats[id] = stats
        await this.saveStats(allStats)
      }

      // Clear active proxy
      this.activeProxy = null
    } catch (error) {
      console.error('Failed to record deactivation:', error)
    }
  }

  /**
   * Get stats for a specific proxy
   */
  static async getProxyStats(proxyId: string): Promise<ProxyStats | null> {
    try {
      const allStats = await this.getAllStats()
      return allStats[proxyId] || null
    } catch (error) {
      console.error('Failed to get proxy stats:', error)
      return null
    }
  }

  /**
   * Get all stats
   */
  static async getAllStats(): Promise<Record<string, ProxyStats>> {
    try {
      const result = await chrome.storage.local.get(this.STATS_STORAGE_KEY)
      const stats = result[this.STATS_STORAGE_KEY] || {}

      // Convert date strings back to Date objects
      Object.keys(stats).forEach((id) => {
        if (stats[id].lastActivated) {
          stats[id].lastActivated = new Date(stats[id].lastActivated)
        }
        if (stats[id].lastDeactivated) {
          stats[id].lastDeactivated = new Date(stats[id].lastDeactivated)
        }
        stats[id].createdAt = new Date(stats[id].createdAt)
      })

      return stats
    } catch (error) {
      console.error('Failed to get all stats:', error)
      return {}
    }
  }

  /**
   * Clear stats for a specific proxy
   */
  static async clearStats(proxyId: string): Promise<void> {
    try {
      const allStats = await this.getAllStats()
      delete allStats[proxyId]
      await this.saveStats(allStats)
    } catch (error) {
      console.error('Failed to clear stats:', error)
    }
  }

  /**
   * Clear all stats
   */
  static async clearAllStats(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STATS_STORAGE_KEY)
      this.activeProxy = null
    } catch (error) {
      console.error('Failed to clear all stats:', error)
    }
  }

  /**
   * Get proxies that haven't been used in X days
   */
  static async getUnusedProxies(dayThreshold: number): Promise<string[]> {
    try {
      const allStats = await this.getAllStats()
      const thresholdMs = dayThreshold * 24 * 60 * 60 * 1000
      const now = Date.now()

      const unusedProxies: string[] = []

      Object.entries(allStats).forEach(([proxyId, stats]) => {
        const lastUsed = stats.lastDeactivated || stats.lastActivated

        if (!lastUsed) {
          // Never used
          unusedProxies.push(proxyId)
        } else {
          const timeSinceLastUse = now - lastUsed.getTime()
          if (timeSinceLastUse > thresholdMs) {
            unusedProxies.push(proxyId)
          }
        }
      })

      return unusedProxies
    } catch (error) {
      console.error('Failed to get unused proxies:', error)
      return []
    }
  }

  /**
   * Format duration for display (e.g., "2h 15m", "45m", "30s")
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      const remainingHours = hours % 24
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }

    return `${seconds}s`
  }

  /**
   * Format time ago (e.g., "2 hours ago", "yesterday", "3 days ago")
   */
  static formatTimeAgo(date: Date): string {
    const now = Date.now()
    const then = date.getTime()
    const diffMs = now - then

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
      return 'Just now'
    }

    if (minutes < 60) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    }

    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }

    if (days === 1) {
      return 'Yesterday'
    }

    if (days < 7) {
      return `${days} days ago`
    }

    if (days < 30) {
      const weeks = Math.floor(days / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    }

    const months = Math.floor(days / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  }

  /**
   * Get usage summary for display
   */
  static getUsageSummary(stats: ProxyStats): string {
    if (stats.activationCount === 0) {
      return 'Never used'
    }

    const activations = stats.activationCount === 1 ? '1 time' : `${stats.activationCount} times`
    const duration = this.formatDuration(stats.totalActiveTime)

    return `Used ${activations}, ${duration} total`
  }

  /**
   * Get most used proxies (sorted by activation count)
   */
  static async getMostUsedProxies(limit: number = 5): Promise<Array<{ proxyId: string; stats: ProxyStats }>> {
    try {
      const allStats = await this.getAllStats()
      const entries = Object.entries(allStats)
        .map(([proxyId, stats]) => ({ proxyId, stats }))
        .sort((a, b) => b.stats.activationCount - a.stats.activationCount)
        .slice(0, limit)

      return entries
    } catch (error) {
      console.error('Failed to get most used proxies:', error)
      return []
    }
  }

  /**
   * Create new stats entry for a proxy
   */
  private static createNewStats(proxyId: string): ProxyStats {
    return {
      proxyId,
      activationCount: 0,
      totalActiveTime: 0,
      createdAt: new Date()
    }
  }

  /**
   * Save stats to storage
   */
  private static async saveStats(stats: Record<string, ProxyStats>): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.STATS_STORAGE_KEY]: stats })
    } catch (error) {
      console.error('Failed to save stats:', error)
      throw error
    }
  }

  /**
   * Initialize stats tracking (call when extension starts)
   */
  static async initialize(): Promise<void> {
    try {
      // Get current active proxy from settings
      const settings = await StorageService.getSettings()
      if (settings.activeScriptId) {
        // Start tracking if there's an active proxy
        await this.recordActivation(settings.activeScriptId)
      }
    } catch (error) {
      console.error('Failed to initialize stats service:', error)
    }
  }

  /**
   * Clean up stats for deleted proxies
   */
  static async cleanupDeletedProxies(existingProxyIds: string[]): Promise<void> {
    try {
      const allStats = await this.getAllStats()
      const statsToKeep: Record<string, ProxyStats> = {}

      // Only keep stats for proxies that still exist
      existingProxyIds.forEach((id) => {
        if (allStats[id]) {
          statsToKeep[id] = allStats[id]
        }
      })

      await this.saveStats(statsToKeep)
    } catch (error) {
      console.error('Failed to cleanup deleted proxy stats:', error)
    }
  }
}
