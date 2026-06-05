# PACify Migration & Onboarding Plan

> **Goal:** Make it effortless for users of other proxy managers — Proxy
> SwitchyOmega / ZeroOmega, FoxyProxy, and Chrome's own proxy settings — to move
> their entire configuration into PACify in one or two clicks, with zero manual
> re-entry.
>
> **Status:** Phases 0 & 1 implemented — `ImportService` + SwitchyOmega,
> FoxyProxy, PAC and PACify adapters, the import wizard, and unit tests are in
> `src/services/import/` and `src/components/ImportModal.svelte`. Phases 2 & 3
> remain planned.
> **Owner:** TBD · **Target version:** 1.32.0 (Phase 1)

---

## 1. Why this matters

PACify is feature-complete for *managing* proxies, but the **first-run
experience for a switcher** is a wall: they must recreate every profile, rule,
and PAC script by hand. The single biggest adoption blocker for a new proxy
manager is the cost of migrating an existing setup. Competing tools have large
installed bases (SwitchyOmega alone had millions of users before its MV2
sunset), and those users are *actively looking to migrate* because of
Manifest V3 deprecation. PACify is MV3-native and well placed to capture them —
**if** moving over is frictionless.

This plan adds a first-class **Import** capability that reads the native backup
formats of the major competitors and maps them onto PACify's existing data
model.

### Success criteria

- A SwitchyOmega user can export their `.bak` and have all `FixedProfile`,
  `PacProfile`, `SwitchProfile`, and `RuleListProfile` entries land in PACify as
  working proxy configs + Auto-Proxy rules, in one import.
- No data loss without telling the user (unsupported constructs are surfaced in
  an import report, never silently dropped).
- Import is **additive and reversible** — it never clobbers existing configs
  without explicit user choice, and an automatic pre-import backup is taken.
- Works fully offline / locally — consistent with PACify's "no external
  requests, no tracking" privacy promise.

---

## 2. Current state (what we build on)

The codebase already gives us most of the primitives:

| Existing asset | Location | Reuse for migration |
| --- | --- | --- |
| `ProxyConfig` / `ProxyRules` / `ProxyServer` model | `src/interfaces/settings.ts` | Target shape for `FixedProfile`/manual proxies |
| `AutoProxyConfig` / `AutoProxyRule` (`wildcard`/`regex`/`exact`/`cidr`) | `src/interfaces/settings.ts` | Target shape for `SwitchProfile` switch rules |
| `SubscriptionParser` (ABP / Surge / Clash / domain / hosts, base64, AutoProxy) | `src/services/SubscriptionParser.ts` | Reuse to parse `RuleListProfile` rule text and gfwlist-style lists |
| `SettingsWriter.restoreSettings` (size limit, JSON validation, per-config checks) | `src/services/SettingsWriter.ts` | Pattern to follow for safe ingest; add a pre-import auto-backup hook |
| `BackupRestore.svelte` + `SettingsTab` "Data Management" section | `src/components/`, `src/options/SettingsTab.svelte` | Natural home for an "Import from another extension" card |
| `OnboardingModal` | `src/components/Onboarding/` | Add a migration step for new installs |
| i18n framework (12 locales) | `_locales/`, `I18nService` | All new copy must be keyed |

> **Note:** "migration" already exists in the code (`StorageService.migrateStorage`)
> but only refers to PACify's *internal* storage-schema upgrades. This plan is
> about *cross-application* import and should use a distinct namespace
> (`import` / `Importer`) to avoid confusion.

There is currently **no** importer for any third-party format. `restoreSettings`
only accepts PACify's own backup JSON.

---

## 3. Source formats to support

Ranked by user impact. Phase 1 targets the first two.

### 3.1 Proxy SwitchyOmega / ZeroOmega (highest priority)

Exports a JSON `.bak` file. Options are a flat object; **profiles are stored
under keys prefixed with `+`** (e.g. `"+proxy"`, `"+work switch"`). Each profile
has a `profileType`:

