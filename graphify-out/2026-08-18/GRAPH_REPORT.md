# Graph Report - pacify  (2026-08-18)

## Corpus Check
- 254 files · ~239,289 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1411 nodes · 2674 edges · 86 communities (71 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.81)
- Token cost: 434,941 input · 0 output

## Community Hubs (Navigation)
- Chrome Proxy Service & Import Adapters
- Background Service Worker
- E2E Playwright Suite
- Error Types & Diagnostics
- Tailwind Class Pattern Library
- Auto-Proxy Rule Model
- Dev Toolchain Dependencies
- Options & Popup Entry Points
- Browser API Abstraction Layer
- CodeMirror Editor Integration
- Credential Encryption Service
- MV3 Manifest Declaration
- Design System Primitives
- Package Scripts & Build Commands
- Import Modal Screenshot
- TypeScript Path References
- Popup Active State Screenshots
- Subscription & Backup Components
- Proxy Editor Modal Screenshot
- Auto-Proxy Tabbed Modal Screenshot
- CodeMirror Package Deps
- Editor Interfaces & Settings Reader
- Extension Icon Set
- Auto-Proxy UI Components
- Import Service & App Defaults
- Export Service & Exporters
- Auto-Proxy Style Variants
- Card, Tabs & Common UI
- Drag-Drop & Script Items
- Release & Publish Workflows
- Biome Accessibility Rules
- Chunked Storage Service
- Storage Service Tests
- Proxy Config Form Components
- Performance Monitoring Utils
- Biome Core Config
- Biome File Globs
- Dev Harness & Options Page
- Migration Plan Import Design
- Package Manifest & Overrides
- E2E Docs & UX Success Metrics
- Locale Parity & Changelog
- Proxy Utils & Defaults
- Biome Formatter Settings
- Settings Store Tests
- Theme Color Utilities
- Greenfield Design & Roadmap
- Biome Formatter Style Options
- Contributing & Dev Conventions
- TSConfig Node Project
- Toast Store & Link Cards
- E2E Fixtures & Test IDs
- CI & Dependabot Config
- Migration Plan Data Models
- README Architecture Overview
- PAC Script Validation Service
- SwitchyOmega Exporter
- i18n Locale Parity Test
- Auto-Proxy PAC Generation
- Popup Radio Navigation
- Settings Store & Debounce
- Test Setup & Chrome Mocks
- Product Brief & North Star
- CI Build & Bundle Budget
- Migration Import UX Flow
- Release-Please Config
- Single Activation Affordance
- Auth Permission Utils
- Personas & Central Tension
- Biome Import Organizer
- Biome CSS Parser
- Misc Shared Interfaces
- Modal Focus Trap
- Extension Smoke Test
- CodeMirror Autocomplete Dep
- Global Window Types
- Tailwind Merge Dep
- Tailwind Variants Dep
- README Notifications & Structure
- Missing ARIA Live Finding

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
- `Import Preview Trust Gate (✓/⚠/✕ + merge choice)` --semantically_similar_to--> `Migrating to PACify (SwitchyOmega / FoxyProxy / PAC import)`  [INFERRED] [semantically similar]
  ux-review/01-greenfield-design.md → README.md
- `Pre-commit Hooks (Biome autofix, type check on push)` --semantically_similar_to--> `CI job: Lint & Type Check (Biome, svelte-check, bun audit high)`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → .github/workflows/ci.yml
- `Load Unpacked Sideloading Workflow (chrome://extensions)` --conceptually_related_to--> `CI job: Build & Package`  [INFERRED]
  DEVELOPMENT.md → .github/workflows/ci.yml
- `PACify Project Structure (src/background, services, stores, views)` --conceptually_related_to--> `ImportService (detect -> parse -> map -> preview -> commit orchestrator)`  [INFERRED]
  CONTRIBUTING.md → MIGRATION_PLAN.md

## Import Cycles
- 3-file cycle: `src/services/NotificationService.ts -> src/services/StorageService.ts -> src/utils/errorHandling.ts -> src/services/NotificationService.ts`

