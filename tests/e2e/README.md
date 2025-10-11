# E2E Testing for PACify Extension

## ⚠️ IMPORTANT: Chrome Extensions CANNOT Run in Headless Mode

**This is a Chrome/Chromium limitation**, not a Playwright or configuration issue.

### Why Tests Always Open a Browser Window:

- Chrome extension APIs require full browser context
- Service workers need visible browser environment
- Extension manifest loading requires headed mode
- This is expected behavior - NOT a bug

### What This Means:

✅ Tests will open a visible browser (this is correct)
✅ You'll see the extension running (this is normal)
❌ Cannot run truly headless (Chrome limitation)
❌ CI/CD needs display server like Xvfb

## Running Tests

```bash
# 1. Build extension first
npm run build

# 2. Run tests (will open browser window)
npm run test:e2e

# 3. Debug with UI
npm run test:e2e:ui
```

## Test Files

- `comprehensive-flows.spec.ts` - Main suite (28 tests) ⭐
- `proxy-management.spec.ts` - Legacy tests (15 tests)
- `extension-smoke.spec.ts` - Build verification (5 tests)

## Using Data Test IDs

Add to components:

```svelte
<button data-testid="my-button">Click</button>
```

Use in tests:

```typescript
await page.click('[data-testid="my-button"]')
```

Available test IDs:

- `page-title` - Main heading
- `add-new-script-btn` - Add proxy button
- `modal-title` - Modal heading

## For more details see: E2E_TEST_COVERAGE.md
