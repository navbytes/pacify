# Pacify — Heuristic Evaluation & Cognitive Walkthrough

**Method.** Nielsen's 10 heuristics, severity 0–4 (0 = no problem, 1 = cosmetic,
2 = minor, 3 = major, 4 = catastrophic). Every finding cites a screenshot in
`/tmp/ux-shots/` and/or a `src` `file:line`. A cognitive walkthrough follows for
the five key journeys, then a dedicated complexity/cognitive-load lens, then
accessibility/i18n spot-checks, then quick wins vs. structural issues.

Evidence base: all 17 rendered screenshots, plus the Svelte 5 implementation
(`Popup.svelte`, `ProxyConfigsTab.svelte`, `ScriptItem.svelte`, the
`ProxyConfig/*`, `AutoProxy/*`, `ImportModal`, `ExportModal`, `Onboarding/*`,
`SettingsTab`, `DiagnosticsTab` components).

Personas & jobs are taken from `00-brief.md`. The central tension the brief sets
up — **P1/P2 want radical simplicity; P3 needs depth, and depth must not tax the
simple case** — is the lens for the whole review.

---

## 1. Executive summary — the biggest problems by severity

| # | Severity | Heuristic | Problem | Evidence |
|---|----------|-----------|---------|----------|
| **E1** | **4** | Match between system & real world; Recognition not recall | **Jargon is unavoidable for P1.** The first thing a brand-new user sees on every proxy card is a mode chip reading "Manual Configuration", "PAC Script", "Direct", "System" (`options-proxyconfigs-light.png`), and the proxy editor's mode selector forces a choice between *System / Direct / Auto-config URL / PAC Script / Manual Configuration* before any host/port (`modal-proxy-manual-light.png`, `ProxyModeSelector.svelte:15-21`). The 80% "Toggler" must parse five protocol concepts to create one server. Brief success metric "P1/P2 complete their jobs without ever seeing PAC/per-protocol terminology" is violated on the create path. |
| **E2** | **4** | Flexibility & efficiency; Aesthetic & minimalist design | **The Auto-Proxy modal collapses ~9 concept clusters onto one scroll with no progressive disclosure.** Rules list + Subscriptions + Fallback + Pattern Tester all render at once (`AutoProxyModal.svelte:438-466`), and adding *one* rule exposes 8–12 controls including a 4-way match-type grid (Wildcard/Exact/Regex/CIDR) and a 3-mode/6-field proxy selector (`AutoProxyRuleEditor.svelte`, `modal-autoproxy-ruleeditor-light.png`). Even P3 will hesitate; nothing is staged. |
| **E3** | **4** | Accessibility (keyboard operability) — brief hard constraint | **Rule priority can only be changed by mouse drag.** Reordering uses native HTML5 drag only with no keyboard/SR alternative (`AutoProxyRuleList.svelte` drag handlers; handle is a non-focusable `div`). Priority is "first match wins," so keyboard-only users literally cannot author a correct rule set. The brief requires "keyboard operable." |
| **E4** | **3** | Match real world; Consistency & standards | **Popup toggles look like independent on/off switches but behave as radio buttons.** `settingsStore.setProxy` deactivates all other proxies when one is enabled (`settingsStore.ts:300`), yet the popup renders four equal toggle switches (`popup-with-proxies-light.png`). A user enabling "Home Direct" while "Work HTTP" is on has no signal that Work HTTP just turned itself off. Mental model ("toggle this one") fights the behavior ("switch the active one"). |
| **E5** | **3** | Consistency & standards; Error prevention | **Two parallel, unexplained data-loss paths.** Settings has both *Restore* (immediate overwrite, **no preview**, `BackupRestore.svelte:42`) and *Import* (safe, previewed, warnings, backup-nudge — `ImportModal.svelte`). They sit one row apart under "Local Backup" vs "Import & Export" (`options-settings-light.png`) with no explanation that Restore destroys current settings silently while Import is safe. |
| **E6** | **3** | Recognition not recall; Aesthetic & minimalist | **Quick Switch is a hidden, drag-only concept dropped on the first screen.** The options page opens with a large empty "Quick Switch Configs — Drag proxies here" dropzone (`options-proxyconfigs-light.png`) that means nothing to a new user, requires drag to populate, and duplicates the per-card "Pin to Quick Switch" lightning button (`ScriptItem.svelte:347-369`). Two competing affordances for one concept; the empty zone is pure noise for P1. |
| **E7** | **2** | Visibility of system status | **Toolbar glanceability is weak (J1).** The popup footer says "No proxy active" with a grey dot at the bottom (`popup-with-proxies-light.png`), but the brief's #1 job is reading active state *from the toolbar icon* in <1s. Active status is buried below the fold of a four-card list, and badge identity is an afterthought (Badge Label is an "Optional" field in the editor). |
| **E8** | **2** | Help & documentation; Error prevention | **No `aria-live` on any validation, warning, or test-result region** across the proxy editor, auto-proxy editor, subscriptions, pattern tester, and import (confirmed across all of `AutoProxy/*`, `ProxyConfigModal.svelte:426`, `ImportModal.svelte:312/413`). Errors scroll into view visually but are silent to screen readers, and the editor's Save error renders at the very bottom, far from the offending Name field at the top (`ProxyConfigModal.svelte:141-148`). |

