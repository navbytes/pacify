import http from 'node:http'
import type { AddressInfo } from 'node:net'
import net from 'node:net'

/**
 * Local network fakes for proxy E2E tests.
 *
 * The building blocks below stand in for the network so traffic tests can prove
 * — with real Chrome — exactly how the extension routed a request:
 *
 *  - {@link startOriginServer} answers `ORIGIN_OK` (what a site returns when
 *    reached DIRECTLY).
 *  - {@link startForwardProxy} answers `PROXIED:<label>:<url>` and logs every
 *    request, so a test can tell traffic went THROUGH the proxy (and, with a
 *    label, *which* proxy). Optionally requires Proxy-Authorization.
 *  - {@link startPacServer} serves a PAC script body over HTTP (for PAC-from-URL
 *    and subscription flows).
 *
 * Because the bodies differ, reading `document.body.textContent` after a
 * navigation is an unambiguous routing assertion.
 *
 * Loopback gotcha: Chrome implicitly bypasses the proxy for real loopback hosts
 * (localhost, 127.0.0.1, ::1), which would defeat these tests. Navigate instead
 * to {@link PROXY_TEST_HOST} (a non-loopback name) and launch Chrome with
 * `--host-resolver-rules=<hostResolverRule>` so DIRECT navigations still resolve
 * to the origin. When a proxy is active Chrome hands the hostname to the proxy
 * rather than resolving it locally.
 */

/** Hostname tests navigate to. Mapped to 127.0.0.1 via host-resolver-rules. */
export const PROXY_TEST_HOST = 'pacify-origin.test'

/** A second hostname, for "this rule should NOT match → fallback/DIRECT" cases. */
export const PROXY_TEST_HOST_ALT = 'pacify-other.test'

/**
 * Host-resolver rule mapping both test hostnames to loopback, so DIRECT
 * navigations resolve to the origin server (Chrome implicitly bypasses the
 * proxy for real loopback addresses, which would otherwise defeat the test).
 */
export const HOST_RESOLVER_RULE = `MAP ${PROXY_TEST_HOST} 127.0.0.1,MAP ${PROXY_TEST_HOST_ALT} 127.0.0.1`

export interface ProxyRequest {
  method: string
  /** Absolute URL for forward-proxied HTTP, or `host:port` for CONNECT. */
  target: string
  /** Whether the request arrived with a valid Proxy-Authorization header. */
  authenticated: boolean
}

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
  })
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise<void>((resolve) => server.close(() => resolve()))
}

// ---------------------------------------------------------------------------
// Origin server
// ---------------------------------------------------------------------------

export interface OriginServer {
  url: string
  port: number
  stop: () => Promise<void>
}

/** Start the "real site" that answers `ORIGIN_OK` on every path. */
export async function startOriginServer(): Promise<OriginServer> {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('ORIGIN_OK')
  })
  const port = await listen(server)
  return { url: `http://127.0.0.1:${port}`, port, stop: () => closeServer(server) }
}

// ---------------------------------------------------------------------------
// Forward proxy (HTTP + CONNECT), optionally auth-required
// ---------------------------------------------------------------------------

export interface ForwardProxyOptions {
  /** Tags the response body (`PROXIED:<label>:<url>`) to distinguish proxies. */
  label?: string
  /** When set, the proxy answers 407 until a matching Proxy-Authorization arrives. */
  auth?: { username: string; password: string }
}

export interface ForwardProxy {
  url: string
  port: number
  label: string
  /** Every request the proxy saw, in order. */
  requests: ProxyRequest[]
  /** Count of 407 challenges issued (proves the auth handshake happened). */
  authChallenges: number
  reset: () => void
  stop: () => Promise<void>
}

