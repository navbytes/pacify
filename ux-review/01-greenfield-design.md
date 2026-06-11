# Pacify — Greenfield UX Design (North Star)

> Designed from the brief alone, from first principles. Migration cost and
> "what exists today" are intentionally ignored; this is the ideal target.
> JTBD references are J1–J20; success metrics are referenced by name.

---

## 0. Design thesis

One sentence: **Pacify is a light switch that happens to contain a routing
engine.**

The entire design hangs on a single asymmetry from the brief: 80% of users (P1)
have exactly one proxy and want an on/off switch with a glanceable state; a small
power tail (P3) needs a destination-routing engine with PAC/CIDR/regex/
subscriptions. The brief names the central tension explicitly — "depth must not
tax the simple case" — and names progressive disclosure as the likely backbone.

So the spine of this design is a **complexity gradient**, not a feature list. A
user only ever sees the concepts required by the proxy *they have chosen to
build*. P1 lives at Level 0–1 forever and never meets the word "PAC". P3 climbs
to Level 3 deliberately. The same object ("a proxy") is the unit at every level;
it just gains optional facets as you climb.

Two surfaces, two jobs:
- **Popup = the cockpit.** Status + switching only. Never edits structure.
  (Serves J1–J4, the highest-frequency jobs.)
- **Options page = the workshop.** Create/edit/route/import/diagnose. Everything
  structural lives here. (Serves J5–J20.)

This separation is itself a progressive-disclosure move: the popup is a hard
ceiling on complexity for the daily loop.

---

## 1. Information Architecture

### 1.1 The two surfaces and their contract

```
┌─────────────────────────────┐        ┌──────────────────────────────────────┐
│  POPUP  (the cockpit)       │        │  OPTIONS PAGE  (the workshop)         │
│  ~380 × up to 600px         │        │  full tab, responsive                 │
│                             │        │                                       │
│  • Master on/off            │        │  • Proxies (list + editor)            │
│  • Active proxy identity    │ ─────▶ │  • Routing (rules, test, subs) *P3    │
│  • Pick from saved proxies  │ "Edit" │  • Import / Export / Backup           │
│  • One-tap to options       │ "Manage"│  • Diagnostics                        │
│                             │        │  • Preferences                        │
│  READ + SWITCH only.        │        │  • About / Privacy                    │
│  Never structural edits.    │        │  CREATE + EDIT + everything deep.     │
└─────────────────────────────┘        └──────────────────────────────────────┘
```

**Why this contract:** Glanceability and "≤2 clicks to switch" (success metrics)
demand the popup carry zero cognitive overhead. Editing inside a 380px box forces
truncation, modal stacking, and jargon leakage — the opposite of the goal. Every
structural action escalates to the workshop via one obvious door.

### 1.2 Popup IA (top → bottom)

```
1. STATUS BAR     — master toggle + current state, the hero
2. ACTIVE CARD    — which proxy is on, its identity (name/color/badge)
3. PROXY PICKER   — the saved proxies as a tap-to-activate list
4. FOOTER         — "Manage proxies…" (→ options), tiny gear (→ preferences)
```

Only four zones, in frequency order: the thing you check (status), the thing you
confirm (active identity), the thing you change (picker), the escape hatch
(footer). (J1, J2, J3, J4.)

### 1.3 Options page IA (left nav, 6 sections)

```
Pacify ▸
├── Proxies        ← default landing. The list + editor. (P1/P2/P3 all live here)
├── Routing        ← only surfaced once a routing proxy exists. (P3) 
├── Transfer       ← Import · Export · Backup/Restore (P4 + everyone)
├── Diagnostics    ← is it really on? errors? storage? (J19)
├── Preferences    ← behavior toggles (J20)
└── About          ← what it does, privacy, "nothing leaves your machine" (J18)
```