---

## 2. Per-surface findings

### 2.1 Toolbar popup — `popup-with-proxies-light.png` / `-dark.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Match real world / Consistency | 3 | Toggles are radio-in-disguise (see E4). Enabling one silently disables the active one; no transition feedback in the popup itself. | `settingsStore.ts:300`; `ScriptItem.svelte:292-299` |
| Visibility of status | 2 | Active state lives in a footer line ("No proxy active") under the list, not at the top; with 4+ proxies the active one can be scrolled off. Footer also keeps an **invisible placeholder Off button** to avoid layout shift (`Popup.svelte:124-132`) — fine, but it means the action area is empty/ambiguous when nothing is active. | `Popup.svelte:92-137` |
| Recognition not recall | 2 | Each card shows a small mode glyph (wrench, lightning, doc, monitor) with **no text label** in the popup (`ScriptItem.svelte:240-242`). P2 must memorize that "doc = PAC". Color + name are the only reliable differentiators, and color is the user's own choice (may be unset/similar). | `popup-with-proxies-light.png` |
| Flexibility & efficiency | 1 | Brief target "≤2 clicks to switch" is met (open popup → toggle), good. But there is no keyboard switching in the popup (number-key switching exists only on the options page, `ProxyConfigsTab.svelte:93-110`). | — |
| Aesthetic & minimalist | 1 | Popup is clean and within size budget. The header "+" (add) opens the full options page rather than an inline quick-add (`Popup.svelte:26-28`), a small context switch for the most common create. | — |

### 2.2 Proxy Configs list — grid vs list — `options-proxyconfigs-light.png`, `options-proxyconfigs-listview-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Consistency & standards | 3 | **The "list view" screenshot is byte-identical to the grid view** (`options-proxyconfigs-light.png` and `options-proxyconfigs-listview-light.png` are the same render). Either the view toggle does nothing visible in this state or the capture is wrong; either way the grid/list switcher (`ViewModeSwitcher`, two icon buttons top-right) gives no discoverable payoff. The two view modes are extra surface area serving no clear job. | both screenshots; `ScriptItem.svelte:335-467` (list vs grid branches exist in code but produce near-identical cards) |
| Match real world | 3 | Mode chips expose raw concepts to everyone: "Manual Configuration", "PAC Script", "Direct", "System" (see E1). For P1 these are noise at best, intimidating at worst. | `options-proxyconfigs-light.png` |
| Aesthetic & minimalist | 2 | Each card carries **6+ interactive elements**: color dot, name, mode chip, description, toggle, lightning (quick-switch), Edit, Delete (`ScriptItem.svelte:333-468`). With the always-present empty Quick-Switch panel above (E6) and the dual "Add Auto-Proxy" (orange) + "Add Proxy" (blue) CTAs, the top of the screen is dense. | `options-proxyconfigs-light.png` |
| Recognition not recall | 2 | Two prominent, differently-colored "Add" buttons — orange **Add Auto-Proxy** vs blue **Add Proxy** — force the user to know the difference between "a proxy" and "an auto-proxy" before they've made either. Auto-Proxy is really "a proxy in routing mode," so this splits one concept into two top-level entry points (competing affordances). | `options-proxyconfigs-light.png`; `ProxyConfigsTab.svelte:227-250` |
| Error prevention | 1 | Delete is a single click to a red "Delete" label (no destructive-affordance gating beyond the confirm dialog), but the confirm dialog does warn about Auto-Proxy references — good (`ScriptItem.svelte:88-114`). | — |

