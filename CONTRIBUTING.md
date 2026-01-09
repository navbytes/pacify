# Contributing to PACify

Thank you for your interest in contributing to PACify! This document provides guidelines and instructions for contributing to the project.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version

### Setup Development Environment

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/pacify.git
   cd pacify
   ```

2. **Install Dependencies**

   ```bash
   bun install
   # or: npm install (if needed)
   ```

3. **Run Development Server**

   ```bash
   bun run dev              # Start Vite dev server
   bun run dev:extension    # Build extension in watch mode
   ```

4. **Run Tests**

   ```bash
   bun test                # Unit tests (Bun native runner)
   bun run test:e2e        # E2E tests
   bun run test:coverage   # Coverage report
   ```

5. **Code Quality Checks**
   ```bash
   npm run check           # TypeScript type checking
   npm run lint            # ESLint
   npm run lint:fix        # Auto-fix ESLint issues
   npm run format          # Format with Prettier
   npm run format:check    # Check formatting
   ```

## 📋 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/xxx` - New features
- `fix/xxx` - Bug fixes
- `refactor/xxx` - Code refactoring
- `docs/xxx` - Documentation updates

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)

**Examples:**

```bash
feat(proxy): add quick switch keyboard shortcut
fix(pac-script): resolve syntax highlighting bug
refactor(stores): split settings store into modules
docs(readme): update installation instructions
test(proxyUtils): add validation test cases
```

### Pre-commit Hooks

Pre-commit hooks automatically run:

- ESLint with auto-fix
- Prettier formatting
- Type checking (on push)

These ensure code quality before commits.

## 🏗️ Project Structure

```
pacify/
├── src/
│   ├── background/          # Background script
│   ├── components/          # Svelte components
│   ├── design-system/       # Design system primitives
│   ├── interfaces/          # TypeScript interfaces
│   ├── popup/              # Extension popup
│   ├── services/           # Business logic services
│   ├── stores/             # Svelte stores
│   ├── utils/              # Utility functions
│   └── views/              # Main application views
├── tests/
│   └── e2e/                # Playwright E2E tests
├── public/                 # Static assets
└── dist/                   # Build output
```

## 📝 Code Standards

### TypeScript

- **No `any` types**: Use proper types or `unknown`
- **Explicit interfaces**: Define interfaces for all data structures
- **Type imports**: Use `import type` for type-only imports
- **Underscore prefix**: Use `_` for unused parameters

```typescript
// ✅ Good
interface ProxyConfig {
  id: string
  name: string
  enabled: boolean
}

function processConfig(_config: ProxyConfig): void {
  // Implementation
}

// ❌ Bad
function processConfig(config: any): void {
  // Using any is not allowed
}
```

### Svelte Components

- **Svelte 5 Runes**: Use `$props()`, `$derived()`, `$state()`
- **Type Props**: Always type component props
- **Snippets**: Use snippets for children content

```svelte
<script lang="ts">
  interface Props {
    title: string
    count?: number
    children?: import('svelte').Snippet
  }

  let { title, count = 0, children }: Props = $props()

  let doubled = $derived(count * 2)
</script>

<div>
  <h1>{title}</h1>
  <p>Count: {doubled}</p>
  {@render children?.()}
</div>
```

### Testing

#### Unit Tests (Vitest)

- Test business logic and utilities
- Mock external dependencies
- Use descriptive test names

```typescript
import { describe, test, expect, mock } from 'bun:test'

describe('validateProxyServer', () => {
  it('should return true for valid proxy server format', () => {
    expect(validateProxyServer('proxy.example.com:8080')).toBe(true)
  })

  it('should return false for invalid format', () => {
    expect(validateProxyServer('invalid')).toBe(false)
  })
})
```

#### E2E Tests (Playwright)

- Test user workflows
- Test critical paths
- Use page object pattern

```typescript
test('should create new proxy configuration', async ({ page }) => {
  await page.goto('/options.html')
  await page.click('[data-testid="add-config"]')
  await page.fill('[data-testid="config-name"]', 'Test Proxy')
  await page.click('[data-testid="save-config"]')
  await expect(page.locator('text=Test Proxy')).toBeVisible()
})
```

## 🔍 Code Review Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`bun test` and `bun run test:e2e`)
- [ ] Type checking passes (`bun run check`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code is formatted (`bun run format`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console.log statements (use console.warn/error if needed)
- [ ] No commented-out code
- [ ] No unnecessary dependencies added

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser version, OS, extension version
6. **Screenshots**: If applicable
7. **Console Errors**: Any error messages

## 💡 Feature Requests

For feature requests:

1. **Use Case**: Describe the problem you're solving
2. **Proposed Solution**: How you envision the feature
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## 📚 Resources

### Documentation

- [Quick Start Guide](./QUICK_START.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Enhancement Roadmap](./ENHANCEMENT_ROADMAP.md)

### Technologies

- [Svelte 5](https://svelte.dev/docs/svelte/overview)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev/guide/)
- [Bun Test](https://bun.sh/docs/cli/test)
- [Playwright](https://playwright.dev/docs/intro)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Codemirror](https://github.com/codemirror)

### Chrome Extension APIs

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Proxy API](https://developer.chrome.com/docs/extensions/reference/proxy/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

## 🎯 Good First Issues

Looking for a place to start? Check out issues labeled:

- `good first issue` - Perfect for newcomers
- `help wanted` - Community contributions welcome
- `documentation` - Documentation improvements

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: Questions and general discussion

## 📜 License

By contributing to PACify, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

All contributors will be recognized in the project README and release notes.

---

**Thank you for contributing to PACify!** 🎉