## Hyperedges (group relationships)
- **Conventional-commit to Chrome Web Store release pipeline** — _github_workflows_pr_checks_pr_validation, _github_workflows_release_please_release_please_workflow, _github_workflows_release_create_release_workflow, _github_workflows_publish_cws_publish_workflow, changelog_pacify_changelog, _github_workflows_ci_version_sync_check [EXTRACTED 1.00]
- **Import adapters implementing the source-format mapping contract** — migration_plan_switchyomega_adapter, migration_plan_foxyproxy_adapter, migration_plan_pac_file_adapter, migration_plan_pacify_adapter, migration_plan_detect_source, migration_plan_import_service [EXTRACTED 1.00]
- **Layered quality gates: local hooks, PR checklist, CI jobs, scheduled audit** — contributing_precommit_hooks, contributing_code_review_checklist, _github_workflows_ci_checks_job, _github_workflows_ci_test_job, _github_workflows_ci_e2e_job, _github_workflows_audit_scheduled_security_audit [INFERRED 0.85]
- **Parallel-blind UX review: brief → greenfield + eval → roadmap → mockups → status** — ux_review_00_brief_product_brief, ux_review_01_greenfield_design_north_star, ux_review_02_heuristic_eval_evaluation, ux_review_03_roadmap_roadmap, ux_review_04_wave2_mockups_resolved_design, ux_review_05_wave3_status_status [EXTRACTED 1.00]
- **"Save & Turn On" from north-star idea to red-teamed state machine** — ux_review_01_greenfield_design_save_and_turn_on, ux_review_03_roadmap_item11_save_and_turn_on, ux_review_04_wave2_mockups_save_turn_on_state_machine, ux_review_mockups_wave2_editor_mockup, tests_e2e_readme_unit_fallback_for_auth [INFERRED 0.85]
- **Single-select activation model replacing radio-in-disguise toggles** — ux_review_02_heuristic_eval_e4_radio_in_disguise, ux_review_02_heuristic_eval_competing_affordances, ux_review_03_roadmap_item12_single_activation, ux_review_04_wave2_mockups_popup_radiogroup, ux_review_mockups_wave2_core_mockup, src_popup_popup_page [INFERRED 0.85]
- **Multi-resolution extension icon set (16/32/48/64/128) rendering one shield-lock mark** — icons_icon16_favicon_size_variant, icons_icon32_toolbar_size_variant, icons_icon48_management_page_variant, icons_icon64_hidpi_variant, icons_icon128_shield_lock_brand_mark [EXTRACTED 1.00]
- **Options screen composition: tabs + theme switcher + view toggle + add actions + config cards** — ux_review_gallery_01_options_proxies_light_options_page, ux_review_gallery_01_options_proxies_light_tab_navigation, ux_review_gallery_01_options_proxies_light_theme_switcher, ux_review_gallery_01_options_proxies_light_grid_list_view_toggle, ux_review_gallery_01_options_proxies_light_add_proxy_actions, ux_review_gallery_01_options_proxies_light_proxy_config_card [EXTRACTED 1.00]
- **Light/dark screenshot pair used as theme-parity UX review evidence** — ux_review_gallery_01_options_proxies_light_options_page, ux_review_gallery_02_options_proxies_dark_options_page, ux_review_gallery_02_options_proxies_dark_dark_theme_tokens, ux_review_gallery_02_options_proxies_dark_theme_parity_review [INFERRED 0.95]
- **Three-tab shell: Proxy Configs / Settings / Diagnostics share one persistent header with theme switcher** — ux_review_gallery_04_settings_light_globalheadernav, ux_review_gallery_04_settings_light_themeswitcher, ux_review_gallery_04_settings_light_settingspage, ux_review_gallery_05_diagnostics_light_diagnosticspage [EXTRACTED 1.00]
- **Shared modal editor pattern: colored accent bar + Basic Settings (name, counter, color) + type-specific body + sticky footer CTA** — ux_review_gallery_03_editor_save_and_turn_on_proxyconfigurationmodal, ux_review_gallery_03_editor_save_and_turn_on_basicsettingssection, ux_review_gallery_03_editor_save_and_turn_on_stickyfooteractions, ux_review_gallery_06_autoproxy_rule_editor_createautoproxymodal, ux_review_gallery_06_autoproxy_rule_editor_basicsettingssection, ux_review_gallery_06_autoproxy_rule_editor_disabledprimarycta [INFERRED 0.95]
- **Trust & transparency surface: version, storage quota, opt-in logging, and reassuring no-error empty state** — ux_review_gallery_05_diagnostics_light_statuscardrow, ux_review_gallery_05_diagnostics_light_storagequotapressure, ux_review_gallery_05_diagnostics_light_activitylogtoggle, ux_review_gallery_05_diagnostics_light_noerrorsemptystate [INFERRED 0.85]
- **Migration-from-competitor import flow** — ux_review_gallery_07_import_modal_choose_file, ux_review_gallery_07_import_modal_paste_textarea, ux_review_gallery_07_import_modal_detect_browser_proxy, ux_review_gallery_07_import_modal_format_autodetection, ux_review_gallery_07_import_modal_preview_action [EXTRACTED 1.00]
- **Popup active/inactive state contrast pair** — ux_review_gallery_09_popup_inactive_light_no_proxy_active_banner, ux_review_gallery_09_popup_inactive_light_direct_profile_selected, ux_review_gallery_10_popup_active_light_connected_banner, ux_review_gallery_10_popup_active_light_active_badge, ux_review_gallery_10_popup_active_light_state_feedback [INFERRED 0.95]
- **New-user onboarding surface: modal over dimmed options page with progress and escape hatch** — ux_review_gallery_08_onboarding_welcomestep, ux_review_gallery_08_onboarding_step_indicator, ux_review_gallery_08_onboarding_skip_tour, ux_review_gallery_08_onboarding_next_button, ux_review_gallery_07_import_modal_dimmed_backdrop [INFERRED 0.85]
- **Connection type selection drives which configuration fields appear** — ux_review_gallery_12_editor_connection_type_selector, ux_review_gallery_13_editor_connection_type_open_dropdown, ux_review_gallery_12_editor_connection_type_proxy_server_fields, ux_review_gallery_14_pac_source_inline_pac_editor, ux_review_gallery_12_editor_connection_type_progressive_disclosure [INFERRED 0.85]
- **Profile identity (name, color, active state) flows from editor to popup list** — ux_review_gallery_12_editor_connection_type_basic_settings, ux_review_gallery_11_popup_active_dark_color_dot, ux_review_gallery_11_popup_active_dark_profile_list, ux_review_gallery_11_popup_active_dark_active_badge, ux_review_gallery_12_editor_connection_type_footer_actions [INFERRED 0.75]
- **Sticky modal chrome clips scrolling content in multiple editor states** — ux_review_gallery_12_editor_connection_type_footer_actions, ux_review_gallery_13_editor_connection_type_open_dropdown_clipping, ux_review_gallery_14_pac_source_inline_scroll_clipping [INFERRED 0.75]
- **Wave 2 editor restructure: collapse two Add buttons and the 5-way jargon selector into one Add proxy that opens on the basic server form with an inline Connection type control** — ux_review_mockups_wave2_editor_beforetwoaddbuttons, ux_review_mockups_wave2_editor_beforeproxymodejargon, ux_review_mockups_wave2_editor_afterbasicserverdefault, ux_review_mockups_wave2_editor_connectiontypemenuopen, ux_review_mockups_wave2_core_editordefaultbasicserver, ux_review_mockups_wave2_core_connectiontypeselector [EXTRACTED 1.00]
- **Progressive disclosure contract: identity (name, color, badge) stays on the top row while networking jargon (SOCKS, per-protocol, bypass) moves behind More options** — ux_review_mockups_wave2_core_moreoptionsnetworking, ux_review_mockups_wave2_editor_moreoptionsdisclosure, ux_review_mockups_wave2_core_coloridentitythread, ux_review_gallery_15_autoproxy_tabbed_basicsettings, ux_review_gallery_15_autoproxy_tabbed_badgelabelpreview [INFERRED 0.85]
- **One-control cockpit: single-select radiogroup list where 'No proxy (direct)' is the off state, satisfying a11y and color-identity glance requirements without a master toggle** — ux_review_mockups_wave2_core_cockpitpopup, ux_review_mockups_wave2_core_noproxydirectoffstate, ux_review_mockups_wave2_core_a11yradiogroup, ux_review_mockups_wave2_core_coloridentitythread [EXTRACTED 1.00]