### 2.3 Proxy editor modal — `modal-proxy-manual-light.png`, `modal-proxy-pac-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Match real world | 4 | Mode selector is the gate to all configuration and is pure jargon for P1 (see E1). The most common job (J5: host + port) is buried *below* a five-way technical choice. | `ProxyModeSelector.svelte:15-21`; `modal-proxy-manual-light.png` |
| Aesthetic & minimalist | 2 | "Basic Settings" surfaces **Badge Label** with a live "Preview: SAM" chip and a "(max 4 characters)" helper (`modal-proxy-manual-light.png`) at the same altitude as the config name. A 4-char toolbar badge is a power cosmetic shown to first-time creators. Also an **Active** toggle sits in the editor (`BasicSettings`), competing with the list/popup toggles — three places to activate one proxy. | `modal-proxy-manual-light.png` |
| Recognition not recall | 2 | Manual mode immediately shows a **Scheme** dropdown (HTTP/HTTPS/SOCKS4/SOCKS5), "Use same proxy server for all protocols" checkbox, plus Authentication and Bypass List sections (`ManualProxyConfiguration.svelte:39-53`). SOCKS4/5 and "per-protocol" are exactly the terms the brief says P1 must never meet. | `modal-proxy-manual-light.png` |
| Consistency / Error prevention | 2 | PAC mode shows a URL field **and** an inline CodeMirror editor **and** template links (Empty/Basic/Advanced/Pro) simultaneously (`modal-proxy-pac-light.png`). Two sources of truth (URL vs pasted script) with no explanation of precedence; the save logic silently fetches the URL and overwrites the editor (`ProxyConfigModal.svelte:163-195`). | `modal-proxy-pac-light.png` |
| Error visibility (a11y) | 2 | Validation error ("Name is required") is rendered at the **bottom** of a long modal and scrolled into view, but focus is not moved to the field and the region is not `aria-live` (E8). | `ProxyConfigModal.svelte:141-148, 426-461` |
| Consistency | 1 | Title field "Configuration Name" with a `6/50` counter and required asterisk is clear; the modal scaffolding (focus trap, Escape, labelled dialog) is correctly implemented (`ProxyConfigModal.svelte:254-272`). | — |

