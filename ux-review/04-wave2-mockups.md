# Wave 2 core — mockups, red-team, and resolved build plan

> Phase 3 of the roadmap (§6): mock the Wave 2 core (items 9–12), red-team it,
> resolve the design, then build. This doc is the resolved design + plan.
>
> Artifacts: `mockups/wave2-core.html` (rev 2) and `mockups/wave2-core.png`.
> Full red-team verdicts are summarized below.

## Items covered

- **9** — progressive-disclosure proxy editor (basic server by default; depth on demand)
- **10** — unify "Add Proxy" + "Add Auto-Proxy" into one entry; routing is a type
- **11** — "Save & Turn On" fuses create + activate
- **12** — popup reads as a single-select, not independent toggles

## Red-team verdicts (and what we changed)

| Item | Verdict | Change applied to the design |
|---|---|---|
| 9 | Ship with changes | Split **identity (color/badge)** out of the networking "More options" drawer into its own always-visible row — P2 must not open an advanced-networking drawer to set a color (J4). Validation must be **inline, field-adjacent, `aria-live`**, focus moved to the field — do not inherit E8 (error at bottom of modal). Keep the **real term (PAC/SOCKS)** discoverable for migrators. |
| 10 | Reconsider (as a gate) | **Do not gate.** A separate "what kind?" pre-screen adds a step and regresses time-to-first-proxy. The editor opens **straight on the basic server form**; "what kind" is an inline **Connection type** selector in the form. Unifying the two Add buttons happens without a pre-step. |
| 11 | Ship with changes | Define the **permission/validation/escape states** (below). Add a secondary **"Save"** (don't-activate) verb beside "Save & Turn On" — P2/P3 routinely build a proxy they don't want on yet. |
| 12 | Ship with changes | **One control, not two.** Remove the master On/Off segment; the **"No proxy (direct)" row is the off state**. The list is the only control. Spec it as a `radiogroup` (roving tabindex, `aria-checked`); active = check + color bar (never color-only); unselected rows must not read as "disabled". |

**Biggest risk identified:** "Save & Turn On" silently mishandling the credential
permission prompt — a *correctness* bug, not a preference. Resolved by the state
machine below.

## Resolved decisions

### Editor (items 9, 10)
- New proxies open directly on the **basic server form**: Connection type
  (inline selector, default "Connect through a server"), Name + color + optional
  badge (identity row), Server host + port, a "Needs a username & password?"
  disclosure, and a "More options" disclosure holding **networking only**
  (per-protocol servers, protocol/scheme, bypass list).
- The **Connection type** selector replaces the two Add buttons. Options use
  plain language with the real term as a sub-label ("Route by site · rules/PAC",
  "Use system settings · system"). "Route by site" hands off to the routing
  scaffold — **must be built in lockstep with item 15** (else it's a dead-end
  button); until item 15, "Route by site" routes to the existing Auto-Proxy editor.
- Validation: inline + `aria-live` + focus-to-field (fixes E8 at the source).

### "Save & Turn On" state machine (item 11) — the correctness-critical part
Two primary actions in the footer: **Save** (persist, do not change the active
proxy) and **Save & Turn On** (persist, then activate).

`Save & Turn On` resolves as:
1. Validate → on failure, show inline errors, focus first bad field, **do not close**.
2. Persist the config.
3. If the config has credentials and the optional `webRequest` +
   `webRequestAuthProvider` permission is **not** granted → request it (this is
   the existing `maybeRequestAuthPermissions` flow, which must run in the click's
   user-gesture turn):
   - **Granted** → activate; toast "Proxy "X" is on".
   - **Denied** → still activate (the proxy works; Chrome will show its native
     auth dialog per request), but toast the honest state: "Proxy "X" is on —
     grant the network permission to fill credentials automatically, or Chrome
     will ask." **The button's promise ("Turn On") is kept** (it IS on); only
     the auto-credential convenience is deferred. No undefined saved-but-not-on
     state.
4. Activate via the existing `settingsStore.setProxy(id, true)` path.

`Save` simply persists (no activation, no permission prompt) and closes.

This removes the three failure modes the red-team flagged: there is always a
defined state, the label never lies, and there is an escape hatch.

### Popup (item 12)
- A single `radiogroup`: the active proxy is `aria-checked`, others are
  selectable "switch to" rows, and **"No proxy (direct)" is a permanent row** =
  the off state. No separate master toggle (it double-encoded "off").
- Keyboard: roving tabindex, arrow keys move/activate selection. Active row uses
  a check + left color bar; unselected rows keep full contrast (not "disabled").
- The Wave-1 top status hero stays as the read-out; the list is the control.

## Build plan & sequencing

Build order (each independently shippable, behind the test net):

1. **Editor restructure (items 9 + 10)** — the biggest change. Touches
   `ProxyConfigModal.svelte`, `BasicSettings.svelte`, `ProxyModeSelector.svelte`
   (becomes the inline Connection-type selector), `ManualProxyConfiguration.svelte`
   (identity out of the networking drawer). **e2e impact: high** — the traffic
   specs and comprehensive create-flows drive the editor heavily
   (`getByRole('radio', { name: 'Manual Configuration' })`, `single-proxy-host-input`,
   the `modal-title`). These selectors will need updating in lockstep; keep the
   `data-testid`s stable where possible and add new ones for the Connection-type
   control.
2. **"Save & Turn On" (item 11)** — add the second footer verb + the state
   machine above in `Options.svelte`'s save handler and the modal footer.
   Reuses `maybeRequestAuthPermissions` and `settingsStore.setProxy`.
3. **Popup selection model (item 12)** — `Popup.svelte` + `ScriptItem`'s POPUP
   branch become a `radiogroup`; add the "No proxy (direct)" row; remove the
   per-row independent toggle semantics. Add the keyboard/aria spec.

**Out of lockstep risk:** item 10's "Route by site" needs item 15 (staged
Auto-Proxy) to not be a dead-end. Until item 15 lands, "Route by site" opens the
existing Auto-Proxy editor — acceptable as an interim, but item 15 should follow
closely.

## Validation before merge
Each item ships with: real-traffic/e2e green (updated selectors), `aria-live`/
`radiogroup` verified, and a screenshot of the new flow in light + dark. The
Save & Turn On permission-deny path should get an explicit e2e or documented
manual check (the optional-permission grant can't be automated headless — same
constraint as the auth flow, so the state logic should be unit-tested).
