import { describe, expect, test } from 'bun:test'
import {
  assertTextResponse,
  isLikelyBinaryContentType,
  MAX_REMOTE_TEXT_BYTES,
} from '../httpContent'

function makeResponse(headers: Record<string, string>): Response {
  return new Response('body', { headers })
}

describe('isLikelyBinaryContentType', () => {
  test('returns false for missing/empty content type', () => {
    expect(isLikelyBinaryContentType(null)).toBe(false)
    expect(isLikelyBinaryContentType(undefined)).toBe(false)
    expect(isLikelyBinaryContentType('')).toBe(false)
  })

  test('allows text and common rule-list content types', () => {
    for (const ct of [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/html',
      'text/yaml',
      'application/json',
      'application/x-ns-proxy-autoconfig',
      'application/octet-stream', // some real list hosts use this for text
    ]) {
      expect(isLikelyBinaryContentType(ct)).toBe(false)
    }
  })

  test('rejects unambiguously binary media types', () => {
    for (const ct of [
      'image/png',
      'audio/mpeg',
      'video/mp4',
      'font/woff2',
      'application/pdf',
      'application/zip',
      'application/gzip',
    ]) {
      expect(isLikelyBinaryContentType(ct)).toBe(true)
    }
  })

  test('is case-insensitive', () => {
    expect(isLikelyBinaryContentType('IMAGE/PNG')).toBe(true)
  })
})

describe('assertTextResponse', () => {
  test('passes for a normal text response', () => {
    expect(() =>
      assertTextResponse(makeResponse({ 'content-type': 'text/plain' }), 'The rule list')
    ).not.toThrow()
  })

  test('throws when declared content-length exceeds the cap', () => {
    const tooBig = String(MAX_REMOTE_TEXT_BYTES + 1)
    expect(() =>
      assertTextResponse(makeResponse({ 'content-length': tooBig }), 'The rule list')
    ).toThrow(/too large/)
  })

  test('throws for binary content types', () => {
    expect(() =>
      assertTextResponse(makeResponse({ 'content-type': 'application/zip' }), 'PAC script')
    ).toThrow(/binary/)
  })

  test('includes the kind label in the error message', () => {
    expect(() =>
      assertTextResponse(makeResponse({ 'content-type': 'image/png' }), 'PAC script')
    ).toThrow(/PAC script/)
  })
})