## Communities (86 total, 15 thin omitted)

### Community 0 - "Chrome Proxy Service & Import Adapters"
Cohesion: 0.05
Nodes (43): ChromeProxyConfig, ProxyMode, ProxyRules, ChromeService, FoxyPattern, FoxyProxyAdapter, FoxyProxyEntry, PacFileAdapter (+35 more)

### Community 1 - "Background Service Worker"
Cohesion: 0.06
Nodes (54): authAttempts, clearProxySettings(), fetchPacScript(), getActiveProxyCredentials(), getNextQuickScript(), handleActionClick(), handleAlarm(), handleAuthRequired() (+46 more)

### Community 2 - "E2E Playwright Suite"
Cohesion: 0.06
Nodes (34): open(), WCAG_TAGS, ElementInfo, getOptionsPage(), getPopupPage(), __dirname, __filename, getExtensionUrls() (+26 more)

### Community 3 - "Error Types & Diagnostics"
Cohesion: 0.06
Nodes (18): ALERT_TYPES, DiagnosticLogEntry, ERROR_TYPES, ErrorSeverity, MockChromeService, mockProxyConfig, mockStorage, DiagnosticsService (+10 more)

### Community 4 - "Tailwind Class Pattern Library"
Cohesion: 0.04
Nodes (50): absolutePositions, alertVariants, badgePatterns, badgeVariants, buttonVariants, cardVariants, checkboxLabelVariants, dragPatterns (+42 more)