| SwitchyOmega `profileType` | PACify target |
| --- | --- |
| `FixedProfile` | `ProxyConfig{ mode: 'fixed_servers', rules }` — map `fallbackProxy` + `proxyForHttp/Https/Ftp` → `ProxyRules`; `bypassList[]` (`BypassCondition.pattern`) → `rules.bypassList` |
| `PacProfile` | `ProxyConfig{ mode: 'pac_script', pacScript: { url } or { data } }` (`pacUrl` → url, `pacScript` → data) |
| `SwitchProfile` | `ProxyConfig{ mode: 'fixed_servers'/'pac_script', autoProxy }` — `rules[]` → `AutoProxyRule[]`, `defaultProfileName` → `autoProxy.fallback*` |
| `RuleListProfile` | An `AutoProxySubscription` (when `sourceUrl` present) **or** inline rules parsed via `SubscriptionParser` from `ruleList` text (AutoProxy/Switchy format) |
| `VirtualProfile` | Resolve to its underlying profile; note in report if unresolved |
| `DirectProfile` / built-in `direct` | `mode: 'direct'` |
| `SystemProfile` / `system` | `mode: 'system'` |
| `AutoDetect` | `mode: 'auto_detect'` |

**Condition-type mapping** (`SwitchProfile.rules[].condition.conditionType`):

| SwitchyOmega condition | `AutoProxyRule.matchType` + transform |
| --- | --- |
| `HostWildcardCondition` | `wildcard` (pattern as-is, e.g. `*.example.com`) |
| `HostRegexCondition` / `UrlRegexCondition` | `regex` |
| `UrlWildcardCondition` | `wildcard` (strip scheme/path → host pattern where possible; else keep as URL wildcard, flag in report) |
| `KeywordCondition` | `wildcard` `*keyword*` (PACify has no keyword type; document the approximation) |
| `IpCondition` | `cidr` |
| `HostLevelsCondition`, `WeekdayCondition`, `TimeCondition`, `FalseCondition` | **Unsupported** → list in import report, skip |

Proxy server objects in SwitchyOmega look like
`{ scheme, host, port }` (+ auth via separate `auth` map) and map directly to
`ProxyServer{ scheme, host, port, username?, password? }`.

### 3.2 FoxyProxy (high priority)

Two schema generations exist; detect by shape:

- **FoxyProxy Standard 7.x+**: JSON with a top-level array (or `{ proxies: [...] }`)
  of objects: `{ title, type (http/https/socks4/socks5), address, port,
  username, password, active, whitePatterns[], blackPatterns[] }`. Map each to a
  `ProxyConfig{ mode: 'fixed_servers' }`; patterns → an `AutoProxyConfig` when
  present.
- **Legacy FoxyProxy**: `{ settings: { proxies: { all: [...] } } }` with
  `manualconf` / `autoconf` and `matches[]`. Detect and adapt.

### 3.3 Chrome / native proxy settings & raw PAC (medium)

