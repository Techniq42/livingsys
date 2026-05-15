# Nexus Master Surface — Fire Defense Proving Slice

The Nexus is the dashboard system. Inside it, each Room is a Gemma-instance expression (venue + mode). Shannon's view exposes the full spectrum; downstream operators (Walter next) get the same template with explicit, query-driven lockdowns. Fire defense + Reddit Outreach is the first end-to-end loop. Three venue skins prove the visual pattern. The Advocacy Redirect Layer ships with referrer-aware framing on day one.

## What ships

**1. Schema slice** (one migration, privilege baked in everywhere)

- `topic_verticals` — slug, name, status. Seed: `fire_defense` active.
- `voice_templates` — slug, venue, register_notes, system_prompt_fragment, drift_guardrails jsonb, **min_privilege** (admin|operator|node). Seed: `voice.fire_defense.reddit` (peer-to-peer, receipts-not-claims, no advocacy register), `voice.fire_defense.bluesky` (gentler open, receipts-as-gift), `voice.fire_defense.telegram` (operator-direct).
- `redirect_targets` — slug, destination_url, topic, **audience_frames jsonb** (default + per-referrer-context frame: copy, CTA label, CTA url), click_count, conversion_count, video_url (HyperFrames placeholder), **min_privilege**. Seed: `livingsys.org/fire-defense/guide/` with three frames (default / institutional / practitioner).
- `redirect_clicks` — redirect_target_id, referrer, ua, ip_hash, clicked_at, draft_id (optional attribution).
- `skills` — slug, name, category (composition | guardrail | redirect | voice), description, prompt_fragment, **always_loaded boolean**, **min_privilege**, sort_order. Seed: `voice.load`, `redirect.suggest`, and always-loaded guardrails `governance.86_protocol` + `governance.four_drift_check` (stubs — Shannon authors content later, the rack slot exists now).
- `nexus_modes` — slug (outreach, triage, edit, video…), label, status (live | stub), **min_privilege**.
- `nexus_lanes` — slug (reddit, bluesky, telegram, x, linkedin, healing, capital, ria, fls, youtube), label, skin_token, status, **min_privilege**.

Privilege filter pattern: every config query joins `has_role()` against `min_privilege`. Walter's lockdown is a where-clause, not a parallel system.

**2. n8n contract update**

After Gemma drafts the response body for a Radar thread, a new step calls a Supabase RPC (`select_redirect_for_draft`) that returns the best `redirect_targets` row for the topic + venue, picks the right frame, and persists `selected_redirect_id` + `selected_frame_key` on `response_drafts`. The draft body gets the chosen CTA/url appended via natural-voice handoff language. Edge function `n8n-webhook` already handles the persistence path; we add the new fields.

**3. Multi-frame redirect handler** — new edge function `r` (verify_jwt off)

`/r/:slug` resolves the slug, reads `Referer` header, matches against `audience_frames` keys (regex per frame for `worldbank|wbg`, `un.org|untreaty`, `reddit|forum`, default fallback), inserts a `redirect_clicks` row, then 302s to the destination. Conversion attribution by `?d=<draft_id>` query param when n8n includes it.

**4. Nexus surface at `/nexus`**

```text
+------------+----------------------------------+----------------+
| LANES      | CENTER (Room workspace)          | ACTION PANEL   |
| Reddit  *  |  Mode: Outreach                  | Skills rack    |
| Bluesky    |  Topic: Fire Defense             |  - voice.load  |
| Telegram   |                                  |  - redirect.   |
| X          |  Live thread queue (from         |    suggest     |
| LinkedIn   |  community_threads + drafts)     |                |
| Healing    |                                  | Guardrails     |
| Capital    |  Selected thread:                |  (always-on)   |
| RIA        |   - thread snippet               |  - 86 Protocol |
| FLS        |   - draft body                   |  - four-drift  |
| YouTube    |   - selected redirect + frame    |                |
+------------+  - approve / edit / kill         | Redirects      |
                                                |  candidates +  |
                                                |  click stats   |
+--------------------------------------------------------------+
| Mode switcher: Outreach* | Triage | Edit | Video | ...        |
+--------------------------------------------------------------+
```

- Lanes: Reddit live, Telegram + Bluesky live as skin demos (empty queues with placeholder copy), rest stubbed but visible.
- Modes: Outreach live, others stubbed.
- Center pane reads from `community_threads` joined with `response_drafts` filtered by topic + venue.
- Action panel — Skills rack lists optional skills; Guardrails rack is read-only and always-on (visual signal that they're in every prompt assembly).
- Floating Codex AI widget continues to render across `/nexus`.

**5. Three venue skins** — CSS theme tokens per lane

`src/styles/skins/` with `reddit.css` (utilitarian — sharper edges, denser type, mono-leaning labels), `telegram.css` (operator-direct — terminal-flat, monospace headers, minimal chrome), `bluesky.css` (soft-warm — rounded, lower contrast, generous whitespace, warmer hues). Theme token swap on `[data-skin]` attribute on the Nexus shell. Skins live as semantic-token overrides on top of the existing dark Living Systems palette so the design system stays coherent.

**6. Migration of `/dashboard/radar` → Outreach mode in `/nexus`**

`/dashboard/radar` stays live as the safety net. Sidebar gets a new top-level "Nexus" link. After one operator pass that proves the loop, we retire `/dashboard/radar` (separate slice).

**7. Explicitly NOT in this slice**

HyperFrames generation, faceless YouTube production wiring, Whisper input adapter, RSS publishing infrastructure, Walter operator onboarding, capital/RIA/FLS modes, CAPTCHA re-enable, GHL replacement work, the actual content of 86 Protocol / four-drift check signatures (rack slot only).

## Build order

1. Schema migration (single file, all tables + seed rows)
2. `select_redirect_for_draft` RPC + n8n-webhook update for the new draft fields
3. `r` edge function (multi-frame handler + click logging)
4. Nexus shell route + lane/mode/skill/guardrail data hooks
5. Reddit Outreach mode wired to live data
6. Three skins (CSS theme tokens + skin switcher on lane select)
7. Sidebar entry, route guard, role-aware visibility filter
8. Smoke test: thread → draft → redirect picked → click logged → conversion stat surfaces in action panel

## Technical notes

- All config tables use `min_privilege text` with a CHECK against `('admin','operator','node')`. RLS policies use existing `has_role()` plus a privilege comparison helper added in the same migration.
- `audience_frames` shape: `{ "default": {copy, cta_label, cta_url}, "institutional": {...}, "practitioner": {...} }`. Frame matching is a deterministic ordered regex pass in the `r` function — first match wins, default is fallback.
- `always_loaded` skills get pulled into the prompt assembly unconditionally by the n8n flow; the UI shows them in a separate read-only rack so the operator can see what protections are running but cannot toggle them off (service-dog pattern even at admin).
- Skin tokens override `--background`, `--card`, `--border`, `--radius`, `--font-display`, `--font-body` via `[data-skin]` selectors in `index.css`. No new color systems — semantic tokens only.
- Vocabulary lock applied to new tables and new code paths only. Existing `response_drafts` / `community_threads` keep their names; we'll rename in a future slice if/when the cost is justified.

## Open questions deferred to next slice

- Walter's onboarding flow (operator-room provisioning UI, node-vetting checklist, lockdown-release per-item interface)
- Codex page referrer detection on the destination side (right now we route at the redirect; per-page audience-context rendering on shannondobbs.com / livingsys.org is its own slice)
- Federation feed publishing (RSS for podcast monetization, YouTube channel feed)
- Retiring `/dashboard/radar` after the loop is proven