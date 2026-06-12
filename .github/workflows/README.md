# CI/CD Pipeline

This pipeline shape is shared across navbytes browser-extension repos
(pacify, RequestKit, …) — keep changes consistent between them.

## Workflows

| Workflow | File | Trigger | What it does |
| --- | --- | --- | --- |
| CI | `ci.yml` | PRs & pushes to `main` | Lint/format (Biome), type check (svelte-check), `bun audit` (high+), unit tests with coverage, build, manifest validation, package.json↔manifest.json version sync, bundle-size budget (1MB/JS file, 10MB zip), store-zip packaging (no source maps), Playwright E2E against Chrome for Testing. Uploads the store zip and unpacked `dist` as artifacts for sideloading. |
| PR Checks | `pr-checks.yml` | PR opened/edited | Enforces conventional-commit PR titles (PRs are squash-merged; release-please reads the resulting commit subjects). |
| Scheduled Security Audit | `audit.yml` | Mondays 06:00 UTC | `bun audit --audit-level=moderate` — catches new advisories without a code change. |
| Release Please | `release-please.yml` | Push to `main` | Maintains a rolling release PR from conventional commits. Merging it bumps `package.json` + `manifest.json` (via `release-please-config.json` extra-files) and updates `CHANGELOG.md`. |
| Create Release | `release.yml` | `manifest.json` change on `main` | Tag-guarded (idempotent): tests, builds, packages `Pacify_<version>.zip`, extracts notes from `CHANGELOG.md`, creates the GitHub Release. |
| Publish to Chrome Web Store | `publish-cws.yml` | Manual (Actions tab) | Downloads the release zip and uploads it to CWS via `chrome-webstore-upload-cli`. Upload-only by default; check the `publish` input to also submit for review. |

## Release flow

1. Merge PRs with conventional titles (`feat:`, `fix:`, …) — release-please
   accumulates them into a release PR.
2. Merge the release PR → versions bump, changelog updates.
3. `release.yml` fires on the `manifest.json` change → tag + GitHub Release
   with the store zip attached.
4. When ready, run **Publish to Chrome Web Store** from the Actions tab.

## Required secrets (publish only)

`CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`,
`CHROME_REFRESH_TOKEN` — see the
[chrome-webstore-upload-cli setup guide](https://github.com/fregante/chrome-webstore-upload-cli#setup).
This auth flow (CWS API v1) is deprecated by Google with support ending
**2026-10-15**; plan a migration to API v2 / service-account auth.

## Known limitation

The release PR is created with the default `GITHUB_TOKEN`, so CI does not run
on it automatically (GitHub prevents token-triggered workflow recursion).
Close and reopen the release PR, or push an empty commit to it, if you want
the checks to run before merging.