### Community 5 - "Auto-Proxy Rule Model"
Cohesion: 0.11
Nodes (11): AutoProxyConfig, AutoProxyMatchType, AutoProxyRouteType, AutoProxyRule, AutoProxySubscription, ProxyServer, ResolvedRoute, proxy (+3 more)

### Community 6 - "Dev Toolchain Dependencies"
Cohesion: 0.05
Nodes (43): autoprefixer, axe-core, @axe-core/playwright, baseline-browser-mapping, @biomejs/biome, bun-types, husky, lint-staged (+35 more)

### Community 7 - "Options & Popup Entry Points"
Cohesion: 0.09
Nodes (27): onSave(), handleScriptDelete(), handleSetProxy(), toggleQuickSwitch(), I18nService, applyTheme(), createThemeStore(), initialize() (+19 more)

### Community 8 - "Browser API Abstraction Layer"
Cohesion: 0.06
Nodes (15): ActionAPI, BrowserAPI, MessageSender, NotificationAPI, NotificationButton, NotificationOptions, ProxyAPI, ProxySettings (+7 more)

### Community 9 - "CodeMirror Editor Integration"
Cohesion: 0.08
Nodes (18): CodeMirrorError, CodeMirrorOptions, CodeMirrorTheme, ICodeMirrorEditor, PACCompletionItem, CodeMirror, detectSystemTheme(), isBrowserContext() (+10 more)

### Community 10 - "Credential Encryption Service"
Cohesion: 0.09
Nodes (8): if(), CredentialService, StoredCredentials, ChildLogger, logger, LoggerService, FetchPacResponse, fetchPacViaBackground()

### Community 11 - "MV3 Manifest Declaration"
Cohesion: 0.06
Nodes (31): action, chrome_style, default_icon, default_popup, background, service_worker, type, 128 (+23 more)

### Community 12 - "Design System Primitives"
Cohesion: 0.07
Nodes (21): borderClasses, marginClasses, paddingClasses, BorderRadius, BorderStyle, borderStyles, BorderWidth, borderWidths (+13 more)

### Community 13 - "Package Scripts & Build Commands"
Cohesion: 0.07
Nodes (30): scripts, build, build:analyze, build:bun, check, check:biome, check:biome:fix, check:ci (+22 more)

### Community 14 - "Import Modal Screenshot"
Cohesion: 0.09
Nodes (30): Choose File Button, Detect Current Browser Proxy Button, Import Configurations Dialog, Dimmed Blurred Options Page Backdrop, Automatic Import Format Detection, FoxyProxy JSON Import Format, PAC Script Import Format, Paste Export Contents Textarea (+22 more)

### Community 15 - "TypeScript Path References"
Cohesion: 0.07
Nodes (26): bun-types, chrome, src/**/*.js, src/**/*.svelte, src/**/*.ts, @tsconfig/svelte/tsconfig.json, vite/client, compilerOptions (+18 more)

### Community 16 - "Popup Active State Screenshots"
Cohesion: 0.10
Nodes (27): Active Badge on Selected Profile, Per-Profile Color Dot Identifier, CONNECTED Status Banner, Dark Theme Not Rendered Despite Filename, Popup Header with Add and Settings Actions, PACify Popup (Active Profile, Dark Variant Capture), Proxy Profile List (Work VPN, Staging, Home Direct, No proxy), Basic Settings Card (Name, Char Counter, Color, Advanced) (+19 more)

### Community 18 - "Proxy Editor Modal Screenshot"
Cohesion: 0.10
Nodes (25): Authentication (Optional) and Bypass List (one pattern per line), Basic Settings Section (name, char counter 11/50, color swatch, Advanced disclosure), Proxy Configuration Modal, Proxy Mode Segmented Control (System / Direct / Auto-config URL / PAC Script / Manual Configuration), Proxy Server Fields (Scheme HTTP, Host proxy.office.example, Port 3128, same-proxy-for-all-protocols checkbox), Save-and-Activate in One Step (dual-CTA pattern), Sticky Footer Actions (Cancel / Save / Save & Turn On primary), SwitchyOmega / FoxyProxy / PAC file Interop (import & export formats) (+17 more)