**Key IA decision — "Routing" is a conditionally-visible section.** It does not
appear in the nav until the user creates (or imports) a rule-based proxy. P1/P2
never see a top-level nav item containing the word "Routing", let alone CIDR.
This is progressive disclosure applied to navigation itself. (Serves *Jargon
exposure* metric; serves the P1/P2-vs-P3 tension directly.)

**Why "Proxies" is the landing, not a dashboard:** The most common acts are
create (J5) and edit (J7); a separate dashboard would be a detour. The list *is*
the dashboard — it shows active state inline.

**Why "Transfer" groups import/export/backup:** P4's whole job (J15) and J14/J16
are the same mental category ("move my config in/out"). One destination, no
hunting.

---

## 2. The "a proxy" object model in the UI

One object, one card, everywhere. A **proxy** is always represented by:

```
[●]  Name            ⟨BADGE⟩            ← color dot, label, optional 2–3 char badge
     how-it-connects (humanized)        ← e.g. "Server proxy.work.com:8080"
```

- **Color dot `●`** — identity at a glance (J4). Same dot in popup, list, badge.
- **Name** — user's words, never a hostname unless they chose that. (J4)
- **Badge** — optional 2–3 chars ("WK", "ST") for ultra-fast P2 scanning (J4).
- **Subtitle** — a *humanized* description of the mode, never the raw enum.

**The mental model never changes; only the proxy's "shape" deepens.** A proxy has
exactly one **Type** (its `chrome.proxy` mode, humanized) chosen from a friendly
menu — see §4. Whether it's a one-line server or a 200-rule router, in the popup
and list it is *one card with the same anatomy*. This is the *Consistency* metric
made literal: the popup card, list row, and editor header are the same object at
three zoom levels.

Crucially: **rule-based routing is a Type of proxy, not a separate kingdom.** A
router shows up in the picker like any other proxy and can be activated with one
tap. P3 builds depth *inside* one proxy card; P1 never opens that card.

---

## 3. Progressive disclosure — the heart

### 3.1 Three editor Levels (the proxy editor)

The editor for a single proxy has three levels. You are never shown a level you
didn't ask for. **The default create path lands at Level 1 and can finish there.**

```
LEVEL 0 — Presets (the menu you start from)
  Pick "what kind of proxy" in plain language. No fields yet.

LEVEL 1 — Basic Server   (the 80% create — J5)
  Fields: Name, [color], Server host, Port. Optional: Username/Password.
  That's it. No protocol words, no bypass, no PAC. "Save & Turn On".

LEVEL 2 — More options    (revealed by one "More options" disclosure)
  Bypass list ("Don't proxy these sites"), per-protocol servers,
  auth permission prompt. Each phrased plainly; raw terms appear only
  inside the control they belong to.

LEVEL 3 — Routing depth   (only for the "Route by site" Type)
  Ordered rules, match types (wildcard/exact/regex/CIDR), fallback,
  URL tester, subscriptions, PAC editor. This is P3's world. (J9–J13)
```

### 3.2 What's visible by DEFAULT vs ON DEMAND

| Concept | Default visible? | Revealed when… |
|---|---|---|
| Name, color, host, port | Yes (Level 1) | always — the core create |
| Username/password | Collapsed hint "Needs sign-in?" | user expands | 
| Bypass list | No | "More options" |
| Per-protocol (HTTP/HTTPS/FTP split) | No | "More options" → "Use different servers per protocol" |
| WPAD / auto-detect | No | Level 0 preset "Detect automatically" |
| PAC by URL/paste | No | Level 0 preset "Advanced: PAC script" |
| Rules / match types | No | Level 0 preset "Route by site" → Routing section |
| CIDR / regex | No | inside a rule's match-type dropdown only |
| Subscriptions | No | inside Routing, "Add a rule list" |
| System / Direct | One-line presets | Level 0 |

The rule: **a term only renders inside the one control that needs it, and that
control only renders if you chose the path that needs it.** P1 completing J5
encounters: Name, Server, Port. Nothing else. (Directly serves *Jargon exposure*
and *Time-to-first-working-proxy*.)

