# Pacify UX — Convergence & Roadmap

> Phase 2 of the parallel-blind review. This synthesizes the **greenfield north
> star** (`01-greenfield-design.md`, designed with no sight of the current UI)
> and the **heuristic evaluation** (`02-heuristic-eval.md`, evidence from real
> screenshots + code) into a prioritized, scored plan.
>
> Budget for this round (decided): **review + roadmap only** (no app code yet),
> with appetite to **restructure where it pays off**.

## 1. The convergence

The two tracks were run blind to each other. They agree — strongly — which is
the strongest possible signal:

> **Root cause (both tracks):** the simple paths inherit the full machinery.
> A first-time user creating one server proxy is walked through the same
> five-mode, SOCKS/per-protocol/badge/PAC apparatus a power user needs. Depth is
> taxing the simple case — the exact failure the brief warns against.

| North star says (A) | Evaluation proves (B) | Confidence |
|---|---|---|
| Hide `chrome.proxy` enums behind job-named presets; default to a 3-field server form | E1 (sev 4): mode selector is a jargon wall before host/port; ~13 controls to save the simplest proxy | **High** |
| Auto-Proxy = a 3-level editor, staged | E2 (sev 4): Auto-Proxy modal dumps ~9 clusters on one scroll; 8–12 controls per rule | **High** |
| One proxy object; routing is a *mode*, not a separate kingdom | §2.2: two competing "Add Proxy" vs "Add Auto-Proxy" entry points for one entity | **High** |
| Popup = read-only cockpit; one canonical activation | E4 (sev 3): 3 activation surfaces; popup toggles are radios-in-disguise with no feedback | **High** |
| Keyboard-operable everywhere | E3 (sev 4): rule priority is drag-only — keyboard users can't author a correct rule set | **High** |
| Import-style preview discipline for all data ops | E5 (sev 3): Restore silently overwrites next to the safe, previewed Import | **High** |
| Color identity threaded into the toolbar icon badge | E7 (sev 2): toolbar glanceability weak; active state buried below the fold | Medium |
| Conditionally-visible "Routing" nav | (addition — not directly tested) | Medium — validate |

Where they agree → act. Where A proposes something B didn't test (icon badge,
conditional nav, master cockpit) → validate cheaply with a mockup before
committing (Phase 3).

**Preserve (both tracks praise these — do not regress):** the Import
preview→warnings→backup-nudge→Activate flow (the model for everything else),
the Export cleartext-credential warning, the Auto-Proxy delete
reference-warning, consistent modal focus management, and the Diagnostics tab.

## 2. Scored diff

Impact and Effort/migration are 1–5 (5 = highest). **Bucket** ∈ Keep / Simplify
/ Cut / Add / Restructure. **Wave** is the recommended sequencing (see §3).

| # | Item | Bucket | Impact | Effort | Wave | JTBD / metric | Evidence |
|---|------|--------|:--:|:--:|:--:|---|---|
| 1 | De-jargon mode chips on cards (plain words; hide for basic modes) | Simplify | 4 | 1 | 1 | jargon exposure | E1, §2.2 |
| 2 | Badge Label → behind "Advanced"; drop always-on Preview chip | Simplify | 3 | 1 | 1 | time-to-first | §2.3 |
| 3 | Restore → route through Import-style preview/confirm (or hard warn) | Restructure | 4 | 2 | 1 | error prevention | E5 |
| 4 | `aria-live` on all error/warning/test regions; fix inverted toggle aria-label | Add | 3 | 1 | 1 | a11y constraint | E8 |
| 5 | Localize hardcoded `BackupRestore` strings | Keep-fix | 2 | 1 | 1 | i18n | §2.7 |
| 6 | "URL Pattern" → "Host pattern" (label matches behavior); "Skip Tour" → "Finish" | Simplify | 3 | 1 | 1 | error prevention | §2.4, §2.6 |
| 7 | Hide empty Quick-Switch dropzone until something is pinned; lead with per-card Pin | Simplify | 3 | 2 | 1 | cognitive load | E6 |
| 8 | Popup: active proxy pinned to top as a status hero (J1 glance) | Restructure | 4 | 2 | 1 | glanceability | E7, §2.1 |
| 9 | **Progressive-disclosure proxy editor**: default to Name/Host/Port (+optional login); presets + per-protocol/PAC/WPAD behind "change connection type / Advanced" | Restructure | **5** | 4 | 2 | time-to-first, jargon | E1, A§3–4 |
| 10 | Unify "Add Proxy" + "Add Auto-Proxy" into one entry; routing is a preset/mode | Restructure | 4 | 3 | 2 | consistency | §2.2, A§2 |
| 11 | "Save & Turn On" — fuse create + activate (route through cred-permission prompt) | Add | 4 | 2 | 2 | time-to-first | A§5, J5+J2 |
| 12 | One canonical activation; popup toggles read as a selection (radio/segmented) | Restructure | 4 | 3 | 2 | consistency, error prevention | E4 |
| 13 | Keyboard rule reordering (up/down + SR semantics) alongside drag | Add | 4 | 2 | 2 | a11y constraint | E3 |
| 14 | Onboarding → "what it does → create/import", ending on a working proxy | Restructure | 3 | 2 | 2 | J17 | §2.6 |
| 15 | **Stage the Auto-Proxy editor**: Rules / Subscriptions / Fallback / Test as steps, not one scroll | Restructure | 5 | 4 | 3 | cognitive load | E2, A§3 |
| 16 | Collapse the repeated 6-field ProxySelector behind "Direct / pick a proxy / advanced" | Simplify | 3 | 3 | 3 | cognitive load | §2.4 |
| 17 | Conditionally-visible "Routing" nav section (appears once a routing proxy exists) | Restructure | 3 | 4 | 3 | jargon exposure | A§1.3 — **validate** |
| 18 | Toolbar icon shows active proxy's **color** (hollow when off) | Add | 4 | 3 | 3 | glanceability | A§6 — **validate** |
| 19 | Subscriptions: explain ABP/Surge/Clash inline; rename "Subscription"→"Rule list"; "Define Inline"→"Enter a server" | Simplify | 3 | 2 | 3 | jargon exposure | §2.4 |
| 20 | Resolve grid-vs-list: make list meaningfully denser **or** remove the switcher | Cut/Simplify | 2 | 2 | 3 | cognitive load | §2.2 |
| 21 | PAC editor: make URL vs pasted-script one explicit choice (kill silent precedence) | Simplify | 3 | 2 | 3 | error prevention | §2.3 |

