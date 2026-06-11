# Pacify UX Review — Product Brief

> This is the shared anchor for the UX work. It describes **what Pacify must let
> people do** (jobs, requirements, constraints) — deliberately **not** how the
> current UI looks. Design tracks reason from this brief, not from the existing
> screens, so the "greenfield" track can't anchor on today's layout.

## 1. What Pacify is

A Chrome (MV3) browser extension that manages and switches between proxy
configurations. It controls how the browser connects to the internet via the
`chrome.proxy` API. It is local-only and privacy-first (no accounts, no
telemetry). Distribution: Chrome Web Store. Surfaces: a **toolbar popup** and a
full **options page**.

## 2. Personas

**P1 — "Toggler" (the 80% case).** Has one proxy (often from work or a VPN-style
service). Wants to turn it on, turn it off, and know at a glance whether it's on.
Does not know or care what PAC, CIDR, or SOCKS mean. Should never be forced to.

**P2 — "Switcher".** Juggles a handful of proxies (e.g., work / staging /
personal) and flips between them several times a day. Cares about: fast
switching, clear "which one is active", memorable labels/colors.

**P3 — "Router" (power user).** Routes traffic *by destination* — some sites
direct, some through proxy A, some through proxy B — using URL rules, PAC
scripts, or subscribed rule lists. Cares about: expressive rules, correctness,
testing a URL against the rules, keeping rule lists updated.

**P4 — "Migrator".** Coming from Proxy SwitchyOmega / FoxyProxy / a raw PAC file.
Has an existing mental model and an export file. Cares about: getting their
setup in with minimal re-entry, and a layout that feels familiar enough.

The central tension: **P1/P2 want radical simplicity; P3 needs depth.** Depth
must not tax the simple case. Progressive disclosure is the likely backbone.

## 3. Jobs to be done (requirements, not screens)

Each is something a user must be able to accomplish. Ordered roughly by
frequency.

**Switching & status (highest frequency)**
- J1: See, at a glance (without opening anything beyond the toolbar), whether a
  proxy is active and which one.
- J2: Turn the active proxy off / on in one action.
- J3: Switch from the active proxy to a different saved proxy quickly.
- J4: Distinguish proxies at a glance (name, color, maybe a short badge).

**Creating & editing proxies**
- J5: Create a basic proxy by entering a server host + port (+ optional
  username/password). This is the most common create.
- J6: Choose how a proxy works among: use the OS/system setting; direct (no
  proxy); auto-detect (WPAD); a PAC script (by URL or pasted); a manual server
  (one shared server, or per-protocol HTTP/HTTPS/FTP + fallback) with a bypass
  list; or rule-based routing ("Auto-Proxy", below).
- J7: Edit, duplicate, rename, recolor, and delete a proxy.
- J8: Store proxy credentials securely; supply them automatically when the proxy
  challenges for auth (this needs an optional browser permission).

**Rule-based routing (power)**
- J9: Define ordered rules that send matching URLs/hosts to a chosen
  destination (an existing proxy, an inline server, or direct). Match types:
  wildcard, exact host, regex, CIDR range. Reorder by priority.
- J10: Set a fallback for traffic that matches no rule.
- J11: Test a specific URL and see which rule (or fallback) would handle it.
- J12: Subscribe to a remote rule list (ABP / domain list / Surge / Clash
  formats), auto-update it on an interval, and see its status / last error.
- J13: Edit / validate a PAC script with syntax help.

**Data & lifecycle**
- J14: Back up and restore all settings to/from a file.
- J15: Import from SwitchyOmega / FoxyProxy / a PAC file / a Pacify backup, with
  a preview of what will be imported and any warnings before committing.
- J16: Export to those formats.
- J17: First-run: understand what the extension does and reach a working proxy
  (or an import) quickly.

**Cross-cutting**
- J18: Trust & safety signals — know nothing is sent anywhere; find the privacy
  policy.
- J19: Diagnose when something's wrong (is a proxy actually active? errors?
  storage usage?).
- J20: Configure behavior preferences (e.g., start with proxy off; reload tab on
  switch; system notifications).

## 4. Hard constraints

- **Popup size**: the toolbar popup is small (~360–400px wide, ~600px tall max).
  Status + switching must fit here comfortably.
- **MV3 / `chrome.proxy` semantics**: modes are exactly system / direct /
  auto_detect / pac_script / fixed_servers. Rule-based routing is *compiled to a
  PAC script* under the hood. Credentials need an optional `webRequest` +
  `webRequestAuthProvider` permission, requested only when needed.
- **Local-only**: no server, no sync beyond Chrome's own storage; credentials
  are never synced.
- **i18n**: 12 locales; labels must tolerate ~30–40% length expansion.
- **Accessibility**: keyboard operable, visible focus, adequate contrast in
  light & dark; works at 200% zoom.
- **Migration reality**: a meaningful share of users arrive from SwitchyOmega /
  FoxyProxy and carry those conventions.

## 5. Success metrics (how we'll judge designs)

- **Time-to-first-working-proxy** for a new P1 user (target: under ~60s,
  minimal fields, no jargon encountered).
- **Clicks/keys to switch** the active proxy for P2 (target: ≤2 from the
  toolbar).
- **Glanceability**: active state + identity readable in <1s from the toolbar
  icon/popup.
- **Jargon exposure**: P1/P2 can complete their jobs **without ever seeing**
  PAC / CIDR / regex / subscription / per-protocol terminology.
- **Depth without dead-ends**: P3 can build, test, and trust a rule set;
  errors are explained in place.
- **Cognitive load**: number of distinct concepts/controls visible at each step
  stays low; advanced options are disclosed on demand.
- **Consistency**: one mental model for "a proxy" across popup, list, editor.

## 6. Out of scope for this review

Brand/logo redesign; net-new features beyond the JTBD above; backend/storage
changes. Focus is information architecture, flows, and the component/layout
language that serves the jobs above.