### 3.3 The list also has levels (density)

The Proxies list has a **Simple** density (default) and never forces grouping.
When a user has 1–2 proxies it reads as a near-empty, calm list. As proxies
accumulate, optional **color/badge** scanning aids appear. The list never shows
rule counts or PAC internals at the top level — those live inside the card.

---

## 4. How "Type" (mode) is chosen — Level 0 presets

`chrome.proxy` modes are system / direct / auto_detect / pac_script /
fixed_servers (constraint). We **never** show those words. The create flow opens
on a **preset chooser** that maps each mode to a job:

```
┌────────────────────────────────────────────────────────┐
│  New proxy — what kind?                                 │
│                                                          │
│  ●  Connect through a server          (fixed_servers)   │ ← default, big
│     "I have a host and port."                            │
│                                                          │
│  ●  Route by site                     (pac/rules)       │ ← P3 door
│     "Some sites direct, some through proxies."           │
│  ─────────── more ▾ ───────────────────────────────────  │
│  ○  Use my system settings            (system)          │
│  ○  No proxy (direct)                 (direct)          │
│  ○  Detect automatically (WPAD)       (auto_detect)     │
│  ○  Advanced: PAC script              (pac_script)      │
└────────────────────────────────────────────────────────┘
```

The two jobs that matter (J5 server, J9 routing) are above the fold and verbose;
the three rare/expert modes are under a "more ▾" disclosure. Choosing the first
preset drops you straight into Level 1 with two fields focused. (J5, J6.)

---

## 5. Core flows with wireframes

### P1 "Toggler" — install → first working proxy → toggle → glance

**Metric targets:** <60s to first working proxy, no jargon; <1s glance.

**Step 1 — First run (auto-opens options on install, J17).**

```
┌──────────────────────────────────────────────┐
│  Welcome to Pacify                            │
│  Manage and switch proxies. Nothing you enter │
│  ever leaves this browser.  [Privacy ↗]       │  ← trust signal, J18
│                                               │
│   ┌───────────────────────┐  ┌─────────────┐ │
│   │  + Add a proxy         │  │  Import…    │ │  ← P1 left, P4 right
│   └───────────────────────┘  └─────────────┘ │
└──────────────────────────────────────────────┘
```

**Step 2 — Preset chooser (§4).** P1 clicks the default "Connect through a
server." No jargon shown.

**Step 3 — Level 1 form (the only screen P1 fills).**

```
┌──────────────────────────────────────────────┐
│  New proxy                                    │
│  ● ▾  [ Work proxy________________ ]  Name    │
│                                               │
│  Server  [ proxy.work.com________ ] : [8080]  │
│                                               │
│  ▸ Needs a username & password?   (collapsed) │  ← J8, only if needed
│  ▸ More options                   (collapsed) │  ← Level 2 door
│                                               │
│         [ Cancel ]   [ Save & Turn On ▶ ]     │  ← primary verb does both
└──────────────────────────────────────────────┘
```

3 fields. "Save & Turn On" creates AND activates — one action to a working
proxy. (J5 + J2 fused; Time-to-first-working-proxy.)

**Step 4 — Glance & toggle (popup, the daily loop).**

```
┌─────────────────────────────┐     OFF state:
│  ████  ON  ●────────  [⏻]   │   ┌─────────────────────────────┐
│  Proxied via                │   │  ░░░░  OFF  ────────○  [⏻]  │
│                             │   │                             │
│  ● Work proxy        [WK]   │   │  ● Work proxy        [WK]   │
│    proxy.work.com:8080      │   │    (paused)                 │
│                             │   │                             │
│  ─ Saved proxies ─          │   │  ─ Saved proxies ─          │
│  (none others)              │   │                             │
│                             │   │  [⚙ Manage proxies…]        │
│  [⚙ Manage proxies…]        │   └─────────────────────────────┘
└─────────────────────────────┘
```