### 2.4 Auto-Proxy modal — rules / subscriptions / fallback — `modal-autoproxy-empty-light.png`, `modal-autoproxy-ruleeditor-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Aesthetic & minimalist | 4 | Everything-at-once layout, ~9 concept clusters, no stepper (see E2). | `AutoProxyModal.svelte:438-466` |
| Accessibility (keyboard) | 4 | Drag-only rule reordering; priority unreachable by keyboard (see E3). | `AutoProxyRuleList.svelte` drag handlers |
| Match real world | 3 | Raw jargon is front-and-center: the rule editor shows a 2×2 grid of **Wildcard / Exact Match / Regex / CIDR** with literal example syntax (`^www\..*`, `192.168.0.0/16`) as card subtitles (`modal-autoproxy-ruleeditor-light.png`; `AutoProxyRuleEditor.svelte:139-165`). The "URL Pattern" label contradicts its own help text, which says it matches the **hostname** (`AutoProxyRuleEditor.svelte:227` vs `188`) — users will type full URLs and get silent mismatches. | `modal-autoproxy-ruleeditor-light.png` |
| Recognition not recall | 3 | Subscriptions expose a format dropdown of **Auto / ABP / Domains / Surge / Clash** with zero in-UI explanation (`SubscriptionList.svelte:297-303`). "ABP/Surge/Clash" are tool proper-nouns; a user cannot pick correctly. "Subscription" itself is ad-blocker jargon for "a remote rule URL." | `SubscriptionList.svelte:297-303` |
| Consistency & standards | 2 | The 3-mode + up-to-6-field **ProxySelector** ("Direct / Select Proxy / Define Inline") is re-rendered inside *every* rule, the fallback, and *every* subscription (`ProxySelector.svelte`), multiplying field count. "Define Inline" is developer jargon. | `AutoProxyRuleEditor.svelte:337-364`; `FallbackConfig.svelte:86-92` |
| Error prevention / Visibility | 2 | Save is silently disabled while a rule editor is open, with no explanation of why (`AutoProxyModal.svelte` save-disabled logic). Empty state shows **two** identical "Add Rule" CTAs (header + center, `modal-autoproxy-empty-light.png`). | `modal-autoproxy-empty-light.png` |
| Visibility / a11y | 2 | Pattern Tester result ("Pattern matches!" / "No pattern matches") and all subscription/rule errors are visual-only (color + icon), not `aria-live`; the tester's URL input has no label, only a placeholder (`PatternTester.svelte:139`). The tester is also hidden for subscription-only configs even though it could test them. | `PatternTester.svelte` |
| Match real world | 2 | The whole feature is "compiled to PAC under the hood" but is *named* Auto-Proxy (good), yet the toggle inversion bug in the rule list — `aria-label` announces "ruleDisabled" while the rule is enabled (`AutoProxyRuleList.svelte` toggle) — mislabels state to SR users. | `AutoProxyRuleList.svelte` |

> Note: `modal-autoproxy-subscriptions-light.png` and `modal-autoproxy-fallback-light.png` were not present in `/tmp/ux-shots/`; subscription/fallback findings are sourced from code (`SubscriptionList.svelte`, `FallbackConfig.svelte`).

### 2.5 Import / Export — `modal-import-light.png`, `modal-export-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Error prevention / Visibility (J15) | **0 (strength)** | Import is well designed: a true 3-step `input → preview → done` machine; nothing is written until an explicit Confirm; the preview shows detected source, proxy/rule counts, and a scrollable **warnings** block with a "Copy report" action; a pre-import **backup nudge**; and a post-import **Activate** handoff to a working proxy (`ImportModal.svelte:34, 142, 294-389, 446-453`). This satisfies J15 fully and should be the model for Restore. | `modal-import-light.png` |
| Match real world | 2 | The import entry assumes a technical artifact: file accept `.json,.bak,.pac`, a mono "paste SwitchyOmega .bak, FoxyProxy JSON, or a PAC script here" textarea (`modal-import-light.png`). For P4 this is on-model; "PAC" is unexplained jargon for the rest. | `modal-import-light.png` |
| Error prevention | 2 | The `replace` strategy is destructive but has no distinct inline warning beyond the generic backup nudge (`ImportModal.svelte:350-372`). A bare URL paste is classified as a "PAC" source (`detectSource.ts:41`), which can mislabel. | `ImportModal.svelte` |
| Security visibility | 0 (strength) | Export warns in amber when configs contain credentials that will be written in cleartext (`ExportModal.svelte:138-146`). Good. | `modal-export-light.png` |
| Match real world | 1 | Export format labels are brand names (PACify backup / SwitchyOmega .bak / FoxyProxy JSON) but each has a one-line description (`modal-export-light.png`) — acceptable. | `modal-export-light.png` |

