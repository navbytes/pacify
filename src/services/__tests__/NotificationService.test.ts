import { describe, expect, spyOn, test } from 'bun:test'
import { StorageService } from '@/services/StorageService'

/**
 * Guards the NotificationService -> StorageService -> errorHandling cycle.
 *
 * StorageService.getPreferences is wrapped in withErrorHandlingAndFallback,
 * whose catch calls NotificationService.error(). If NotificationService reads
 * preferences back through that same wrapped accessor, a storage failure makes
 * the two call each other forever. Reported by a graph import-cycle analysis.
 */
describe('NotificationService / StorageService cycle', () => {
  test('a sync-storage failure falls back once instead of recursing', async () => {
    // mockImplementation rather than mockRejectedValue: chrome.storage.sync.get
    // is an overloaded declaration, so the resolved type infers as `never`.
    const get = spyOn(chrome.storage.sync, 'get').mockImplementation(() =>
      Promise.reject(new Error('QUOTA_BYTES quota exceeded'))
    )

    try {
      const prefs = await StorageService.getPreferences()

      expect(prefs).toEqual({ notifications: true, loggingEnabled: false })
      // The recursion assertion. Two reads are correct and terminal: the
      // original getPreferences, plus NotificationService checking whether
      // notifications are enabled before reporting the failure. That second
      // read throws too, but is caught locally instead of re-entering.
      // Before the fix this count was unbounded and the test hung.
      expect(get.mock.calls.length).toBeLessThanOrEqual(2)
    } finally {
      get.mockRestore()
    }
  })
})
