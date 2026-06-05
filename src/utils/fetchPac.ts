import { logger } from '@/services/LoggerService'

interface FetchPacResponse {
  success: boolean
  data?: string
  error?: string
}

/**
 * Fetch a remote PAC script through the background service worker's hardened
 * fetch (custom User-Agent + timeout), instead of a raw `fetch()` in the page.
 * This makes PAC-by-URL work on the same bot-protected servers that the
 * subscription fetch path already handles.
 */
export async function fetchPacViaBackground(url: string): Promise<string> {
  let response: FetchPacResponse | undefined
  try {
    response = (await chrome.runtime.sendMessage({
      type: 'FETCH_PAC',
      url,
    })) as FetchPacResponse
  } catch (error) {
    logger.error('FETCH_PAC message failed:', error)
    throw new Error('Failed to fetch PAC script')
  }

  if (!response?.success || response.data === undefined) {
    throw new Error(response?.error || 'Failed to fetch PAC script')
  }
  return response.data
}
