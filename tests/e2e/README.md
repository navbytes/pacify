# E2E Testing for PACify Extension

These tests load the **real built extension** into Chrome via Playwright and
drive it the way a user would (options page, popup, modals). They run
**headless by default**.

## Headless works (modern Chrome)

Chrome's modern headless mode (the `--headless=new` engine used by recent
Chrome/Chromium) **does** support MV3 extensions and service workers, so these
tests no longer require a visible window or Xvfb. Set `HEADED=1` to watch a run
in a real window while debugging.

### Chrome binary

`helpers/extension-loader.ts` resolves the Chrome binary in this order:

1. `CHROME_PATH` env var (if it points at an existing binary)
2. Chrome for Testing at `~/.cache/chrome-for-testing/chrome-linux64/chrome`
3. Playwright's bundled Chromium (fallback)

To fetch a Chrome for Testing build (when Playwright's CDN is unavailable), the
binaries are hosted on the public GCS bucket, e.g.:

```bash
mkdir -p ~/.cache/chrome-for-testing && cd ~/.cache/chrome-for-testing
curl -sO https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.4/linux64/chrome-linux64.zip
unzip -q chrome-linux64.zip && rm chrome-linux64.zip
```

## Running

```bash
bun run build                                   # 1. build the extension into dist/
bunx playwright test                            # 2. run all e2e specs (headless)
HEADED=1 bunx playwright test <spec>            # debug in a visible window
```

## Test files

- `comprehensive-flows.spec.ts` — main UI flows (27 tests) ⭐
- `proxy-management.spec.ts` — proxy CRUD / quick-switch / backup (8 tests)
- `traffic-routing.spec.ts` — **real traffic** through a local proxy (DIRECT vs
  proxied vs bypass) — proves UI → store → background → `chrome.proxy` → routing
- `extension-smoke.spec.ts` — build verification (5 tests)
- `*-screenshots.spec.ts`, `capture-ui.spec.ts` — screenshot capture utilities

## Test helpers / fakes

- `helpers/extension-loader.ts` — `launchExtension({ suppressOnboarding?, extraArgs? })`
  launches Chrome with the extension, returns `{ context, extensionId }`, and
  clears the first-run onboarding flag so it doesn't block interaction tests.
  `extraArgs` forwards extra Chrome flags (e.g. `--host-resolver-rules`).
- `helpers/proxy-fixtures.ts` — `startProxyFixtures()` spins up two throwaway
  127.0.0.1 servers for traffic tests:
  - an **origin** that answers `ORIGIN_OK` (what a site returns DIRECT), and
  - a **forward proxy** that answers `PROXIED:<url>` and logs every request.

  Distinct response bodies make routing assertions unambiguous (read the page
  body after navigating). Navigate to `originHostUrl` (a non-loopback hostname,
  `pacify-origin.test`) with Chrome launched using `hostResolverRule` so DIRECT
  navigations resolve to the origin — Chrome implicitly bypasses the proxy for
  real loopback addresses, which would otherwise defeat the test. The proxy also
  tunnels HTTPS `CONNECT` (logged) for future TLS scenarios.

  ```ts
  const fx = await startProxyFixtures()
  const { context } = await launchExtension({
    extraArgs: [`--host-resolver-rules=${fx.hostResolverRule}`],
  })
  // … activate a proxy pointing at fx.proxyPort, then:
  // body === 'PROXIED:…'  → routed through the proxy
  // body === 'ORIGIN_OK'  → DIRECT / bypassed
  await fx.stop()
  ```

## Common data-testids

`page-title`, `add-new-script-btn`, `modal-title`, `modal-save-btn`,
`modal-cancel-btn`, `single-proxy-host-input`, `single-proxy-port-input`,
`import-btn`, `export-btn`, `add-auto-proxy-btn`.
