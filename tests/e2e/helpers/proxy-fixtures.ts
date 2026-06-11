import http from 'node:http'
import type { AddressInfo } from 'node:net'
import net from 'node:net'

/**
 * Local network fakes for proxy E2E tests.
 *
 * Provides two throwaway servers on 127.0.0.1:
 *  - an "origin" server that answers `ORIGIN_OK` (what a site returns when
 *    reached DIRECTLY), and
 *  - a forward "proxy" server that answers `PROXIED:<url>` and records every
 *    request line (what a site returns when reached THROUGH the proxy).
 *
 * Because the two produce distinct response bodies, a test can read
 * `document.body.textContent` after navigating and unambiguously tell whether
 * the extension routed the request directly or through the proxy. The proxy
 * also keeps a request log so tests can assert on exactly which URLs/hosts were
 * proxied.
 *
 * Chrome implicitly bypasses the proxy for real loopback hosts (localhost,
 * 127.0.0.1, ::1), so tests should navigate to a non-loopback hostname that is
 * mapped back to 127.0.0.1 via Chrome's `--host-resolver-rules` (see
 * `hostResolverRule` / `PROXY_TEST_HOST`). When a proxy is active Chrome hands
 * that hostname to the proxy instead of resolving it locally; when DIRECT,
 * the resolver rule maps it to the origin server.
 */

/** Hostname tests navigate to. Mapped to 127.0.0.1 via host-resolver-rules. */
export const PROXY_TEST_HOST = 'pacify-origin.test'

export interface ProxyRequest {
  method: string
  /** Absolute URL for forward-proxied HTTP, or `host:port` for CONNECT. */
  target: string
}

export interface ProxyFixtures {
  /** `http://127.0.0.1:<port>` of the forward proxy. */
  proxyUrl: string
  proxyPort: number
  /** `http://127.0.0.1:<port>` of the origin server. */
  originUrl: string
  originPort: number
  /** Hostname:port a test should navigate to (resolves to the origin). */
  originHostUrl: string
  /** Value for Chrome's `--host-resolver-rules` so DIRECT navigations resolve. */
  hostResolverRule: string
  /** Every request the proxy has seen, in order. */
  requests: ProxyRequest[]
  /** Clear the request log between assertions. */
  reset: () => void
  /** Shut both servers down. */
  stop: () => Promise<void>
}

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
  })
}

/**
 * Start the origin + forward-proxy fakes. Remember to `await stop()` in the
 * test teardown.
 */
export async function startProxyFixtures(): Promise<ProxyFixtures> {
  const requests: ProxyRequest[] = []

  const origin = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('ORIGIN_OK')
  })

  const proxy = http.createServer((req, res) => {
    requests.push({ method: req.method ?? 'GET', target: req.url ?? '' })
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end(`PROXIED:${req.url}`)
  })

  // Tunnel HTTPS CONNECT so the fixture is usable for TLS targets too. The
  // body can't be marked (it's encrypted end-to-end), but the request is
  // logged so tests can still assert the proxy was used.
  proxy.on('connect', (req, clientSocket, head) => {
    requests.push({ method: 'CONNECT', target: req.url ?? '' })
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

  const [originPort, proxyPort] = await Promise.all([listen(origin), listen(proxy)])

  return {
    proxyUrl: `http://127.0.0.1:${proxyPort}`,
    proxyPort,
    originUrl: `http://127.0.0.1:${originPort}`,
    originPort,
    originHostUrl: `http://${PROXY_TEST_HOST}:${originPort}/`,
    hostResolverRule: `MAP ${PROXY_TEST_HOST} 127.0.0.1`,
    requests,
    reset: () => {
      requests.length = 0
    },
    stop: () =>
      Promise.all([
        new Promise<void>((r) => origin.close(() => r())),
        new Promise<void>((r) => proxy.close(() => r())),
      ]).then(() => undefined),
  }
}