The big top bar is the hero: filled green "ON" / grey "OFF", a real toggle on the
right (J2, one action). The toolbar icon mirrors this with a **color badge** (the
proxy's color when on, hollow/grey when off) so the *icon alone* answers J1
without opening the popup. (Glanceability metric.)

### P2 "Switcher" — flip among saved proxies

**Metric target:** ≤2 clicks from toolbar.

```
┌─────────────────────────────┐
│  ████  ON  ●────────  [⏻]   │
│  Proxied via                │
│  ● Staging           [ST]   │  ← currently active, highlighted row
│                             │
│  ─ Switch to ─              │
│  ● Work              [WK]   │  ← tap = activate, popup stays open briefly
│  ● Personal          [PE]   │     then closes / shows new active
│  ● Direct (no proxy)        │  ← always-present escape to direct
│                             │
│  [⚙ Manage proxies…]        │
└─────────────────────────────┘
```

Click popup (1) → click target proxy (2) = switched. The active proxy floats to
the "Proxied via" hero; the rest are "Switch to". Color + badge make targets
scannable without reading (J3, J4). Optional preference "reload tab on switch"
(J20) makes the switch take effect on the current page immediately. "Direct" is
a permanent first-class entry so "turn it off for this one site visit" is also
≤2 clicks.

### P3 "Router" — build a rule, test a URL, manage a subscription

This all lives in the **Routing** section, which appeared in the nav the moment a
"Route by site" proxy existed. A router proxy's editor *is* the Routing view.

**3a — The rules table (ordered, J9/J10).**

```
┌───────────────────────────────────────────────────────────────────┐
│  ◀ Proxies   ● Smart routing  [SR]            [▶ Active]  [Test ▦] │
│                                                                     │
│  Rules — checked top to bottom, first match wins                    │
│  ⇅  When the site…              send it to…                  ✎  ✕  │
│  ─────────────────────────────────────────────────────────────────  │
│  ⠿  matches  *.internal.corp    →  ● Work proxy             ✎  ✕   │
│  ⠿  is        github.com        →  ○ Direct                 ✎  ✕   │
│  ⠿  matches  10.0.0.0/8  ⓘCIDR  →  ● Work proxy             ✎  ✕   │
│  ─────────────────────────────────────────────────────────────────  │
│  Everything else (fallback) →  [ ● Personal proxy   ▾ ]            │  J10
│                                                                     │
│  [ + Add rule ]            [ Add a rule list (subscription)… ]      │  J12
└───────────────────────────────────────────────────────────────────┘
```

Plain-language column heads ("When the site… send it to…") instead of
"condition/profile". Match type is a per-rule dropdown — **wildcard / exact host
/ regex / IP range (CIDR)** — so the term CIDR/regex appears *only inside the
control of a rule a P3 deliberately created* (Level 3 confinement). Drag handle
`⠿` reorders priority. Destination picker reuses the proxy card model (a rule
points at *a proxy*, reinforcing one object model).

**3b — Add/edit a single rule (focused panel).**

```
┌──────────────────────────────────────────────┐
│  Rule                                         │
│  Match the site by:  [ Wildcard pattern  ▾ ]  │ ← exact / regex / IP range
│  Pattern:            [ *.internal.corp_____ ] │
│      ✓ matches “mail.internal.corp”           │ ← live validation inline
│      ✗ regex error: unbalanced ( …            │ ← errors explained in place
│  Send matching traffic to:                    │
│      [ ● Work proxy                       ▾ ]  │ ← a proxy, inline server, or direct
│                       [ Cancel ]  [ Save ]    │
└──────────────────────────────────────────────┘
```

(Depth-without-dead-ends metric: every match type validates as you type and
names the error.)

**3c — Test a URL (J11) — always one click away via [Test ▦]).**