## 3. Roadmap (waves)

**Wave 1 — De-jargon & safety (high impact / low effort, mostly non-breaking).**
Items 1–8. String-level de-jargoning, the Restore safety gate, the a11y `aria-live`
fixes, hiding the empty Quick-Switch zone, and a popup active-status hero. These
move the *jargon-exposure* and *glanceability* metrics immediately and remove a
real data-loss footgun, with little relearning. Ship as one or two PRs behind the
existing test net.

**Wave 2 — Progressive disclosure & one object (the core restructure).** Items
9–14. This is where "restructure where it pays off" is spent. The editor default
becomes a 3-field server form (item 9) — the single highest-leverage change in the
whole review — with presets/Advanced for everything else; "Add Proxy" and "Add
Auto-Proxy" merge (10); create+activate fuse (11); activation becomes singular and
the popup reads as a selection (12); rule reordering becomes keyboard-operable
(13); onboarding ends on a working proxy (14). Bigger, but each item is
independently shippable and test-guarded.

**Wave 3 — Depth made calm + glance bets (validate first).** Items 15–21. Stage
the Auto-Proxy editor (15) — the biggest P3 win — collapse the repeated selector
(16), the conditional Routing nav (17), the color-in-icon badge (18), subscription
de-jargoning (19), the grid/list decision (20), and the PAC source choice (21).
Items 17–18 are greenfield *additions* the eval didn't test → **mock them first**.

## 4. What to cut or simplify (reduce surface area)

- **Three activation surfaces → one.** Keep the popup + list toggle; the editor's
  "Active" toggle becomes "Save & Turn On" (activation is an outcome of save, not a
  third control). (E4, §2.3)
- **Two "Add" buttons → one.** Routing is a mode of one "Add proxy". (§2.2)
- **Two restore paths → one safe path.** (E5)
- **Empty Quick-Switch dropzone** off by default; one Pin affordance. (E6)
- **Grid-vs-list** — likely remove the switcher unless list earns its keep. (§2.2)
- **Badge Label / Preview** out of the default create. (§2.3)

## 5. Risks & things to validate (honesty)

- **Conditional "Routing" nav (17):** elegant, but how does a brand-new P3
  discover routing? Answer in A: via the "Route by site" preset in the editor; the
  nav only *reveals after* the first routing proxy exists. Worth a mockup to
  confirm the first-time path isn't a dead end.
- **Popup toggles → radio/selection (12):** corrects a real mental-model bug but
  changes a long-standing interaction; needs clear "active vs available" visual
  language so it doesn't read as "disabled".
- **"Save & Turn On" (11):** must still route credential configs through the
  optional-permission prompt; don't let the fused verb skip it.
- **De-jargoning labels (1, 19):** keep the real term discoverable for P3/P4 (e.g.
  tooltip or Advanced), so migrators who *know* "PAC"/"SOCKS" aren't lost.
- **i18n:** any new segmented controls/presets must absorb 30–40% label growth —
  prefer wrapping lists over fixed-width chips.

## 6. Recommended next step

This round's deliverable (the roadmap) is done. The highest-leverage, lowest-risk
start is **Wave 1**, which is almost entirely non-breaking and moves the metrics
immediately.

Before building **Wave 2/3 restructures**, the cheap insurance is **Phase 3**:
static HTML mockups (rendered + screenshotted) of (a) the progressive-disclosure
editor and (b) the staged Auto-Proxy flow / cockpit popup, plus a red-team critic
pass — so the structural calls are reviewed against something concrete, not prose.

Suggested sequence: **Wave 1 → mock Wave 2 core (items 9–12) → build → mock Wave 3
bets (15, 17, 18) → build.**