### 2.6 Onboarding — `onboarding-step1-light.png`, `onboarding-step3-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Help & documentation (J17) | 2 | Five-step informational tour (Welcome → Features → Shortcuts → Migrate → Get Started, `OnboardingModal.svelte:32-128`). It **tells** rather than **does**: it never produces a working proxy, only hands off to the create/import modal at the end. Brief J17 wants the user to "reach a working proxy (or an import) quickly"; a tour that front-loads "Powerful Features" and "Keyboard Shortcuts" (step 3, `onboarding-step3-light.png`) before any value delays time-to-first-proxy. | `onboarding-step3-light.png` |
| Match real world | 2 | Step 2 advertises **"PAC Script Support — Use custom PAC scripts for advanced proxy configuration"** to brand-new users (`OnboardingModal.svelte:65-71`), exposing the exact jargon P1 should never see, before they've made anything. | `OnboardingModal.svelte:65-71` |
| Consistency | 1 | On the final step the dismiss button reads **"Skip Tour"** even though it completes the tour (`OnboardingModal.svelte:379`) — mislabeled at that point. | — |
| Accessibility | 1 | Arrow-key navigation and Escape work, dots are real buttons; but step transitions are not announced (`aria-live` absent) and the active dot lacks `aria-current` (`OnboardingModal.svelte`). | — |

### 2.7 Settings — `options-settings-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Consistency / Error prevention | 3 | Restore-without-preview sits beside safe Import (see E5). | `BackupRestore.svelte:42`; `options-settings-light.png` |
| Consistency & standards | 2 | Several user-facing strings are hardcoded English, not i18n keys: "Local Backup", "Save", "Import & Export", "Load", "Import", "Export" and their aria-labels (`BackupRestore.svelte:69, 97, 125, 152, 179, 208`). In 12 locales these stay English. | `BackupRestore.svelte` |
| Aesthetic & minimalist | 1 | The four behavior toggles are clear and well-labelled with helper text (Disable Proxy on Startup, Auto-reload page on switch, System Notifications, Show Quick Settings) (`options-settings-light.png`). Good. The "Show Quick Settings" toggle is the hidden control that makes the confusing empty Quick-Switch panel (E6) appear/disappear — but nothing connects the two for the user. | `options-settings-light.png` |

### 2.8 Diagnostics — `options-diagnostics-light.png`

| Heuristic | Sev | Finding | Evidence |
|-----------|-----|---------|----------|
| Visibility of status (J19) | 1 | Clean, scannable: Active Proxy / Configured Proxies / Storage Used / Version cards, plus an Activity Log with an enable toggle and a friendly "No errors detected" state (`options-diagnostics-light.png`). Solid for J19. | `options-diagnostics-light.png` |
| Match real world | 1 | "Storage Used 58 B / 0.0% of 10.00 MB" is engineer-facing trivia; harmless but low-value for the target users. Logging defaults off, so the most useful diagnostic (event history) is empty until the user knows to turn it on. | `options-diagnostics-light.png` |

---

## 3. Cognitive walkthroughs

For each journey: **Will the user know what to do? Will they see the control?
Will they understand the feedback?** Hesitation/guess/jargon points flagged.

### (a) P1 ("Toggler") creates and toggles their first basic proxy — J5, J2

1. Opens options (or onboarding) → clicks **Add Proxy** (blue). *OK — but must
   ignore the competing orange **Add Auto-Proxy**; first guess point: "which
   one is a normal proxy?"* (`options-proxyconfigs-light.png`).
2. Modal opens on **Basic Settings** with Name, Color, **Badge Label
   (Preview: SAM, max 4 chars)**, Active toggle. *Hesitation: badge label is an
   unfamiliar concept presented before they've entered a server*
   (`modal-proxy-manual-light.png`).
3. **Proxy Mode** row: must choose System / Direct / Auto-config URL / PAC
   Script / Manual Configuration. **Jargon wall.** P1 wants "type my server"
   and has to *infer* that "Manual Configuration" is it (`ProxyModeSelector.svelte:15-21`).
4. Picks Manual → meets **Scheme (HTTP/HTTPS/SOCKS4/SOCKS5)**, "Use same proxy
   for all protocols", Authentication, Bypass List. *More jargon (SOCKS,
   per-protocol, bypass) the brief says P1 must never see*
   (`ManualProxyConfiguration.svelte:39-53`).
