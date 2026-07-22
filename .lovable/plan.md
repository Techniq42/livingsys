The new Supabase project (`eyoqexibycelhsatitwt`) is the live production database. The backup from the old Lovable Cloud project is set aside and will not be imported, merged, or migrated. The goal is to make the app read/write exactly against the existing new schema and identify which screens break.

### Phase 1 — Connection lock (no code changes yet)

1. Verify the Lovable Cloud/Supabase binding is now pointing to `eyoqexibycelhsatitwt` in the Cloud panel.
2. Allow the platform to regenerate the auto-generated files:
   - `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
3. Confirm the preview is now making requests to the new project URL (not `spoiizdwriqfspehbcwp`).
4. Do not restore the backup or run any migrations. The new project schema stays exactly as it is.

### Phase 2 — Screen audit against the new schema

1. Run a read-only inventory of the new schema to confirm current tables/functions/policies.
2. Map the app routes to the tables they require.
3. Use the live preview and/or browser automation to visit the key screens:
   - `/dashboard` (Hearth)
   - `/dashboard/radar`
   - `/dashboard/switchboard`
   - `/dashboard/conversations`
   - `/dashboard/outreach`
   - `/dashboard/ghl`
   - `/dashboard/canon`
   - `/dashboard/resources`
   - `/dashboard/nexus`
   - `/dashboard/settings`
   - `/nexus/constitution`
   - The Gemma drawer (floating AI widget)
4. Capture console errors, network failures, and UI behavior for each screen.

### Phase 3 — Produce the break list

1. Categorize each failure by root cause:
   - Missing table
   - Missing function
   - Missing RLS policy/grant
   - Missing edge function
   - Missing secret
   - Frontend code mismatch
2. Report the list to the user with severity (blocking vs. degraded).
3. Do not make any schema changes or migrations. If a fix is needed, recommend a minimal code change or confirm the user wants a schema change first.

### Outcome

A clean, verified connection to the new project and a prioritized list of which screens are broken against the existing schema. No changes to the database itself.