/** Start a forward proxy. With `auth`, it challenges (407) until credentials match. */
export async function startForwardProxy(options: ForwardProxyOptions = {}): Promise<ForwardProxy> {
  const label = options.label ?? ''
  const requests: ProxyRequest[] = []
  const state = { authChallenges: 0 }

  const expectedHeader = options.auth
    ? `Basic ${Buffer.from(`${options.auth.username}:${options.auth.password}`).toString('base64')}`
    : null

  const server = http.createServer((req, res) => {
    const authed = !expectedHeader || req.headers['proxy-authorization'] === expectedHeader
    if (expectedHeader && !authed) {
      state.authChallenges++
      res.writeHead(407, {
        'proxy-authenticate': 'Basic realm="pacify-test"',
        'content-type': 'text/plain',
      })
      res.end('PROXY_AUTH_REQUIRED')
      return
    }
    requests.push({ method: req.method ?? 'GET', target: req.url ?? '', authenticated: authed })
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end(label ? `PROXIED:${label}:${req.url}` : `PROXIED:${req.url}`)
  })

  // Tunnel HTTPS CONNECT so the fixture is usable for TLS targets too. The body
  // can't be marked (encrypted end-to-end) but the request is still logged.
  server.on('connect', (req, clientSocket, head) => {
    requests.push({ method: 'CONNECT', target: req.url ?? '', authenticated: true })
    const [host, port] = (req.url ?? '').split(':')
    const upstream = net.connect(Number(port) || 443, host, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      upstream.write(head)
      upstream.pipe(clientSocket)
      clientSocket.pipe(upstream)
    })
    upstream.on('error', () => clientSocket.destroy())
    clientSocket.on('error', () => upstream.destroy())
  })

  const port = await listen(server)
  return {
    url: `http://127.0.0.1:${port}`,
    port,
    label,
    requests,
    get authChallenges() {
      return state.authChallenges
    },
    reset: () => {
      requests.length = 0
      state.authChallenges = 0
    },
    stop: () => closeServer(server),
  }
}

// ---------------------------------------------------------------------------
// PAC server
// ---------------------------------------------------------------------------

export interface PacServer {
  url: string
  port: number
  /** Number of times the PAC body was fetched (proves the extension fetched it). */
  hits: number
  stop: () => Promise<void>
}

/** Serve a PAC script body at `/proxy.pac` (and any path) over HTTP. */
export async function startPacServer(pacBody: string): Promise<PacServer> {
  const state = { hits: 0 }
  const server = http.createServer((_req, res) => {
    state.hits++
    res.writeHead(200, { 'content-type': 'application/x-ns-proxy-autoconfig' })
    res.end(pacBody)
  })
  const port = await listen(server)
  return {
    url: `http://127.0.0.1:${port}/proxy.pac`,
    port,
    get hits() {
      return state.hits
    },
    stop: () => closeServer(server),
  }
}

// ---------------------------------------------------------------------------
// Convenience bundle: origin + one forward proxy (back-compat)
// ---------------------------------------------------------------------------

export interface ProxyFixtures {
  proxyUrl: string
  proxyPort: number
  originUrl: string
  originPort: number
  /** Hostname:port a test should navigate to (resolves to the origin). */
  originHostUrl: string
  /** Value for Chrome's `--host-resolver-rules` so DIRECT navigations resolve. */
  hostResolverRule: string
  /** Every request the proxy has seen, in order. */
  requests: ProxyRequest[]
  reset: () => void
  stop: () => Promise<void>
}

/**
 * Start the origin + a single forward proxy. Convenience wrapper around the
 * builders above for the common case. Remember to `await stop()` in teardown.
 */
export async function startProxyFixtures(): Promise<ProxyFixtures> {
  const [origin, proxy] = await Promise.all([startOriginServer(), startForwardProxy()])
  return {
    proxyUrl: proxy.url,
    proxyPort: proxy.port,
    originUrl: origin.url,
    originPort: origin.port,
    originHostUrl: `http://${PROXY_TEST_HOST}:${origin.port}/`,
    hostResolverRule: HOST_RESOLVER_RULE,
    requests: proxy.requests,
    reset: proxy.reset,
    stop: () => Promise.all([origin.stop(), proxy.stop()]).then(() => undefined),
  }
}