### Community 19 - "Auto-Proxy Tabbed Modal Screenshot"
Cohesion: 0.12
Nodes (24): Badge Label field with 4-char toolbar icon preview, Basic Settings panel (name, color, active, badge label), Empty-state heading clipped by scroll container, Routing Rules empty state (0 rules, Add Rule CTA), Create Auto-Proxy Tabbed Modal (current UI screenshot), Four-tab strip: Rules / Rule lists / Default route / Test a URL, A11y decision: radiogroup, roving tabindex, aria-checked, check + color bar, Panel 4: Cockpit popup as one single-select radiogroup list (+16 more)

### Community 20 - "CodeMirror Package Deps"
Cohesion: 0.09
Nodes (23): codemirror, @codemirror/commands, @codemirror/lang-javascript, @codemirror/language, @codemirror/lint, @codemirror/state, @codemirror/theme-one-dark, @codemirror/view (+15 more)

### Community 21 - "Editor Interfaces & Settings Reader"
Cohesion: 0.22
Nodes (4): EditorOptions, FormState, ProxyConfig, SettingsWriter

### Community 22 - "Extension Icon Set"
Cohesion: 0.14
Nodes (19): Cyan-and-Yellow Flat Outline Palette, Chrome Web Store / Extension Detail Icon Size, Security and Privacy Visual Metaphor, PACify Shield-and-Padlock Brand Mark (128px), 16px Favicon / Toolbar Icon Variant, 32px Toolbar Action Icon Variant, 48px Extensions Management Page Icon Variant, 64px HiDPI Icon Variant (+11 more)

### Community 23 - "Auto-Proxy UI Components"
Cohesion: 0.19
Nodes (3): scriptTemplates, ProxyType, ViewMode

### Community 24 - "Import Service & App Defaults"
Cohesion: 0.25
Nodes (9): DEFAULT_SETTINGS, AppSettings, NOTE: We use spyOn (not mock.module) so we don't globally replace the, switchyOmegaBak, SettingsReader, StorageService, mockStorageService, mockSettingsReader (+1 more)

### Community 25 - "Export Service & Exporters"
Cohesion: 0.24
Nodes (8): ExportService, FoxyProxyExportEntry, FoxyProxyExporter, autoProxy, fixedProxy, settings, ExportArtifact, ExportFormat

### Community 26 - "Auto-Proxy Style Variants"
Cohesion: 0.20
Nodes (16): emptyStateCardVariants, formInputVariants, gradientIconBadgeVariants, gradientSectionVariants, matchTypeBadgeGradients, matchTypeBadgeVariants, modalBackdropVariants, modalContentVariants (+8 more)

### Community 27 - "Card, Tabs & Common UI"
Cohesion: 0.16
Nodes (3): TabItem, TabsContext, config()

### Community 29 - "Release & Publish Workflows"
Cohesion: 0.15
Nodes (16): Store Zip Packaging (source maps excluded), package.json <-> manifest.json Version Sync Check, PR Checks Workflow (conventional-commit PR title validation), Squash-Merge Title as the Conventional Commit Subject, Manual-Only Store Submission (human decision, not automated), Publish to Chrome Web Store Workflow (manual dispatch), Two-curl v2 REST upload + publish (no third-party CLI supports v2), CI/CD Pipeline (navbytes browser-extension shared shape) (+8 more)

### Community 30 - "Biome Accessibility Rules"
Cohesion: 0.14
Nodes (14): noLabelWithoutControl, useSemanticElements, useValidAriaRole, useValidAriaValues, noUnusedVariables, rules, a11y, correctness (+6 more)

### Community 31 - "Chunked Storage Service"
Cohesion: 0.26
Nodes (10): Settings, chunkKey(), estimateChunkedTotalBytes(), estimateStringItemBytes(), estimateSyncItemBytes(), isQuotaError(), jsonCharBytes(), SettingsMeta (+2 more)

### Community 32 - "Storage Service Tests"
Cohesion: 0.16
Nodes (9): chromeItemBytes(), createArea(), local, makeRule(), makeSettings(), MEASURED_CHROME_BYTES, readBack(), spies (+1 more)

### Community 33 - "Proxy Config Form Components"
Cohesion: 0.18
Nodes (5): {
  color = 'primary',
  minimal = false,
  hideType = 'hidden',
  icon = null,
  children,
  input,
}, handleBackdropClick(), handleClose(), handleKeydown(), labelButtonVariants

