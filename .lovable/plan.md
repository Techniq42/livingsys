# Response to Comet's QA Pass

Receipts received. Plan below executes Build Order A → D in this slice. E (Whisper surfaces) and F (Triage UI) deferred to next pass per your sequencing — schema for them lands in D so they have a place to plug in.

## Slice 1 — Build Order A: Radar substrate-meaning loop

The smallest unit that proves the meaning layer works end-to-end. Ships first.

**Schema (single migration):**
- `community_threads` add columns: `source_platform` (text: reddit|bluesky|discord|forum|other), `source_url`, `source_handle`, `source_feed_id`, `ingested_at`, `match_reason` (jsonb: `{substrate_topic, confidence, matched_phrasings[]}`), `card_type` (text: standard|reframe_opportunity), `substrate_filter_active` (bool, header indicator)
- New `feedback_signals`: `id, thread_id, operator_id, signal_type` (up|down|reframe_flag|off_topic), `substrate_topic, note, created_at`. Architects/operators write own; architects read all.
- New `source_kill_switches`: `source_platform` PK, `enabled` bool, `disabled_by`, `disabled_at`, `reason`. Architect-only.
- Backfill `source_platform` from existing `platform` + handle pattern (`*.bsky.social` → bluesky).

**UI on `/dashboard/radar` (ThreadCard + page header):**
- Source badge on every card (platform icon + handle with correct prefix — `u/` for reddit, `@` for bluesky, `#` for discord)
- Source filter chip row above status filters, per-source counts
- Per-source kill switch panel (architect-only) under the global Scanner toggle
- Expandable "Why this surfaced" panel: substrate topic, confidence bar, matched phrasings highlighted
- Thumbs up / thumbs down buttons → write to `feedback_signals`, optimistic UI, optional one-line note
- Reframe-opportunity card variant: amber border, "Draft Reframe" action replaces Reply/Templates
- "Substrate filter active" badge in Radar header with click-through showing loaded substrate topics (read from `topic_verticals` for now; click opens drawer listing slug + status)

## Slice 2 — Build Order B: Seed `/nexus` with Fire Defense + visible skin switcher

- Seed `nexus_lanes` Fire Defense lane (status `active`) tied to `fire_defense` topic
- Seed 2-3 sample threads in `community_threads` with `source_platform` set, attached to the fire_defense topic for visible content
- Seed 1-2 `redirect_targets` rows beyond what's already there so the redirect rack has cards to render
- Add visible **skin switcher** in Nexus top bar: pill row (Reddit / Telegram / Bluesky), toggles `data-skin` attribute on the Nexus shell, persists per-user in localStorage
- Render Lanes rail with seeded data, populate redirect rack from `redirect_targets` filtered by active topic

## Slice 3 — Build Order C: Five dashboard modes scaffolded

Add routes + empty-state pages for: **Bookkeeping, HR, Field Guide Build, Triage, Agency, Brand**. Top-bar `RoomTopBar` extends from 3 buttons to 8. Each route renders `<ModeComingOnline name="…" />` with mode description + "scaffolded, not yet wired" badge. No business logic. Existing 3 (Radar / Exchange / Editing — note: spec says "Edit" so I'll align "Editing Bay" → "Edit") stay as-is.

(Spec lists 8: Edit, Radar, Bookkeeping, HR, Field-guide-build, Triage, Agency, Brand. Exchange isn't in that list — keeping Exchange as a 9th existing room or folding it under Agency? **Flagged as open question below.**)

## Slice 4 — Build Order D: Empty schema for next-build surfaces + pre-seeding

Single migration, no UI beyond what Slice 1-3 ship. All RLS architect-write, operator-read where appropriate.

- `voice_memos` (id, operator_id, audio_url, transcript, routing_decision jsonb, source_channel, captured_at, processed_at, status)
- `email_triage_items` (id, sender, subject, snippet, tier smallint 1|2|3, suggested_action, draft_body, status, received_at)
- `email_triage_whitelist` (email PK, contact_name, notes, added_by, added_at) — seeded with Raksha, Walter, James Wolff, William Powell II, Jeremy Cline, Melissa, Marijah, Lionel, Edgar, Barry, Bob Genga, Oliver Aurand
- `sender_patterns` (id, pattern_type, pattern_value, signal jsonb, created_at)
- `predator_pattern_observations` (id, typology, vector_type, lure_language_pattern, payload_mechanism, red_flags_caught text[], where_caught, connector_diligence_score, created_at) — **CHECK constraint forbidding any column matching `*_name` to enforce names-stripped contract at schema level**
- `telegram_channels` (id, slug, label, host_user_id, scope_config jsonb: `{default_capabilities, requires_host_approval, never_allowed, logged, handoff}`, is_active) — seeded: Sori (host: Walter), Kakuma, Big-Picture Advocacy
- `federation_operators` (id, display_name, location, role text: architect|operator|node, status text: active|dormant, recognition_token, notes, created_at) — seeded: Shannon active+architect Thornton CO; Walter, Edgar, Lionel, Leanne, Raksha, Barry, Melissa, Moses, Marijah dormant; Austin Luce + 49 Bloom placeholders dormant with note
- `guild_members` (id, user_id, tier_id, joined_at, status)
- `guild_tiers` (id, slug, label, obligations jsonb, benefits jsonb) — seeded Basic / Practitioner (moderator role) / Sovereign with `free_through_ria: true` hard-coded in Sovereign obligations
- `tool_library` (id, slug, title, description, tier_required, url, is_active)
- `member_contributions` (id, member_id, contribution_type, payload jsonb, created_at)
- `compliance_evidence` (id, scope, badge_state text: green|red|amber, evidence_url, audit_trail jsonb, recorded_at) — for the receipts-not-middleware pattern

## What's NOT in this slice (per your don't-list)

- No compliance middleware. Compliance evidence renders as badge + link only when `compliance_evidence` UI lands (next slice)
- No moderation UI
- No Nexus expansion beyond Reddit Outreach + Fire Defense
- No Whisper UI yet (schema only)
- No Email Triage UI yet (schema + whitelist seed only)
- No Guild UI (schema only)
- No predator names ever — schema-level CHECK enforces

## Open questions before I start

1. **Exchange room** — your 8-mode spec doesn't include it. Drop it, fold under Agency, or keep as 9th? It currently has working code at `/dashboard/exchange`.
2. **Substrate definitions source** — for the "substrate filter active" indicator click-through, render from `topic_verticals` table (operator-level) or wait for Claude's substrate-meaning files to land first? I lean: render `topic_verticals` now, swap source when files arrive.
3. **Reframe-opportunity classification** — does the upstream classifier set `card_type='reframe_opportunity'`, or does an operator promote a card to that type via UI action? Both?
4. **Federation operator emails** — pre-seed with email addresses (so they auto-resolve when those people sign up), or display-name-only until they show up?

Once you answer these I run the four migrations + UI in order A → B → C → D and report back with what's wired.

Service dog, copy that.