5. Enters host + port, Save. Error (if name blank) appears at the **bottom** of
   the modal (`ProxyConfigModal.svelte:141-148`).
6. Back on the list, card shows mode chip "Manual Configuration" and a toggle.
   To turn it on they flip the card toggle — but there's *also* an Active toggle
   in the editor and a toggle in the popup. **Three activation surfaces** for one
   proxy (consistency hit).
   **Verdict:** likely **over the 60s target** and the "no jargon" metric is
   violated at steps 3–4.

### (b) P2 ("Switcher") switches the active proxy — J3

1. Clicks toolbar icon → popup with four toggles (`popup-with-proxies-light.png`).
2. Flips "Home Direct" on. **It works in ≤2 clicks (meets target).** But "Work
   HTTP" silently switches off with no animation/feedback in the popup; the only
   confirmation is the footer text changing to "Connected: Home Direct"
   (`Popup.svelte:96-106`). *Guess point: did I just turn two proxies on?* The
   radio-as-toggles model (E4) is the core friction.
3. Glanceability (J1/J4): differentiates by color + name only; mode glyphs are
   unlabelled (`ScriptItem.svelte:240-242`). Works if the user set distinct
   colors. **Mostly succeeds**, with the silent-deactivation caveat.

### (c) P3 ("Router") builds a URL-routing rule and tests a URL — J9, J11

1. Clicks orange **Add Auto-Proxy** → modal with name/color/badge, then an empty
   Rules section with **two** "Add Rule" buttons (`modal-autoproxy-empty-light.png`).
2. **Add Rule** → faces, in one card: **URL Pattern** (but help says
   *hostname* — contradiction, guess point), a 2×2 **Wildcard/Exact/Regex/CIDR**
   grid with raw syntax examples, then a **Direct/Select Proxy/Define Inline**
   selector that can expand to 6 fields, then Description, then Enabled
   (`modal-autoproxy-ruleeditor-light.png`; `AutoProxyRuleEditor.svelte`). Dense
   even for a power user; 8–12 controls for one rule.
3. Wants to reorder priority → **can only drag**; keyboard users stuck (E3). The
   priority number badge looks editable but isn't.
4. **Test a URL (J11):** Pattern Tester is below the fold; result is
   color-only, the input is unlabelled, no SR announcement (`PatternTester.svelte`).
   Functional for sighted mouse users; **fails keyboard/SR users and hides from
   subscription-only configs.**
   **Verdict:** depth exists and is mostly correct, but it taxes the user with
   simultaneous concepts and a drag-only critical control.

### (d) P4 ("Migrator") imports an existing setup — J15

1. Settings → **Import** (or the list empty-state "Import existing setup").
2. Choose file / detect current / paste. Format auto-detected
   (`detectSource.ts`).
3. **Preview** shows source + counts + warnings + Copy-report + backup nudge.
   **This is the best flow in the product.** No data written until Confirm; then
   an **Activate** button bridges to a working proxy
   (`ImportModal.svelte:294-453`). **Verdict: succeeds; near-exemplary.** Only
   snag: if the user instead picks **Restore** under "Local Backup," they get a
   silent overwrite with none of this safety (E5).

### (e) First-run onboarding — J17

1. Five-step tour over a blurred app (`onboarding-step1-light.png`). Steps 2–3
   ("Powerful Features" incl. **PAC Script Support**, "Keyboard Shortcuts")
   front-load advanced concepts before any value
   (`onboarding-step3-light.png`; `OnboardingModal.svelte:65-71`).
2. Step 4 offers Import (good for P4); step 5 offers "Create First Proxy" →
   hands off to the same jargon-heavy editor from walkthrough (a). The tour never
   *itself* yields a working proxy. **Verdict: informative but slow to value;**
   would benefit from collapsing to 2 steps (what it does → create/import).

---

## 4. Complexity / cognitive-load analysis

**Where features have accreted into dense screens.**

