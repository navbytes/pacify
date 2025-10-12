# Development Guide

Complete guide for developing PACify.

## 🛠️ Development Setup

### Initial Setup

```bash
# Clone repository
git clone https://github.com/navbytes/pacify.git
cd pacify

# Install dependencies
bun install
# or: npm install (if needed)

# Start development
bun run dev
```

### Loading Extension in Chrome

1. Build the extension:

   ```bash
   bun run build
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (top right)

4. Click "Load unpacked"

5. Select the `dist` folder from the project

### Hot Reload Development

For extension development with auto-rebuild:

```bash
bun run dev:extension
```

This watches for changes and rebuilds automatically. You'll still need to click "Reload" in `chrome://extensions/` after changes.

## 🧪 Testing

### Unit Tests

```bash
# Watch mode (recommended during development)
npm run test

# Single run
npm run test:run

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# With UI (debugging)
npm run test:e2e:ui

# Specific test file
npx playwright test tests/e2e/proxy-management.spec.ts
```

### Writing Tests

#### Unit Test Example

```typescript
// src/utils/__tests__/myUtil.test.ts
import { describe, test, expect } from 'bun:test'
import { myUtil } from '../myUtil'

describe('myUtil', () => {
  it('should do something', () => {
    const result = myUtil('input')
    expect(result).toBe('expected')
  })
})
```

#### E2E Test Example

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/options.html')
    // Test steps
  })
})
```

## 📦 Build & Release

### Production Build

```bash
npm run build
```

Output will be in `dist/` folder.

### Build Validation

```bash
# Type checking
npm run check

# Linting
npm run lint

# All tests
npm run test:run && npm run test:e2e

# Format check
npm run format:check
```

## 🏗️ Architecture

### Store Pattern

We use modular Svelte stores:

```typescript
// src/stores/myStore.ts
import { writable } from 'svelte/store'
import { withErrorHandling } from '@/utils/errorHandling'

interface MyState {
  value: string
}

function createMyStore() {
  const { subscribe, set, update } = writable<MyState>({
    value: '',
  })

  return {
    subscribe,
    setValue: withErrorHandling(async (value: string) => {
      update((state) => ({ ...state, value }))
    }),
  }
}

export const myStore = createMyStore()
```

### Service Pattern

Services handle business logic:

```typescript
// src/services/MyService.ts
export class MyService {
  static async doSomething(): Promise<void> {
    // Implementation
  }
}
```

### Component Pattern

Svelte 5 components with typed props:

```svelte
<script lang="ts">
  interface Props {
    title: string
    onAction?: () => void
    children?: import('svelte').Snippet
  }

  let { title, onAction, children }: Props = $props()
</script>

<div>
  <h1>{title}</h1>
  {#if onAction}
    <button onclick={onAction}>Action</button>
  {/if}
  {@render children?.()}
</div>
```

## 🔧 Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement feature with tests
3. Run quality checks: `npm run check && npm run lint && npm run test:run`
4. Commit with conventional commit message
5. Push and create PR

### Fixing a Bug

1. Write failing test that reproduces bug
2. Fix the bug
3. Verify test passes
4. Commit with `fix:` prefix

### Refactoring

1. Ensure existing tests pass
2. Make refactoring changes
3. Ensure tests still pass
4. Add new tests if needed
5. Commit with `refactor:` prefix

## 🎨 Design System

### Using Design System Components

```svelte
<script>
  import { Box, Flex, Button } from '@/design-system'
</script>

<Box p="md" bg="white" borderRadius="lg" shadow="sm">
  <Flex direction="column" gap="sm">
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Cancel</Button>
  </Flex>
</Box>
```

### Design Tokens

```typescript
// Spacing
type Spacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Colors
type Color = 'primary' | 'secondary' | 'success' | 'error' | 'warning'

// Border Radius
type BorderRadius = 'sm' | 'md' | 'lg' | 'xl' | 'full'

// Shadows
type Shadow = 'sm' | 'md' | 'lg' | 'xl'
```

## 🐛 Debugging

### Chrome DevTools

1. Open extension popup/options page
2. Right-click → "Inspect"
3. Use Console, Network, Sources tabs

### Background Script Debugging

1. Go to `chrome://extensions/`
2. Find PACify
3. Click "background page" under "Inspect views"

### Monaco Editor Debugging

Monaco Editor is lazy-loaded. To debug:

```typescript
import { Monaco } from '@/services/MonacoService.optimized'

// Preload Monaco
await Monaco.preload()

// Then use Monaco methods
```

## 📊 Performance Optimization

### Bundle Analysis

Check bundle size after changes:

```bash
npm run build
ls -lh dist/
```

### Performance Monitoring

Use Chrome DevTools Performance tab:

1. Open extension page
2. Press F12
3. Go to Performance tab
4. Record interaction
5. Analyze flame graph

## 🔐 Security

### Content Security Policy

The extension uses CSP. When adding external resources:

1. Update `manifest.json` CSP settings
2. Document why resource is needed
3. Use subresource integrity if possible

### Permissions

Only request necessary permissions in `manifest.json`. Document why each permission is needed.

## 📝 Documentation

### Code Comments

- Use JSDoc for public APIs
- Explain "why" not "what"
- Keep comments up-to-date

```typescript
/**
 * Validates proxy server format
 *
 * Checks for host:port format and validates port range
 *
 * @param server - Proxy server string (e.g., "proxy.example.com:8080")
 * @returns true if valid, false otherwise
 */
export function validateProxyServer(server: string): boolean {
  // Implementation
}
```

### README Updates

Keep README current with:

- Feature additions
- Breaking changes
- Installation steps
- Usage examples

## 🚨 Troubleshooting

### Common Issues

**Issue: "Module not found"**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: TypeScript errors after update**

```bash
# Rebuild TypeScript
npm run check
```

**Issue: Tests failing**

```bash
# Clear test cache
npm run test:run -- --clearCache
```

**Issue: Extension not loading**

- Check `dist/manifest.json` exists
- Verify build completed successfully
- Check Chrome console for errors

## 📖 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Svelte Documentation](https://svelte.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Playwright Documentation](https://playwright.dev/)

---

Need help? Open an issue or start a discussion on GitHub!