- Import a raw `.pac` file or PAC URL directly into a new `pac_script` config
  (essentially exposing today's PAC settings via the import flow).
- "Detect current Chrome proxy" → read `chrome.proxy.settings` and offer to
  capture it as a config (only when controllable by the extension).

### 3.4 Generic rule lists (low — mostly already done)

gfwlist / AutoProxy / Surge / Clash / hosts files already flow through
`SubscriptionParser`. Surface them in the unified import UI for discoverability.

---

## 4. Architecture

Keep it modular: one adapter per source format, a shared importer pipeline, and
a UI layer. Mirrors the existing static-service style.

```
src/services/import/
  ImportService.ts          # orchestrator: detect → parse → map → preview → commit
  types.ts                  # ImportSource, ImportResult, ImportReport, MappedEntity
  detectSource.ts           # sniff format from file/text content
  adapters/
    SwitchyOmegaAdapter.ts  # .bak JSON → MappedEntity[]
    FoxyProxyAdapter.ts     # FoxyProxy JSON (both generations) → MappedEntity[]
    PacFileAdapter.ts       # raw .pac / PAC URL → MappedEntity
    PacifyAdapter.ts        # wraps existing restoreSettings (unifies the UX)
  __tests__/
    SwitchyOmegaAdapter.test.ts
    FoxyProxyAdapter.test.ts
    detectSource.test.ts
    ImportService.test.ts
```

### Pipeline

1. **Detect** — `detectSource(textOrJson)` returns `'switchyomega' | 'foxyproxy'
   | 'pac' | 'pacify' | 'rulelist' | 'unknown'`. Heuristics: SwitchyOmega has
   `+`-prefixed keys + `schemaVersion`; FoxyProxy has `proxies`/`settings` with
   `type`+`address`; PACify backup has `proxyConfigs` array + `quickSwitchEnabled`.
2. **Parse + map** — chosen adapter produces:
   - `proxyConfigs: ProxyConfig[]` (with fresh `crypto.randomUUID()` ids)
   - `subscriptions` to attach to Auto-Proxy configs
   - an **`ImportReport`**: counts, name remaps, and `warnings[]` /
     `skipped[]` for unsupported constructs.
3. **Reconcile references** — SwitchyOmega rules reference profiles *by name*.
   Resolve those names to the freshly-generated PACify ids; flag dangling refs.
4. **Preview** — show the report and a list of what will be created, with a
   merge-strategy choice (see §5).
5. **Commit** — take an automatic pre-import backup (reuse `backupSettings`
   logic), then merge into settings via `SettingsWriter`, de-duplicating names
   (`Work` → `Work (imported)` / `Work (2)`).

### Design principles

- **Pure, testable mappers.** Adapters are pure functions
  (`string → { configs, report }`) with no Chrome/DOM dependency, so they run
  under `bun test` exactly like `SubscriptionParser.test.ts`.
- **Reuse `SubscriptionParser`** for any embedded rule-list text rather than
  re-implementing ABP/Surge parsing.
- **Validate on the way in.** Run mapped configs through the same structural
  checks `restoreSettings` uses before persisting. Enforce the existing 1 MB
  file-size cap (SwitchyOmega backups with large rule lists can approach this —
  consider raising to ~4 MB *for import only*, with justification).
- **Never trust imported strings in PAC context.** Reuse
  `SubscriptionParser.isValidDomain`-style sanitisation (rejects
  `"' \ < > backtick`) for any pattern that ends up interpolated into a generated
  PAC script, to preserve the existing injection guarantees.

---

## 5. UX / UI

### 5.1 Import entry points

1. **Settings → Data Management**: new "Import from another extension" card
   beside Backup/Restore in `BackupRestore.svelte` (rename the section concept
   to Backup / Restore / Import, or add a third card).
2. **Onboarding**: a "Coming from another proxy manager?" step in
   `OnboardingModal` that deep-links to the import wizard — this is where most
   migrators will land.
3. **Empty state**: when `proxyConfigs.length === 0`, the All-Proxies empty view
   gets an "Import existing setup" call-to-action.

### 5.2 Import wizard (modal, mirrors `AutoProxyModal` patterns)

1. **Source step** — pick source (SwitchyOmega / FoxyProxy / PAC file / PACify
   backup), or just "drop a file and we'll detect it". Each option shows a
   one-line "how to export from <app>" hint with a help link.
2. **Upload step** — file drop (reuse `DropZone`) or paste-text area (important:
   lets users paste a `.bak`'s contents and covers bot-protected URLs, same
   rationale as the existing subscription paste fallback).
3. **Preview step** — table of detected entities (name, type, → PACify mode),
   the `ImportReport` warnings/skips, and a **merge strategy** selector:
   - *Add to my configs* (default, additive)
   - *Replace everything* (with an explicit confirm + the auto-backup reminder)
4. **Result step** — success toast + summary ("Imported 6 proxies, 24 rules; 2
   items skipped — see details"), then route to the Proxy Configs tab (the
   existing `onRestore` already switches tabs).

### 5.3 Reporting

The `ImportReport` must be human-readable and exportable (copy to clipboard) so
users can see exactly what didn't come over and fix it manually. This builds
trust and cuts support load.

---

## 6. Edge cases & decisions

- **Profile-name references** (SwitchyOmega switch rules → profile names):
  resolve to ids; unresolved → route to `direct` and warn.
- **Built-in profiles** (`direct`, `system`, `auto_detect`): map to modes, don't
  create duplicate configs.
- **Inline vs existing proxy in rules**: prefer `proxyType: 'existing'` linking
  to an imported config; fall back to `inline` when the source defined the proxy
  inline.
- **Auth credentials**: SwitchyOmega/FoxyProxy may carry usernames/passwords.
  Import them into `ProxyServer.username/password`, but **warn** the user that
  credentials are being stored (consistent with the existing
  `CredentialService` handling) and let them opt out.
- **Keyword conditions**: no native equivalent — approximate as `*keyword*`
  wildcard and flag.
- **Time/weekday conditions**: unsupported; skip + report.
- **Name collisions**: suffix-disambiguate; never overwrite silently in additive
  mode.
- **Malformed / partial files**: import what's valid, report the rest; never
  abort the whole import for one bad rule.

---

## 7. Security & privacy

- Stays 100% local — no network calls except optional, user-initiated fetch of a
  PAC/subscription URL (already a pattern in `SubscriptionParser.fetchAndParse`).
- Enforce/extend the file-size cap; guard against deeply-nested or huge JSON
  (DoS) before `JSON.parse`.
- Sanitise every imported pattern/domain that can reach generated PAC code.
- Take an automatic, restorable backup immediately before any write.
- No new permissions required — `storage` + existing `proxy` cover it. (Reading
  current Chrome proxy in §3.3 uses the already-granted `proxy` permission.)

---

## 8. Testing

- **Unit (`bun test`)**: one fixture-driven suite per adapter using *real
  exported* sample files (anonymised) committed under
  `src/services/import/__tests__/fixtures/`. Cover every `profileType`, every
  condition type, base64 rule lists, both FoxyProxy generations, and malformed
  input. Follow the structure of the existing `SubscriptionParser.test.ts`.
- **`detectSource` tests**: each format detected correctly; ambiguous/unknown
  handled.
- **Round-trip**: import a PACify backup through the unified flow == existing
  `restoreSettings` result.
- **E2E (Playwright)**: drive the wizard end-to-end (upload fixture → preview →
  commit → configs visible), extending `tests/e2e/comprehensive-flows.spec.ts`.
- **i18n**: all new keys present across the 12 locales (project requires 100%
  i18n compliance).

---

## 9. Phased delivery

| Phase | Scope | Status |
| --- | --- | --- |
| **0 — Foundation** | `import/` skeleton, `types.ts`, `detectSource`, `PacifyAdapter`, unified Import card in Settings, optional pre-import backup | ✅ Done |
| **1 — SwitchyOmega + FoxyProxy** | Both adapters, full condition mapping, wizard (upload/paste→preview→result), `ImportReport`, merge/replace strategies, unit tests | ✅ Done |
| **2 — PAC & native** | Raw `.pac` import ✅ (PAC-URL & "detect current Chrome proxy" pending); onboarding migration step, empty-state CTA | ◻ Partial / planned |
| **3 — Polish** | Export *to* SwitchyOmega/FoxyProxy/PAC (two-way), import report export, Chrome Web Store screenshots, README "Migrating to PACify" section ✅ | ◻ Planned |

> Implemented in this iteration: `src/services/import/` (`ImportService`,
> `detectSource`, and the SwitchyOmega/FoxyProxy/PAC/PACify adapters with shared
> mapping utils), `src/components/ImportModal.svelte`, the Import card in
> `BackupRestore.svelte`, en locale strings, and
> `src/services/import/__tests__/` (41 unit tests across detection, both major
> adapters, and the orchestrator).

**Recommendation:** ship Phases 0+1 together as **v1.32.0** — that's the version
that actually moves the adoption needle. Phases 2–3 follow incrementally.

---

## 10. Effort estimate (rough)

| Item | Size |
| --- | --- |
| `import/` scaffolding + types + detect + PacifyAdapter | S |
| SwitchyOmegaAdapter (+ tests + fixtures) | L (condition matrix is the bulk) |
| FoxyProxyAdapter (+ tests, two generations) | M |
| Import wizard UI (4 steps, reuses DropZone/modal patterns) | M |
| Merge/commit + auto-backup + report | S–M |
| i18n (12 locales) + docs | S |
| E2E | S |

No new runtime dependencies. No new Chrome permissions. Built with the existing
Svelte 5 / Bun / Biome / Playwright toolchain.

---

## 11. Open questions

1. Raise the import-only file-size cap above 1 MB for large rule lists? (Lean
   yes — ~4 MB, with nesting guards.)
2. Should credential import be **opt-in** by default? (Lean yes, for privacy.)
3. Do we want two-way **export** in scope now, or defer to Phase 3? (Defer.)
4. Bundle a small set of curated, known-good public rule-list presets to pair
   with the importer? (Nice-to-have; out of scope here.)
