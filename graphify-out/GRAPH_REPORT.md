# Graph Report - pacify  (2026-08-18)

## Corpus Check
- 220 files · ~239,528 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1464 nodes · 2709 edges · 92 communities (77 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7ad83b97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SwitchyOmegaAdapter.ts
- background.ts
- proxy-fixtures.ts
- MockChromeService
- classPatterns.ts
- ProxyConfig
- devDependencies
- proxyModeHelpers.ts
- browser.ts
- CodeMirrorService.ts
- LoggerService
- manifest.json
- tokens.ts
- scripts
- Import Configurations Dialog
- compilerOptions
- Connection Type Dropdown (Expanded)
- i18nService.ts
- Proxy Configuration Modal
- Panel 4: Cockpit popup as one single-select radiogroup list
- dependencies
- .getSettings
- PACify Shield-and-Padlock Brand Mark (128px)
- 2. Per-surface findings
- AppSettings
- Pacify — Greenfield UX Design (North Star)
- autoProxy.ts
- Options.svelte
- CI/CD Pipeline (navbytes browser-extension shared shape)
- rules
- StorageService.ts
- StorageService.test.ts
- ProxyConfigModal.svelte
- PerformanceMonitor
- biome.json
- includes
- 🔄 Quick Switch Mode
- ImportService (detect -> parse -> map -> preview -> commit orchestrator)
- package.json
- ⚙️ Manual Proxy Configuration
- PACify Changelog (Keep a Changelog + SemVer)
- interfaces/index.ts
- formatter
- settingsStore.test.ts
- theme.ts
- PACify - Advanced Proxy Configuration Manager for Chrome
- formatter
- Contributing to PACify
- compilerOptions
- app.ts
- errorHandling.ts
- CI Workflow
- SwitchyOmegaAdapter (.bak profile + condition mapping)
- 🏗️ Technical Architecture
- ScriptService.ts
- DiagnosticsService
- localeParity.test.ts
- NotificationService
- Popup.svelte
- settingsStore.ts
- setup.ts
- Wave 2 core — mockups, red-team, and resolved build plan
- CI job: Build & Package
- NotificationService.ts
- release-please-config.json
- ✨ Key Features
- authPermissions.ts
- CredentialService
- source
- css
- misc.ts
- modalFocus
- extension-smoke.spec.ts
- E2E Testing for PACify Extension
- global.d.ts
- tailwind-merge
- tailwind-variants
- Pacify UX Review — Product Brief
- Pacify UX — Convergence & Roadmap
- 💻 Usage Guide
- LoggerService.ts
- 🔧 Configuration Options
- Wave 3 — status
- 🧪 Testing
- loglevel

## God Nodes (most connected - your core abstractions)
1. `ProxyConfig` - 57 edges
2. `PACScriptGenerator` - 33 edges
3. `scripts` - 30 edges
4. `AppSettings` - 29 edges
5. `ImportResult` - 18 edges
6. `ProxyServer` - 16 edges
7. `NotificationService` - 16 edges
8. `StorageService` - 16 edges
9. `compilerOptions` - 16 edges
10. `AutoProxyRule` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Pre-PR Code Review Checklist` --semantically_similar_to--> `CI Workflow`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → .github/workflows/ci.yml
- `PACify Project Structure (src/background, services, stores, views)` --conceptually_related_to--> `ImportService (detect -> parse -> map -> preview -> commit orchestrator)`  [INFERRED]
  CONTRIBUTING.md → MIGRATION_PLAN.md
- `Load Unpacked Sideloading Workflow (chrome://extensions)` --conceptually_related_to--> `CI job: Build & Package`  [INFERRED]
  DEVELOPMENT.md → .github/workflows/ci.yml
- `Pre-commit Hooks (Biome autofix, type check on push)` --semantically_similar_to--> `CI job: Lint & Type Check (Biome, svelte-check, bun audit high)`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → .github/workflows/ci.yml
- `Bun-First Toolchain Policy (project instructions)` --rationale_for--> `CI Workflow`  [INFERRED]
  CLAUDE.md → .github/workflows/ci.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multi-resolution extension icon set (16/32/48/64/128) rendering one shield-lock mark** — icons_icon16_favicon_size_variant, icons_icon32_toolbar_size_variant, icons_icon48_management_page_variant, icons_icon64_hidpi_variant, icons_icon128_shield_lock_brand_mark [EXTRACTED 1.00]
- **Import adapters implementing the source-format mapping contract** — migration_plan_switchyomega_adapter, migration_plan_foxyproxy_adapter, migration_plan_pac_file_adapter, migration_plan_pacify_adapter, migration_plan_detect_source, migration_plan_import_service [EXTRACTED 1.00]
- **Conventional-commit to Chrome Web Store release pipeline** — _github_workflows_pr_checks_pr_validation, _github_workflows_release_please_release_please_workflow, _github_workflows_release_create_release_workflow, _github_workflows_publish_cws_publish_workflow, changelog_pacify_changelog, _github_workflows_ci_version_sync_check [EXTRACTED 1.00]
- **Options screen composition: tabs + theme switcher + view toggle + add actions + config cards** — ux_review_gallery_01_options_proxies_light_options_page, ux_review_gallery_01_options_proxies_light_tab_navigation, ux_review_gallery_01_options_proxies_light_theme_switcher, ux_review_gallery_01_options_proxies_light_grid_list_view_toggle, ux_review_gallery_01_options_proxies_light_add_proxy_actions, ux_review_gallery_01_options_proxies_light_proxy_config_card [EXTRACTED 1.00]
- **Migration-from-competitor import flow** — ux_review_gallery_07_import_modal_choose_file, ux_review_gallery_07_import_modal_paste_textarea, ux_review_gallery_07_import_modal_detect_browser_proxy, ux_review_gallery_07_import_modal_format_autodetection, ux_review_gallery_07_import_modal_preview_action [EXTRACTED 1.00]
- **One-control cockpit: single-select radiogroup list where 'No proxy (direct)' is the off state, satisfying a11y and color-identity glance requirements without a master toggle** — ux_review_mockups_wave2_core_cockpitpopup, ux_review_mockups_wave2_core_noproxydirectoffstate, ux_review_mockups_wave2_core_a11yradiogroup, ux_review_mockups_wave2_core_coloridentitythread [EXTRACTED 1.00]
- **Three-tab shell: Proxy Configs / Settings / Diagnostics share one persistent header with theme switcher** — ux_review_gallery_04_settings_light_globalheadernav, ux_review_gallery_04_settings_light_themeswitcher, ux_review_gallery_04_settings_light_settingspage, ux_review_gallery_05_diagnostics_light_diagnosticspage [EXTRACTED 1.00]
- **Wave 2 editor restructure: collapse two Add buttons and the 5-way jargon selector into one Add proxy that opens on the basic server form with an inline Connection type control** — ux_review_mockups_wave2_editor_beforetwoaddbuttons, ux_review_mockups_wave2_editor_beforeproxymodejargon, ux_review_mockups_wave2_editor_afterbasicserverdefault, ux_review_mockups_wave2_editor_connectiontypemenuopen, ux_review_mockups_wave2_core_editordefaultbasicserver, ux_review_mockups_wave2_core_connectiontypeselector [EXTRACTED 1.00]
- **Profile identity (name, color, active state) flows from editor to popup list** — ux_review_gallery_12_editor_connection_type_basic_settings, ux_review_gallery_11_popup_active_dark_color_dot, ux_review_gallery_11_popup_active_dark_profile_list, ux_review_gallery_11_popup_active_dark_active_badge, ux_review_gallery_12_editor_connection_type_footer_actions [INFERRED 0.75]
- **Sticky modal chrome clips scrolling content in multiple editor states** — ux_review_gallery_12_editor_connection_type_footer_actions, ux_review_gallery_13_editor_connection_type_open_dropdown_clipping, ux_review_gallery_14_pac_source_inline_scroll_clipping [INFERRED 0.75]
- **Layered quality gates: local hooks, PR checklist, CI jobs, scheduled audit** — contributing_precommit_hooks, contributing_code_review_checklist, _github_workflows_ci_checks_job, _github_workflows_ci_test_job, _github_workflows_ci_e2e_job, _github_workflows_audit_scheduled_security_audit [INFERRED 0.85]
- **Connection type selection drives which configuration fields appear** — ux_review_gallery_12_editor_connection_type_selector, ux_review_gallery_13_editor_connection_type_open_dropdown, ux_review_gallery_12_editor_connection_type_proxy_server_fields, ux_review_gallery_14_pac_source_inline_pac_editor, ux_review_gallery_12_editor_connection_type_progressive_disclosure [INFERRED 0.85]
- **New-user onboarding surface: modal over dimmed options page with progress and escape hatch** — ux_review_gallery_08_onboarding_welcomestep, ux_review_gallery_08_onboarding_step_indicator, ux_review_gallery_08_onboarding_skip_tour, ux_review_gallery_08_onboarding_next_button, ux_review_gallery_07_import_modal_dimmed_backdrop [INFERRED 0.85]
- **Progressive disclosure contract: identity (name, color, badge) stays on the top row while networking jargon (SOCKS, per-protocol, bypass) moves behind More options** — ux_review_mockups_wave2_core_moreoptionsnetworking, ux_review_mockups_wave2_editor_moreoptionsdisclosure, ux_review_mockups_wave2_core_coloridentitythread, ux_review_gallery_15_autoproxy_tabbed_basicsettings, ux_review_gallery_15_autoproxy_tabbed_badgelabelpreview [INFERRED 0.85]
- **Trust & transparency surface: version, storage quota, opt-in logging, and reassuring no-error empty state** — ux_review_gallery_05_diagnostics_light_statuscardrow, ux_review_gallery_05_diagnostics_light_storagequotapressure, ux_review_gallery_05_diagnostics_light_activitylogtoggle, ux_review_gallery_05_diagnostics_light_noerrorsemptystate [INFERRED 0.85]
- **Light/dark screenshot pair used as theme-parity UX review evidence** — ux_review_gallery_01_options_proxies_light_options_page, ux_review_gallery_02_options_proxies_dark_options_page, ux_review_gallery_02_options_proxies_dark_dark_theme_tokens, ux_review_gallery_02_options_proxies_dark_theme_parity_review [INFERRED 0.95]
- **Popup active/inactive state contrast pair** — ux_review_gallery_09_popup_inactive_light_no_proxy_active_banner, ux_review_gallery_09_popup_inactive_light_direct_profile_selected, ux_review_gallery_10_popup_active_light_connected_banner, ux_review_gallery_10_popup_active_light_active_badge, ux_review_gallery_10_popup_active_light_state_feedback [INFERRED 0.95]
- **Shared modal editor pattern: colored accent bar + Basic Settings (name, counter, color) + type-specific body + sticky footer CTA** — ux_review_gallery_03_editor_save_and_turn_on_proxyconfigurationmodal, ux_review_gallery_03_editor_save_and_turn_on_basicsettingssection, ux_review_gallery_03_editor_save_and_turn_on_stickyfooteractions, ux_review_gallery_06_autoproxy_rule_editor_createautoproxymodal, ux_review_gallery_06_autoproxy_rule_editor_basicsettingssection, ux_review_gallery_06_autoproxy_rule_editor_disabledprimarycta [INFERRED 0.95]

## Communities (92 total, 15 thin omitted)

### Community 0 - "SwitchyOmegaAdapter.ts"
Cohesion: 0.05
Nodes (43): ProxyRules, SubscriptionFormat, FoxyPattern, FoxyProxyAdapter, FoxyProxyEntry, PacFileAdapter, PacifyAdapter, VALID_MODES (+35 more)

### Community 1 - "background.ts"
Cohesion: 0.10
Nodes (41): authAttempts, clearProxySettings(), fetchPacScript(), getActiveProxyCredentials(), getNextQuickScript(), handleActionClick(), handleAlarm(), handleAuthRequired() (+33 more)

### Community 2 - "proxy-fixtures.ts"
Cohesion: 0.06
Nodes (34): open(), WCAG_TAGS, ElementInfo, getOptionsPage(), getPopupPage(), __dirname, __filename, getExtensionUrls() (+26 more)

### Community 3 - "MockChromeService"
Cohesion: 0.14
Nodes (3): MockChromeService, mockProxyConfig, mockStorage

### Community 4 - "classPatterns.ts"
Cohesion: 0.04
Nodes (52): {
  color = 'primary',
  minimal = false,
  hideType = 'hidden',
  icon = null,
  children,
  input,
}, absolutePositions, alertVariants, badgePatterns, badgeVariants, buttonVariants, cardVariants, checkboxLabelVariants (+44 more)

### Community 5 - "ProxyConfig"
Cohesion: 0.06
Nodes (34): EditorOptions, FormState, AutoProxyConfig, AutoProxyMatchType, AutoProxyRouteType, AutoProxyRule, AutoProxySubscription, ProxyConfig (+26 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (43): autoprefixer, axe-core, @axe-core/playwright, baseline-browser-mapping, @biomejs/biome, bun-types, husky, lint-staged (+35 more)

### Community 7 - "proxyModeHelpers.ts"
Cohesion: 0.09
Nodes (29): if(), onSave(), handleScriptDelete(), handleSetProxy(), toggleQuickSwitch(), I18nService, applyTheme(), createThemeStore() (+21 more)

### Community 8 - "browser.ts"
Cohesion: 0.06
Nodes (15): ActionAPI, BrowserAPI, MessageSender, NotificationAPI, NotificationButton, NotificationOptions, ProxyAPI, ProxySettings (+7 more)

### Community 9 - "CodeMirrorService.ts"
Cohesion: 0.08
Nodes (18): CodeMirrorError, CodeMirrorOptions, CodeMirrorTheme, ICodeMirrorEditor, PACCompletionItem, CodeMirror, detectSystemTheme(), isBrowserContext() (+10 more)

### Community 11 - "manifest.json"
Cohesion: 0.06
Nodes (31): action, chrome_style, default_icon, default_popup, background, service_worker, type, 128 (+23 more)

### Community 12 - "tokens.ts"
Cohesion: 0.07
Nodes (21): borderClasses, marginClasses, paddingClasses, BorderRadius, BorderStyle, borderStyles, BorderWidth, borderWidths (+13 more)

### Community 13 - "scripts"
Cohesion: 0.07
Nodes (30): scripts, build, build:analyze, build:bun, check, check:biome, check:biome:fix, check:ci (+22 more)

### Community 14 - "Import Configurations Dialog"
Cohesion: 0.09
Nodes (30): Choose File Button, Detect Current Browser Proxy Button, Import Configurations Dialog, Dimmed Blurred Options Page Backdrop, Automatic Import Format Detection, FoxyProxy JSON Import Format, PAC Script Import Format, Paste Export Contents Textarea (+22 more)

### Community 15 - "compilerOptions"
Cohesion: 0.07
Nodes (26): bun-types, chrome, src/**/*.js, src/**/*.svelte, src/**/*.ts, @tsconfig/svelte/tsconfig.json, vite/client, compilerOptions (+18 more)

### Community 16 - "Connection Type Dropdown (Expanded)"
Cohesion: 0.10
Nodes (27): Active Badge on Selected Profile, Per-Profile Color Dot Identifier, CONNECTED Status Banner, Dark Theme Not Rendered Despite Filename, Popup Header with Add and Settings Actions, PACify Popup (Active Profile, Dark Variant Capture), Proxy Profile List (Work VPN, Staging, Home Direct, No proxy), Basic Settings Card (Name, Char Counter, Color, Advanced) (+19 more)

### Community 18 - "Proxy Configuration Modal"
Cohesion: 0.10
Nodes (25): Authentication (Optional) and Bypass List (one pattern per line), Basic Settings Section (name, char counter 11/50, color swatch, Advanced disclosure), Proxy Configuration Modal, Proxy Mode Segmented Control (System / Direct / Auto-config URL / PAC Script / Manual Configuration), Proxy Server Fields (Scheme HTTP, Host proxy.office.example, Port 3128, same-proxy-for-all-protocols checkbox), Save-and-Activate in One Step (dual-CTA pattern), Sticky Footer Actions (Cancel / Save / Save & Turn On primary), SwitchyOmega / FoxyProxy / PAC file Interop (import & export formats) (+17 more)

### Community 19 - "Panel 4: Cockpit popup as one single-select radiogroup list"
Cohesion: 0.12
Nodes (24): Badge Label field with 4-char toolbar icon preview, Basic Settings panel (name, color, active, badge label), Empty-state heading clipped by scroll container, Routing Rules empty state (0 rules, Add Rule CTA), Create Auto-Proxy Tabbed Modal (current UI screenshot), Four-tab strip: Rules / Rule lists / Default route / Test a URL, A11y decision: radiogroup, roving tabindex, aria-checked, check + color bar, Panel 4: Cockpit popup as one single-select radiogroup list (+16 more)

### Community 20 - "dependencies"
Cohesion: 0.09
Nodes (23): codemirror, @codemirror/autocomplete, @codemirror/commands, @codemirror/lang-javascript, @codemirror/language, @codemirror/lint, @codemirror/state, @codemirror/theme-one-dark (+15 more)

### Community 22 - "PACify Shield-and-Padlock Brand Mark (128px)"
Cohesion: 0.14
Nodes (19): Cyan-and-Yellow Flat Outline Palette, Chrome Web Store / Extension Detail Icon Size, Security and Privacy Visual Metaphor, PACify Shield-and-Padlock Brand Mark (128px), 16px Favicon / Toolbar Icon Variant, 32px Toolbar Action Icon Variant, 48px Extensions Management Page Icon Variant, 64px HiDPI Icon Variant (+11 more)

### Community 23 - "2. Per-surface findings"
Cohesion: 0.09
Nodes (22): 1. Executive summary — the biggest problems by severity, 2.1 Toolbar popup — `popup-with-proxies-light.png` / `-dark.png`, 2.2 Proxy Configs list — grid vs list — `options-proxyconfigs-light.png`, `options-proxyconfigs-listview-light.png`, 2.3 Proxy editor modal — `modal-proxy-manual-light.png`, `modal-proxy-pac-light.png`, 2.4 Auto-Proxy modal — rules / subscriptions / fallback — `modal-autoproxy-empty-light.png`, `modal-autoproxy-ruleeditor-light.png`, 2.5 Import / Export — `modal-import-light.png`, `modal-export-light.png`, 2.6 Onboarding — `onboarding-step1-light.png`, `onboarding-step3-light.png`, 2.7 Settings — `options-settings-light.png` (+14 more)

### Community 24 - "AppSettings"
Cohesion: 0.20
Nodes (8): AppSettings, NOTE: We use spyOn (not mock.module) so we don't globally replace the, switchyOmegaBak, SettingsReader, StorageService, mockStorageService, mockSettingsReader, mockStorageService

### Community 25 - "Pacify — Greenfield UX Design (North Star)"
Cohesion: 0.10
Nodes (20): 0. Design thesis, 1.1 The two surfaces and their contract, 1.2 Popup IA (top → bottom), 1.3 Options page IA (left nav, 6 sections), 1. Information Architecture, 2. The "a proxy" object model in the UI, 3.1 Three editor Levels (the proxy editor), 3.2 What's visible by DEFAULT vs ON DEMAND (+12 more)

### Community 26 - "autoProxy.ts"
Cohesion: 0.20
Nodes (16): emptyStateCardVariants, formInputVariants, gradientIconBadgeVariants, gradientSectionVariants, matchTypeBadgeGradients, matchTypeBadgeVariants, modalBackdropVariants, modalContentVariants (+8 more)

### Community 27 - "Options.svelte"
Cohesion: 0.16
Nodes (4): Toast, toastStore, FOCUSABLE_SELECTOR, config()

### Community 29 - "CI/CD Pipeline (navbytes browser-extension shared shape)"
Cohesion: 0.15
Nodes (16): Store Zip Packaging (source maps excluded), package.json <-> manifest.json Version Sync Check, PR Checks Workflow (conventional-commit PR title validation), Squash-Merge Title as the Conventional Commit Subject, Manual-Only Store Submission (human decision, not automated), Publish to Chrome Web Store Workflow (manual dispatch), Two-curl v2 REST upload + publish (no third-party CLI supports v2), CI/CD Pipeline (navbytes browser-extension shared shape) (+8 more)

### Community 30 - "rules"
Cohesion: 0.14
Nodes (14): noLabelWithoutControl, useSemanticElements, useValidAriaRole, useValidAriaValues, noUnusedVariables, rules, a11y, correctness (+6 more)

### Community 31 - "StorageService.ts"
Cohesion: 0.26
Nodes (10): Settings, chunkKey(), estimateChunkedTotalBytes(), estimateStringItemBytes(), estimateSyncItemBytes(), isQuotaError(), jsonCharBytes(), SettingsMeta (+2 more)

### Community 32 - "StorageService.test.ts"
Cohesion: 0.16
Nodes (9): chromeItemBytes(), createArea(), local, makeRule(), makeSettings(), MEASURED_CHROME_BYTES, readBack(), spies (+1 more)

### Community 33 - "ProxyConfigModal.svelte"
Cohesion: 0.14
Nodes (5): handleBackdropClick(), handleClose(), handleKeydown(), TabItem, TabsContext

### Community 34 - "PerformanceMonitor"
Cohesion: 0.23
Nodes (4): ComponentWithLifecycle, measureComponent(), PerformanceEvent, PerformanceMonitor

### Community 35 - "biome.json"
Cohesion: 0.17
Nodes (11): html, experimentalFullSupportEnabled, javascript, linter, enabled, overrides, $schema, vcs (+3 more)

### Community 36 - "includes"
Cohesion: 0.17
Nodes (12): files, ignoreUnknown, includes, **, !**/app.css, !**/*.config.js, !**/*.config.ts, !**/dev (+4 more)

### Community 37 - "🔄 Quick Switch Mode"
Cohesion: 0.32
Nodes (8): Side-by-Side iFrame Dev Harness, 🔒 Privacy & Security, 🔄 Quick Switch Mode, Shared app.css Stylesheet Entry, Custom Drag Ghost Element (#drag-image), Options Page Shell (#app + #drag-image mount), Popup Page Shell, Privacy Policy Page Shell

### Community 38 - "ImportService (detect -> parse -> map -> preview -> commit orchestrator)"
Cohesion: 0.20
Nodes (12): Additive & Reversible Import (pre-import auto-backup, no silent clobber), Credential Import Opt-In (CredentialService warning), detectCurrentProxy (capture chrome.proxy.settings as a config), detectSource (format sniffing heuristics), ExportService (two-way export to PACify/SwitchyOmega/FoxyProxy), ImportModal Wizard (source -> upload -> preview -> result), ImportReport (warnings, skips, name remaps; exportable), ImportService (detect -> parse -> map -> preview -> commit orchestrator) (+4 more)

### Community 39 - "package.json"
Cohesion: 0.17
Nodes (11): lint-staged, *.{ts,svelte,js,json,css}, name, overrides, @codemirror/state, @codemirror/view, esbuild, postcss (+3 more)

### Community 40 - "⚙️ Manual Proxy Configuration"
Cohesion: 0.50
Nodes (4): ⚙️ Manual Proxy Configuration, Identity Row split out of the networking drawer, wave2-core.html — Wave 2 core mockup (rev 2), wave2-editor.html — before/after editor restructure mockup

### Community 41 - "PACify Changelog (Keep a Changelog + SemVer)"
Cohesion: 0.18
Nodes (11): localeParity.test.ts (locale parity asserted by unit suite), CI job: Unit Tests with Coverage, Release Notes Extraction from CHANGELOG.md (awk section slice), Accessibility: dynamic document lang/dir and prefers-reduced-motion, Full Localization Parity Across 12 Languages (553 strings), PACify Changelog (Keep a Changelog + SemVer), CSP and Minimal-Permissions Policy, PACify Migration & Onboarding Plan (+3 more)

### Community 42 - "interfaces/index.ts"
Cohesion: 0.24
Nodes (7): Languages, ChromeProxyConfig, detectCurrentProxy(), KNOWN_MODES, convertAppSettingsToChromeConfig(), encodePacDataUrl(), hasNonAscii()

### Community 43 - "formatter"
Cohesion: 0.38
Nodes (10): formatter, formatter, enabled, formatWithErrors, indentStyle, indentWidth, lineEnding, lineWidth (+2 more)

### Community 44 - "settingsStore.test.ts"
Cohesion: 0.20
Nodes (6): settingsStore, generateSpy, mockChromeService, mockStorageService, NOTE: spyOn (restored in afterAll) is used deliberately instead of, sentMessages

### Community 45 - "theme.ts"
Cohesion: 0.20
Nodes (6): colors, radius, semantic, shadows, spacing, transitions

### Community 46 - "PACify - Advanced Proxy Configuration Manager for Chrome"
Cohesion: 0.17
Nodes (11): 🌟 Acknowledgments, 📋 Chrome Permissions, 🤝 Contributing, Development Guidelines, Development Scripts, 🚀 Getting Started, Installation from Source, 📜 License (+3 more)

### Community 47 - "formatter"
Cohesion: 0.22
Nodes (9): arrowParentheses, bracketSameLine, bracketSpacing, jsxQuoteStyle, quoteProperties, quoteStyle, semicolons, trailingCommas (+1 more)

### Community 48 - "Contributing to PACify"
Cohesion: 0.25
Nodes (9): Branch Strategy (main/develop/feature/fix/refactor/docs), Contributing to PACify, PACify Project Structure (src/background, services, stores, views), Svelte 5 Runes Component Convention ($props/$derived/$state), TypeScript Standard: no `any`, explicit interfaces, type imports, Design System Primitives and Tokens (Box/Flex/Button, spacing, colors), PACify Development Guide, Load Unpacked Sideloading Workflow (chrome://extensions) (+1 more)

### Community 49 - "compilerOptions"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 50 - "app.ts"
Cohesion: 0.18
Nodes (7): DEFAULT_BADGE_COLOR, DEFAULT_BADGE_TEXT, DEFAULT_SETTINGS, dragDelim, POPUP_DISABLED, POPUP_ENABLED, TEST_URLS

### Community 51 - "errorHandling.ts"
Cohesion: 0.29
Nodes (7): ERROR_TYPES, ErrorHandler, PROXY_ERROR_PATTERNS, withErrorHandling(), withErrorHandlingAndFallback(), withRetry(), ComplexType

### Community 52 - "CI Workflow"
Cohesion: 0.29
Nodes (8): Dependabot Configuration (weekly github-actions + bun updates), dev-dependencies Dependabot Group, Scheduled Security Audit Workflow (Mondays 06:00 UTC), CI job: Lint & Type Check (Biome, svelte-check, bun audit high), CI Workflow, Bun-First Toolchain Policy (project instructions), Pre-PR Code Review Checklist, Pre-commit Hooks (Biome autofix, type check on push)

### Community 53 - "SwitchyOmegaAdapter (.bak profile + condition mapping)"
Cohesion: 0.32
Nodes (8): Static Service Pattern (business logic in static classes), AutoProxyConfig / AutoProxyRule (wildcard, regex, exact, cidr), FoxyProxyAdapter (Standard 7.x+ and legacy generations), PAC-Context Sanitisation of Imported Patterns (injection guarantee), ProxyConfig / ProxyRules / ProxyServer data model, Design Principle: Pure, Testable Adapters (string -> {configs, report}), SubscriptionParser (ABP/Surge/Clash/hosts/AutoProxy rule-list parsing), SwitchyOmegaAdapter (.bak profile + condition mapping)

### Community 54 - "🏗️ Technical Architecture"
Cohesion: 0.50
Nodes (4): Chrome Extension Architecture, Project Structure, 🏗️ Technical Architecture, Technology Stack

### Community 57 - "localeParity.test.ts"
Cohesion: 0.25
Nodes (6): allLocales, base, baseKeys, localesDir, Messages, otherLocales

### Community 60 - "settingsStore.ts"
Cohesion: 0.27
Nodes (4): ChromeService, createSettingsStore(), debounce(), throttle()

### Community 62 - "Wave 2 core — mockups, red-team, and resolved build plan"
Cohesion: 0.20
Nodes (9): Build plan & sequencing, Editor (items 9, 10), Items covered, Popup (item 12), Red-team verdicts (and what we changed), Resolved decisions, "Save & Turn On" state machine (item 11) — the correctness-critical part, Validation before merge (+1 more)

### Community 63 - "CI job: Build & Package"
Cohesion: 0.33
Nodes (6): CI job: Build & Package, Bundle Size Budget (1MB per JS file, 10MB store zip), CHROME_PATH override for extension-loader (Chrome for Testing, not headless shell), CI job: E2E (Playwright against Chrome for Testing), Manifest Validation (MV3, required fields, default locale present), Lazy-Loaded CodeMirror PAC Editor (~488kB deferred)

### Community 64 - "NotificationService.ts"
Cohesion: 0.33
Nodes (6): ALERT_TYPES, DiagnosticLogEntry, ErrorSeverity, NotificationContext, NotificationOptions, ToastType

### Community 65 - "release-please-config.json"
Cohesion: 0.33
Nodes (5): include-component-in-tag, packages, release-type, $schema, skip-github-release

### Community 66 - "✨ Key Features"
Cohesion: 0.18
Nodes (11): 🤖 Auto-Proxy (Automatic URL-Based Routing), 🎯 Comprehensive Proxy Support, 📊 Dashboard & Statistics, 💾 Data Management, 🌍 Internationalization, ✨ Key Features, 🔀 Migrating to PACify, 🔔 Notifications & Feedback (+3 more)

### Community 69 - "source"
Cohesion: 0.50
Nodes (4): source, assist, actions, organizeImports

### Community 70 - "css"
Cohesion: 0.50
Nodes (4): css, parser, cssModules, tailwindDirectives

### Community 71 - "misc.ts"
Cohesion: 0.50
Nodes (3): DebounceTimeout, DropItem, ListViewType

### Community 73 - "modalFocus"
Cohesion: 1.00
Nodes (3): modalFocus(), getFocusable(), handleKeydown()

### Community 75 - "E2E Testing for PACify Extension"
Cohesion: 0.25
Nodes (7): Chrome binary, Common data-testids, E2E Testing for PACify Extension, Headless works (modern Chrome), Running, Test files, Test helpers / fakes

### Community 79 - "Pacify UX Review — Product Brief"
Cohesion: 0.25
Nodes (7): 1. What Pacify is, 2. Personas, 3. Jobs to be done (requirements, not screens), 4. Hard constraints, 5. Success metrics (how we'll judge designs), 6. Out of scope for this review, Pacify UX Review — Product Brief

### Community 85 - "Pacify UX — Convergence & Roadmap"
Cohesion: 0.25
Nodes (7): 1. The convergence, 2. Scored diff, 3. Roadmap (waves), 4. What to cut or simplify (reduce surface area), 5. Risks & things to validate (honesty), 6. Recommended next step, Pacify UX — Convergence & Roadmap

### Community 86 - "💻 Usage Guide"
Cohesion: 0.29
Nodes (7): Backup & Restore, Creating Your First Proxy, Manual Proxy Setup, Setting Up Auto-Proxy (Automatic Routing), 💻 Usage Guide, Using Quick Switch, Writing PAC Scripts

### Community 87 - "LoggerService.ts"
Cohesion: 0.43
Nodes (3): StoredCredentials, logger, FetchPacResponse

### Community 88 - "🔧 Configuration Options"
Cohesion: 0.40
Nodes (5): App Settings, 🔧 Configuration Options, Manual Proxy Fields, PAC Script Fields, Proxy Configuration Fields

### Community 89 - "Wave 3 — status"
Cohesion: 0.50
Nodes (3): Net result across the whole initiative, Wave 3 — status, Why item 17 is deferred

### Community 90 - "🧪 Testing"
Cohesion: 0.67
Nodes (3): E2E Tests, 🧪 Testing, Unit Tests

## Ambiguous Edges - Review These
- `Import Configurations Modal Screenshot` → `Popup Header with Add and Settings Actions`  [AMBIGUOUS]
  ux-review/gallery/09-popup-inactive-light.png · relation: conceptually_related_to
- `Dark Theme Not Rendered Despite Filename` → `PACify Popup (Active Profile, Dark Variant Capture)`  [AMBIGUOUS]
  ux-review/gallery/11-popup-active-dark.png · relation: references
- `Activity Log with Enable-logging toggle (off by default)` → `Reassuring Empty State ("No errors detected — Your proxies are working fine!")`  [AMBIGUOUS]
  ux-review/gallery/05-diagnostics-light.png · relation: conceptually_related_to
- `Basic Settings panel (name, color, active, badge label)` → `Panel 4: Cockpit popup as one single-select radiogroup list`  [AMBIGUOUS]
  ux-review/gallery/15-autoproxy-tabbed.png · relation: conceptually_related_to
- `Security and Privacy Visual Metaphor` → `16px Favicon / Toolbar Icon Variant`  [AMBIGUOUS]
  icons/icon16.png · relation: conceptually_related_to

## Knowledge Gaps
- **479 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+474 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Import Configurations Modal Screenshot` and `Popup Header with Add and Settings Actions`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Dark Theme Not Rendered Despite Filename` and `PACify Popup (Active Profile, Dark Variant Capture)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Activity Log with Enable-logging toggle (off by default)` and `Reassuring Empty State ("No errors detected — Your proxies are working fine!")`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Basic Settings panel (name, color, active, badge label)` and `Panel 4: Cockpit popup as one single-select radiogroup list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Security and Privacy Visual Metaphor` and `16px Favicon / Toolbar Icon Variant`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `ProxyConfig` connect `ProxyConfig` to `SwitchyOmegaAdapter.ts`, `background.ts`, `StorageService.test.ts`, `proxyModeHelpers.ts`, `interfaces/index.ts`, `settingsStore.test.ts`, `app.ts`, `.getSettings`, `AppSettings`, `settingsStore.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `PACScriptGenerator` connect `ProxyConfig` to `background.ts`, `settingsStore.ts`, `settingsStore.test.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._