- **Options landing page** opens with, top-to-bottom: theme toggles + keyboard
  icon + 3 tabs in the header; then a **Quick Switch** section (title, help
  tooltip, enable toggle, large empty dropzone); then **All Proxy Configs**
  (title, count, grid/list switcher, search, **orange Add Auto-Proxy**, **blue
  Add Proxy**); then N cards each with 6+ controls. That is **~20+ distinct
  interactive elements before the first proxy card**
  (`ProxyConfigsTab.svelte:149-281`; `options-proxyconfigs-light.png`).

- **Proxy editor (Manual)** visible-control count at the default step: Name,
  char-counter, Color, Badge Label, Badge Preview, Active toggle, 5-way Mode
  selector, "same server" checkbox, Scheme select, Host, Port, Authentication
  disclosure, Bypass List = **~13 controls/concepts** before saving the simplest
  proxy (`modal-proxy-manual-light.png`).

- **Auto-Proxy modal** renders **~9 concept clusters at once** (basic settings ×5
  fields + Rules + Subscriptions + Fallback + Pattern Tester). One rule = **8–12
  controls** (`AutoProxyModal.svelte:438-466`; `AutoProxyRuleEditor.svelte`).

**Jargon exposed to users who don't need it** (brief says P1/P2 must never meet
these). Verbatim, in the current UI:

| Term | Where it surfaces | File / shot |
|------|-------------------|-------------|
| PAC / "PAC Script" | mode chip on cards; editor mode selector; onboarding step 2; import source label | `options-proxyconfigs-light.png`; `ProxyModeSelector.svelte:19`; `OnboardingModal.svelte:65-71` |
| SOCKS4 / SOCKS5, "scheme" | Manual mode + inline proxy selector | `ManualProxyConfiguration.svelte`; `ProxySelector.svelte` |
| per-protocol / "Use same proxy for all protocols" | Manual mode | `modal-proxy-manual-light.png` |
| Regex / CIDR / Wildcard (+ raw syntax) | rule match-type grid + rule-list badges | `modal-autoproxy-ruleeditor-light.png` |
| "Subscription", ABP / Surge / Clash | subscriptions | `SubscriptionList.svelte:297-303` |
| "Fallback" | fallback section, pattern tester | `FallbackConfig.svelte` |
| "Define Inline" | every proxy selector | `ProxySelector.svelte` |
| Bypass List, Auto-config URL (WPAD) | editor | `modal-proxy-manual-light.png`; `ProxyModeSelector.svelte:18` |

**Redundant / competing affordances.**

1. **Three ways to activate a proxy:** card toggle, popup toggle, editor "Active"
   toggle.
2. **Two ways to manage Quick Switch:** drag to the dropzone vs the per-card
   lightning "Pin" button (`ScriptItem.svelte:347-369`).
3. **Two top-level "Add" entry points** (Add Proxy vs Add Auto-Proxy) for what is
   really one entity in two modes.
4. **Two restore paths** (Restore vs Import), one safe, one not (E5).
5. **Grid vs list views** that render near-identically (§2.2) — surface area for
   no payoff.
6. **PAC URL field + inline PAC editor + templates** shown together with implicit
   precedence (`modal-proxy-pac-light.png`).

**Net:** depth *is* taxing the simple case — exactly the failure mode the brief
warns against. The simple paths (create basic proxy, first run) inherit the full
machinery instead of a stripped-down default.

---

## 5. Accessibility & i18n spot-checks

- **Keyboard:** Modals trap focus, support Escape, and are correctly
  `role="dialog"`/`aria-modal`/`aria-labelledby` (`ProxyConfigModal.svelte:254-272`;
  `ImportModal`; `ExportModal`; `OnboardingModal`). **But rule reordering is
  drag-only with no keyboard path (E3, sev 4).** Number-key switching exists on
  the options page (`ProxyConfigsTab.svelte:93-110`) but not in the popup.
- **Screen reader:** No `aria-live`/`role="alert"` on any validation, warning,
  or pattern-test result (E8). Match-type cards are buttons, not a radiogroup.
  One **inverted toggle `aria-label`** in the rule list (announces the opposite
  of current state). Pattern-tester and some toggles are unlabelled.