```
┌──────────────────────────────────────────────┐
│  Test a URL                                   │
│  [ https://mail.internal.corp/inbox________ ] │
│                              [ Test ▶ ]       │
│  ─────────────────────────────────────────    │
│  ✓ Rule 1  “matches *.internal.corp”          │ ← which rule won, highlighted
│       → routed to ● Work proxy                │
│  Rules 2–3 skipped. Fallback not reached.     │ ← shows the decision trace
└──────────────────────────────────────────────┘
```

The tester echoes the exact decision path and highlights the winning row back in
the table. This is the "trust" half of P3's job (Depth-without-dead-ends).

**3d — Subscription (J12).**

```
┌──────────────────────────────────────────────┐
│  Add a rule list                              │
│  List URL:  [ https://…/cn-direct.txt______ ] │
│  Format:    [ Auto-detect ▾ ] (ABP/Surge/Clash/domains)
│  Send matched sites to: [ ○ Direct        ▾ ] │
│  Update every: [ 24 hours ▾ ]                 │
│                       [ Cancel ]  [ Add ]     │
└──────────────────────────────────────────────┘
   After adding, it appears in the rules table as a single collapsible group:
   ▸ 📥 cn-direct.txt  · 4,210 rules · updated 2h ago · ✓     [↻] [⚙] [✕]
       (last error, if any, shown in red here — J12 status)
```

A subscription is just a *grouped, read-only block of rules* in the same table —
same mental model, one row collapsed. Its status (count, last update, last
error) lives on the group row (J12). Manual `[↻]` refresh + interval.

### P4 "Migrator" — import an existing setup (J15)

```
Step 1 — Transfer ▸ Import
┌──────────────────────────────────────────────┐
│  Import a setup                               │
│  Drop a file here, or [ Choose file ]         │
│  We recognize: SwitchyOmega · FoxyProxy ·     │
│  PAC file · Pacify backup        (auto-detect)│
└──────────────────────────────────────────────┘

Step 2 — Preview BEFORE committing (the trust gate)
┌──────────────────────────────────────────────┐
│  Detected: SwitchyOmega backup                │
│  Will import:                                 │
│   ● Work          server proxy.work:8080   ✓  │
│   ● Auto          → becomes “Route by site”✓  │
│   ⚠ Personal      uses SOCKS5 auth — needs    │
│        the sign-in permission   [Review]      │ ← warnings before commit
│   ✕ 1 rule used an unsupported syntax — see   │
│        details                      [Details] │
│                                               │
│  ☑ Keep my existing proxies (merge)           │
│         [ Cancel ]   [ Import 3 proxies ▶ ]   │
└──────────────────────────────────────────────┘
```

The preview with per-item ✓/⚠/✕ and a merge choice is the whole point of J15 —
no silent clobber, warnings surfaced before the commit button. Mapping language
("→ becomes 'Route by site'") teaches P4 Pacify's model in their own terms,
satisfying "feels familiar enough." Export (J16) and Backup/Restore (J14) are
sibling tabs with the same preview discipline on restore.

---

## 6. Component & layout language (conceptual)

- **Card = a proxy.** The proxy card (dot + name + badge + humanized subtitle) is
  the atomic component, identical across popup, list, and rule destination
  picker. Consistency metric, one mental model. (J4)
- **Rows in the popup, cards in the list.** Popup uses compact rows (vertical
  density for ≤600px); the options list uses slightly taller cards with inline
  active indicator + hover actions (edit/duplicate/delete — J7). Same anatomy,
  two densities.
- **The editor is a single right-hand panel, not a modal stack.** Selecting a
  proxy in the list opens it beside the list (master–detail). Levels reveal via
  inline disclosures, never new modals — this keeps the "I'm editing one object"
  context and avoids depth-as-popups. (Cognitive load metric.)
- **Mode is chosen once, up front (Level 0 presets), then mostly invisible.** The
  editor's body shape is determined by the chosen Type; you rarely re-choose.
