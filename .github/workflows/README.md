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
| Publish to Chrome Web Store | `publish-cws.yml` | Manual (Actions tab) | Downloads the release zip and uploads it to CWS via the **API v2** with service-account auth, gated behind the `chrome-web-store` environment. Upload-only by default; check the `publish` input to also submit for review. |

## Release flow

1. Merge PRs with conventional titles (`feat:`, `fix:`, …) — release-please
   accumulates them into a release PR.
2. Merge the release PR → versions bump, changelog updates.
3. `release.yml` fires on the `manifest.json` change → tag + GitHub Release
   with the store zip attached.
4. When ready, run **Publish to Chrome Web Store** from the Actions tab.

## Publish setup (one-time)

Publishing uses the [Chrome Web Store API v2 with a service
account](https://developer.chrome.com/docs/webstore/service-accounts)
(the v1 OAuth refresh-token flow is deprecated; support ends 2026-10-15):

1. In Google Cloud Console, create a service account (no GCP roles needed)
   and download a JSON key.
2. In the CWS Developer Dashboard, add the service account's email under
   Account → API access, and note your publisher ID.
3. Create a GitHub environment named `chrome-web-store`
   (Settings → Environments) with yourself as a **required reviewer**, and
   add these environment secrets: `CWS_SERVICE_ACCOUNT_JSON` (key file
   contents), `CHROME_PUBLISHER_ID`, `CHROME_EXTENSION_ID`.

The required-reviewer gate means store credentials are only readable after
a manual approval click on each publish run.

## Known limitation

The release PR is created with the default `GITHUB_TOKEN`, so CI does not run
on it automatically (GitHub prevents token-triggered workflow recursion).
Close and reopen the release PR, or push an empty commit to it, if you want
the checks to run before merging.
