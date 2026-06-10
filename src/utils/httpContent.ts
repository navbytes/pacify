/**
 * Helpers for validating remote HTTP responses before we treat their bodies as
 * text rule lists / PAC scripts. Used by subscription and PAC fetching to add a
 * cheap guard against obviously-wrong (binary) payloads.
 */

/** Cap for remote text resources (rule lists, PAC scripts): 10 MB. */
export const MAX_REMOTE_TEXT_BYTES = 10 * 1024 * 1024

/**
 * MIME type prefixes that can never be a text rule list or PAC script. We use a
 * conservative *deny* list rather than an allow list because legitimate servers
 * serve rule lists under many content types (text/plain, application/octet-stream,
 * text/yaml, application/x-ns-proxy-autoconfig, …) and an allow list would reject
 * valid sources. This only rejects payloads that are unambiguously binary.
 */
const BINARY_CONTENT_TYPE_PREFIXES = [
  'image/',
  'audio/',
  'video/',
  'font/',
  'application/pdf',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/octet-stream', // note: some lists use this; see isLikelyBinaryContentType
]

/**
 * Returns true when the content type is unambiguously binary and should be
 * rejected before parsing as text.
 *
 * `application/octet-stream` is intentionally treated as *allowed* because some
 * real rule-list hosts use it for plain-text files; only clearly-binary media
 * types are rejected.
 */
export function isLikelyBinaryContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false
  const ct = contentType.toLowerCase()
  return BINARY_CONTENT_TYPE_PREFIXES.some(
    (prefix) => prefix !== 'application/octet-stream' && ct.startsWith(prefix)
  )
}

/**
 * Throw if the response is too large (declared) or has a binary content type.
 * Call after `fetch` resolves and before reading the body.
 */
export function assertTextResponse(response: Response, kind: string): void {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REMOTE_TEXT_BYTES) {
    throw new Error(`${kind} is too large (over 10 MB).`)
  }
  if (isLikelyBinaryContentType(response.headers.get('content-type'))) {
    throw new Error(`${kind} looks like a binary file, not text. Check the URL.`)
  }
}