- **Status signaling, three coordinated channels (J1):**
  - *Toolbar icon badge:* shows the active proxy's **color** when on; hollow/grey
    when off. The answer to J1 without any click. Optional 2-char badge text.
  - *Popup hero bar:* filled/coloured = ON, grey = OFF, with the literal toggle.
  - *List active indicator:* a left color bar + "Active" pill on the running card.
  All three use the *same color* = the proxy's identity color, so on/off/which-one
  is one perceptual fact. (Glanceability metric.)
- **Disclosure idiom:** `▸ label` triangles for "More options", "Needs sign-in?".
  Consistent, keyboard-focusable, labelled — meets accessibility constraint.
- **Empty/zero state is calm:** one proxy = a quiet single card; the UI's apparent
  complexity scales with the user's actual config, never with the feature set.
- **i18n/a11y baked in:** all controls are labelled text (no icon-only primary
  actions), layouts are flex/wrap to absorb 30–40% label growth, full keyboard
  operation with visible focus, contrast tokens for light/dark, works at 200%.
  (Hard constraints.)

---

## 7. Decision → JTBD/metric traceability (summary)

| Decision | Serves JTBD | Serves metric |
|---|---|---|
| Popup = read+switch only | J1–J4 | Glanceability, ≤2-click switch |
| Options = all structural edits | J5–J20 | Cognitive load |
| "Routing" nav hidden until needed | J6, J9 | Jargon exposure |
| Level 0 presets hide chrome.proxy enums | J6 | Jargon exposure, time-to-first |
| Level 1 = Name/Host/Port + "Save & Turn On" | J5, J2 | Time-to-first <60s |
| One proxy card across all surfaces | J4 | Consistency |
| Color/badge in icon + popup + list | J1, J4 | Glanceability |
| Match-type term confined to a rule's dropdown | J9 | Jargon exposure |
| URL tester with decision trace | J11 | Depth without dead-ends |
| Inline match validation/errors | J9, J13 | Depth without dead-ends |
| Subscription as a grouped row | J12 | Consistency, cognitive load |
| Import preview w/ ✓⚠✕ + merge | J15 | (P4 trust) |
| "Nothing leaves this browser" on first run + About | J18 | (trust/safety) |
| Diagnostics section | J19 | — |
| Master toggle + per-tab "Direct" entry | J2 | ≤2-click switch |

---

## 8. Top 5 highest-leverage ideas

1. **Popup is a cockpit, never a workshop.** Hard rule: the popup only reads
   status and switches the active proxy; every structural edit escalates to the
   options page. This single boundary is what guarantees the daily loop stays at
   <1s glance and ≤2-click switch, and it's why P1 never trips over depth. (J1–J4)

2. **The complexity gradient with a conditionally-visible "Routing" nav.**
   Concepts appear only when the user builds the path that needs them — including
   the navigation itself. PAC/CIDR/regex/subscription literally cannot be seen by
   a P1/P2 because the section that contains them isn't in their nav. This is the
   cleanest possible answer to the "depth must not tax simple" tension. (Jargon
   exposure metric)

3. **"Save & Turn On" — create and activate in one verb.** The first proxy reaches
   *working* in three fields and one button, no jargon. The fused verb is the
   biggest lever on time-to-first-working-proxy. (J5+J2)

4. **One proxy object, three zoom levels.** The same card (color dot · name ·
   badge · humanized subtitle) is the unit in the popup, the list, and as a rule's
   destination. A router is just a proxy with a deeper inside — not a separate
   kingdom. This is the consistency metric made structural and keeps the mental
   model singular across every surface. (J4, Consistency)

5. **Color is the identity carried into the icon badge.** The toolbar icon shows
   the active proxy's color (hollow when off), so on/off/which-one is answered
   before any click, and the same color threads through popup and list. One
   perceptual fact, zero reading. (J1, Glanceability)