### Community 34 - "Performance Monitoring Utils"
Cohesion: 0.23
Nodes (4): ComponentWithLifecycle, measureComponent(), PerformanceEvent, PerformanceMonitor

### Community 35 - "Biome Core Config"
Cohesion: 0.17
Nodes (11): html, experimentalFullSupportEnabled, javascript, linter, enabled, overrides, $schema, vcs (+3 more)

### Community 36 - "Biome File Globs"
Cohesion: 0.17
Nodes (12): files, ignoreUnknown, includes, **, !**/app.css, !**/*.config.js, !**/*.config.ts, !**/dev (+4 more)

### Community 37 - "Dev Harness & Options Page"
Cohesion: 0.20
Nodes (12): Side-by-Side iFrame Dev Harness, Local-Only Privacy & Security Posture, Quick Switch Mode, Shared app.css Stylesheet Entry, Custom Drag Ghost Element (#drag-image), Options Page Shell (#app + #drag-image mount), Popup Page Shell, Privacy Policy Page Shell (+4 more)

### Community 38 - "Migration Plan Import Design"
Cohesion: 0.20
Nodes (12): Additive & Reversible Import (pre-import auto-backup, no silent clobber), Credential Import Opt-In (CredentialService warning), detectCurrentProxy (capture chrome.proxy.settings as a config), detectSource (format sniffing heuristics), ExportService (two-way export to PACify/SwitchyOmega/FoxyProxy), ImportModal Wizard (source -> upload -> preview -> result), ImportReport (warnings, skips, name remaps; exportable), ImportService (detect -> parse -> map -> preview -> commit orchestrator) (+4 more)

### Community 39 - "Package Manifest & Overrides"
Cohesion: 0.17
Nodes (11): lint-staged, *.{ts,svelte,js,json,css}, name, overrides, @codemirror/state, @codemirror/view, esbuild, postcss (+3 more)

### Community 40 - "E2E Docs & UX Success Metrics"
Cohesion: 0.17
Nodes (12): Manual Per-Protocol Proxy Configuration, Headless MV3 Testing Decision (--headless=new), traffic-routing.spec.ts (fixed-server real traffic), Unit-test fallback for un-automatable auth-permission path, Success Metrics (time-to-first-proxy, clicks-to-switch, jargon exposure), "Save & Turn On" — create and activate in one verb, E1 (sev 4) — Jargon wall in the mode selector, Item 11 — "Save & Turn On" (+4 more)

### Community 41 - "Locale Parity & Changelog"
Cohesion: 0.18
Nodes (11): localeParity.test.ts (locale parity asserted by unit suite), CI job: Unit Tests with Coverage, Release Notes Extraction from CHANGELOG.md (awk section slice), Accessibility: dynamic document lang/dir and prefers-reduced-motion, Full Localization Parity Across 12 Languages (553 strings), PACify Changelog (Keep a Changelog + SemVer), CSP and Minimal-Permissions Policy, PACify Migration & Onboarding Plan (+3 more)

### Community 42 - "Proxy Utils & Defaults"
Cohesion: 0.33
Nodes (9): ProxyScheme, ProxySettings, createDefaultProxyServer(), createDefaultProxySettings(), createEmptyProxyConfig(), formatBypassList(), formatProxyString(), parseProxyString() (+1 more)

### Community 43 - "Biome Formatter Settings"
Cohesion: 0.38
Nodes (10): formatter, formatter, enabled, formatWithErrors, indentStyle, indentWidth, lineEnding, lineWidth (+2 more)

### Community 44 - "Settings Store Tests"
Cohesion: 0.20
Nodes (6): settingsStore, generateSpy, mockChromeService, mockStorageService, NOTE: spyOn (restored in afterAll) is used deliberately instead of, sentMessages

### Community 45 - "Theme Color Utilities"
Cohesion: 0.20
Nodes (6): colors, radius, semantic, shadows, spacing, transitions

### Community 46 - "Greenfield Design & Roadmap"
Cohesion: 0.20
Nodes (10): Color Identity Threaded Into Toolbar Icon Badge, Conditionally-Visible Routing Nav Section, One Proxy Object, Three Zoom Levels, Item 10 — Unify Add Proxy + Add Auto-Proxy, Item 17 — Conditionally-visible Routing nav (validate), Item 18 — Toolbar icon shows active proxy color, Inline Connection Type Selector (no pre-screen gate), Red-Team Verdict Pass on Items 9–12 (+2 more)

### Community 47 - "Biome Formatter Style Options"
Cohesion: 0.22
Nodes (9): arrowParentheses, bracketSameLine, bracketSpacing, jsxQuoteStyle, quoteProperties, quoteStyle, semicolons, trailingCommas (+1 more)

### Community 48 - "Contributing & Dev Conventions"
Cohesion: 0.25
Nodes (9): Branch Strategy (main/develop/feature/fix/refactor/docs), Contributing to PACify, PACify Project Structure (src/background, services, stores, views), Svelte 5 Runes Component Convention ($props/$derived/$state), TypeScript Standard: no `any`, explicit interfaces, type imports, Design System Primitives and Tokens (Box/Flex/Button, spacing, colors), PACify Development Guide, Load Unpacked Sideloading Workflow (chrome://extensions) (+1 more)

### Community 49 - "TSConfig Node Project"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 51 - "E2E Fixtures & Test IDs"
Cohesion: 0.25
Nodes (9): Common data-testid Contract, PACify E2E Test Suite (Playwright, real built extension), launchExtension helper (helpers/extension-loader.ts), Non-loopback host-resolver-rule Trick, startProxyFixtures (origin + forward proxy servers), Persona P2 — Switcher, Wave 2 Core — Mockups, Red-Team & Resolved Build Plan, Identity Row split out of the networking drawer (+1 more)

### Community 52 - "CI & Dependabot Config"
Cohesion: 0.29
Nodes (8): Dependabot Configuration (weekly github-actions + bun updates), dev-dependencies Dependabot Group, Scheduled Security Audit Workflow (Mondays 06:00 UTC), CI job: Lint & Type Check (Biome, svelte-check, bun audit high), CI Workflow, Bun-First Toolchain Policy (project instructions), Pre-PR Code Review Checklist, Pre-commit Hooks (Biome autofix, type check on push)

### Community 53 - "Migration Plan Data Models"
Cohesion: 0.32
Nodes (8): Static Service Pattern (business logic in static classes), AutoProxyConfig / AutoProxyRule (wildcard, regex, exact, cidr), FoxyProxyAdapter (Standard 7.x+ and legacy generations), PAC-Context Sanitisation of Imported Patterns (injection guarantee), ProxyConfig / ProxyRules / ProxyServer data model, Design Principle: Pure, Testable Adapters (string -> {configs, report}), SubscriptionParser (ABP/Surge/Clash/hosts/AutoProxy rule-list parsing), SwitchyOmegaAdapter (.bak profile + condition mapping)

### Community 54 - "README Architecture Overview"
Cohesion: 0.25
Nodes (8): MV3 Chrome Extension Architecture, Chrome Permissions (proxy, storage, alarms, notifications), CodeMirror 6 PAC Script Editor, PACify — Chrome Proxy Configuration Manager, Technology Stack (Svelte 5, TS, Vite, Tailwind 4, Bun), Hard Constraints (popup size, MV3 modes, local-only, i18n, a11y), Level 0 Presets — job-named modes hiding chrome.proxy enums, E3 (sev 4) — Rule priority is drag-only (keyboard-inaccessible)

### Community 57 - "i18n Locale Parity Test"
Cohesion: 0.25
Nodes (6): allLocales, base, baseKeys, localesDir, Messages, otherLocales

### Community 58 - "Auto-Proxy PAC Generation"
Cohesion: 0.29
Nodes (7): Auto-Proxy (URL-based automatic routing), PAC Script Generation & Compilation, traffic-modes.spec.ts (PAC & Auto-Proxy real traffic), E2 (sev 4) — Auto-Proxy modal dumps ~9 clusters on one scroll, Item 15 — Stage the Auto-Proxy editor, Wave 3 — Depth Made Calm + Glance Bets (items 15–21), Out-of-Lockstep Risk (item 10 needs item 15)

### Community 60 - "Settings Store & Debounce"
Cohesion: 0.38
Nodes (3): createSettingsStore(), debounce(), throttle()

### Community 62 - "Product Brief & North Star"
Cohesion: 0.33
Nodes (7): Jobs To Be Done J1–J20, Pacify UX Review Product Brief, Complexity Gradient (Levels 0–3), Greenfield UX Design (North Star), E7 (sev 2) — Toolbar glanceability weak (J1), Heuristic Evaluation & Cognitive Walkthrough, UX Convergence & Roadmap

### Community 63 - "CI Build & Bundle Budget"
Cohesion: 0.33
Nodes (6): CI job: Build & Package, Bundle Size Budget (1MB per JS file, 10MB store zip), CHROME_PATH override for extension-loader (Chrome for Testing, not headless shell), CI job: E2E (Playwright against Chrome for Testing), Manifest Validation (MV3, required fields, default locale present), Lazy-Loaded CodeMirror PAC Editor (~488kB deferred)

### Community 64 - "Migration Import UX Flow"
Cohesion: 0.40
Nodes (6): Two-way Export (PACify / SwitchyOmega .bak / FoxyProxy JSON), Migrating to PACify (SwitchyOmega / FoxyProxy / PAC import), Persona P4 — Migrator, Import Preview Trust Gate (✓/⚠/✕ + merge choice), E5 (sev 3) — Restore silently overwrites beside safe Import, Wave 1 — De-jargon & Safety (items 1–8)

### Community 65 - "Release-Please Config"
Cohesion: 0.33
Nodes (5): include-component-in-tag, packages, release-type, $schema, skip-github-release

### Community 66 - "Single Activation Affordance"
Cohesion: 0.50
Nodes (5): Startup Sequencing (message queue, debounce, mutex), Competing Affordances Inventory (3 activation surfaces, 2 Add buttons), E4 (sev 3) — Popup toggles are radios in disguise, Item 12 — One canonical activation; popup reads as selection, Popup radiogroup with permanent "No proxy (direct)" row

### Community 68 - "Personas & Central Tension"
Cohesion: 0.40
Nodes (5): Central Tension — depth must not tax the simple case, Persona P1 — Toggler (80% case), Persona P3 — Router (power user), URL Tester with Decision Trace, Convergence Root Cause — simple paths inherit the full machinery

### Community 69 - "Biome Import Organizer"
Cohesion: 0.50
Nodes (4): source, assist, actions, organizeImports

### Community 70 - "Biome CSS Parser"
Cohesion: 0.50
Nodes (4): css, parser, cssModules, tailwindDirectives

### Community 71 - "Misc Shared Interfaces"
Cohesion: 0.50
Nodes (3): DebounceTimeout, DropItem, ListViewType

### Community 73 - "Modal Focus Trap"
Cohesion: 1.00
Nodes (3): modalFocus(), getFocusable(), handleKeydown()

## Ambiguous Edges - Review These
- `Startup Sequencing (message queue, debounce, mutex)` → `E4 (sev 3) — Popup toggles are radios in disguise`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Headless MV3 Testing Decision (--headless=new)` → `Save & Turn On State Machine (credential-permission correctness)`  [AMBIGUOUS]
  tests/e2e/README.md · relation: conceptually_related_to
- `16px Favicon / Toolbar Icon Variant` → `Security and Privacy Visual Metaphor`  [AMBIGUOUS]
  icons/icon16.png · relation: conceptually_related_to
- `Activity Log with Enable-logging toggle (off by default)` → `Reassuring Empty State ("No errors detected — Your proxies are working fine!")`  [AMBIGUOUS]
  ux-review/gallery/05-diagnostics-light.png · relation: conceptually_related_to
- `Import Configurations Modal Screenshot` → `Popup Header with Add and Settings Actions`  [AMBIGUOUS]
  ux-review/gallery/09-popup-inactive-light.png · relation: conceptually_related_to
- `PACify Popup (Active Profile, Dark Variant Capture)` → `Dark Theme Not Rendered Despite Filename`  [AMBIGUOUS]
  ux-review/gallery/11-popup-active-dark.png · relation: references
- `Basic Settings panel (name, color, active, badge label)` → `Panel 4: Cockpit popup as one single-select radiogroup list`  [AMBIGUOUS]
  ux-review/gallery/15-autoproxy-tabbed.png · relation: conceptually_related_to

## Knowledge Gaps
- **401 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+396 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Startup Sequencing (message queue, debounce, mutex)` and `E4 (sev 3) — Popup toggles are radios in disguise`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Headless MV3 Testing Decision (--headless=new)` and `Save & Turn On State Machine (credential-permission correctness)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `16px Favicon / Toolbar Icon Variant` and `Security and Privacy Visual Metaphor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Activity Log with Enable-logging toggle (off by default)` and `Reassuring Empty State ("No errors detected — Your proxies are working fine!")`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Import Configurations Modal Screenshot` and `Popup Header with Add and Settings Actions`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `PACify Popup (Active Profile, Dark Variant Capture)` and `Dark Theme Not Rendered Despite Filename`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Basic Settings panel (name, color, active, badge label)` and `Panel 4: Cockpit popup as one single-select radiogroup list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._