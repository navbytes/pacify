# Wave 3 — status

Final disposition of every Wave 3 item from `03-roadmap.md`. Built on top of the
shipped Wave 1 and Wave 2 core (items 1–12).

| # | Item | Status |
|---|------|--------|
| **15** | Stage the Auto-Proxy editor (Rules / Rule lists / Fallback / Test as tabs) | ✅ **Shipped** — tabs replace the one-scroll dump (fixes E2, sev 4); Pattern Tester now always reachable. |
| **16** | Collapse the repeated 6-field ProxySelector | ✅ **Shipped (effective)** — the inline fields already collapse until "Enter a server" is chosen; de-jargoned "Define Inline" → "Enter a server", "Select Proxy" → "Pick a saved proxy". |
| **18** | Toolbar icon shows the active proxy's color | ✅ **Already implemented** — the background badge already uses `proxy.color` when active and a grey default when off (`background.ts updateBadge`). No change needed. |
| **19** | Subscription de-jargon | ✅ **Shipped** — "Subscriptions" → "Rule lists", "Add Subscription" → "Add a rule list". |
| **20** | Resolve grid-vs-list | ✅ **Verified — no change** — the two views *do* render meaningfully differently (grid = multi-column cards; list = full-width rows with inline actions). The eval's "byte-identical" screenshots were a capture artifact (the list toggle hadn't applied). Re-verified with a real toggle. |
| **21** | PAC editor: URL vs paste as one explicit choice | ✅ **Shipped** — a "Where's the PAC script?" toggle ("Write it here" / "Load from a URL") replaces the implicit URL-wins precedence. |
| **17** | Conditional "Routing" nav section | ⏸️ **Deferred (N/A to current IA)** — see below. |

## Why item 17 is deferred

The conditionally-visible "Routing" nav was a **greenfield** idea (`01-greenfield-design.md`) predicated on a left-nav information architecture. Pacify's current options page is a **tab** layout (Proxy Configs / Settings / Diagnostics), and rule-based routing now lives **inside a proxy** (the "Route by site" connection type, item 10) rather than as a separate top-level destination. So a separate "Routing" nav item doesn't map onto the IA we actually adopted under the "restructure where it pays off" budget — it would presuppose the larger left-nav redesign that was explicitly out of scope.

The underlying goal of item 17 — *keep PAC/CIDR/regex out of sight for P1/P2* — is already met by the work that shipped: routing is a deliberate "Route by site" choice, the routing depth lives behind that choice, and the editor/cards/popup are de-jargoned. Revisit item 17 only if/when a left-nav IA redesign is taken on.

## Net result across the whole initiative

Waves 1–3 delivered: de-jargoned cards/editor/onboarding; an explicit, honest editor (default-to-server, progressive disclosure, one Connection type, Save & Turn On); a single "Add proxy" with routing as a type; an honest single-select popup; safer Restore; broad a11y fixes; a staged Auto-Proxy editor; and explicit PAC/subscription/source language — all behind the headless + real-traffic test net (447 unit + 55 e2e green).