- **Contrast (from screenshots):** Light and dark popups look adequate; the
  orange **Add Auto-Proxy** gradient button has white text on a light orange —
  borderline; muted timestamps/URLs in subscriptions use `text-slate-400`
  (low). The accent micro-bars and colored dots carry meaning but are paired
  with text in most places (acceptable). 200% zoom not verifiable from static
  shots; the dense editor/auto-proxy modals are the likeliest reflow casualties.
- **i18n / label-length:** Hardcoded English in `BackupRestore.svelte` (§2.7)
  won't localize. Segmented controls (5-way mode selector, match-type grid) and
  the two side-by-side Add buttons are tight; with the brief's 30–40% expansion
  these will wrap or truncate. Badge "Preview" chip assumes Latin 4-char
  abbreviations.

---

## 6. Quick wins vs. deeper structural issues

### Quick wins (cheap, high value)

1. **Rename mode chips to plain language** on cards and hide them for the two
   simplest modes (show nothing for Manual/Direct, label PAC/Auto as "Advanced").
   Removes the most pervasive jargon (E1, §2.2) — string-level change.
2. **Move Badge Label behind an "Advanced" disclosure** in the editor and drop
   the always-on Preview chip (§2.3). Reclaims the simple create.
3. **Add an explicit "this will overwrite your current settings" confirm to
   Restore** (or route Restore through the existing Import preview) — closes the
   silent data-loss gap (E5) with the safety code that already exists.
4. **Fix the inverted toggle `aria-label`** and **wrap error/warning/test
   regions in `aria-live`** (E8) — small, mechanical a11y fixes.
5. **Localize the hardcoded `BackupRestore` strings** (§2.7).
6. **Fix the "URL Pattern" vs hostname label contradiction** and rename "Skip
   Tour" → "Get Started/Finish" on the last onboarding step (§2.4, §2.6).
7. **Hide the empty Quick Switch dropzone until at least one proxy is pinned**,
   and lead with the per-card "Pin" button as the primary affordance (E6).
8. **Give the popup a top-of-list active indicator** (move "Connected: X" above
   the cards or badge the active card) for J1 glanceability (E7).

### Deeper structural issues

1. **Progressive disclosure for the proxy editor (E1).** Default the create flow
   to a no-jargon "Server + port (+ optional login)" form; tuck System / Direct /
   PAC / Auto-detect / per-protocol behind "Advanced / change connection type."
   This is the single highest-leverage change for the 80% case and the brief's
   time-to-first-proxy and zero-jargon metrics.
2. **Re-architect the Auto-Proxy modal into a staged flow (E2).** Rules first;
   Subscriptions, Fallback, and Pattern Tester as separate tabs/steps, not one
   scroll. Collapse the repeated 6-field ProxySelector behind "Direct / pick a
   proxy / advanced."
3. **Keyboard-operable rule reordering (E3).** Add up/down controls (or
   `aria-grabbed` semantics) alongside drag; priority is functionally critical.
4. **Unify activation and the "proxy vs auto-proxy" split.** One "Add proxy"
   entry that offers routing as a mode; one canonical activation surface; make
   the popup toggles read as a selection (radio/segmented) to match the exclusive
   behavior (E4).
5. **Decide the fate of grid-vs-list.** Either make the list view meaningfully
   denser/different or remove the switcher (§2.2) — right now it is cost without
   benefit.
6. **Onboarding to value, not features.** Collapse to "what it does → create or
   import," and let "create" use the simplified editor from (1) so the tour ends
   on a working proxy (J17).

---

*Strengths to preserve:* the Import preview/warnings/backup/activate flow
(`ImportModal.svelte`), the export credential warning, the Auto-Proxy delete
reference-warning, consistent modal focus management, and a clean Diagnostics
tab. The product's problem is not missing capability — it is that the **simple
paths inherit the complex machinery**. Fixing that (progressive disclosure +
staged Auto-Proxy + de-jargoned defaults) resolves the majority of the
high-severity findings.
