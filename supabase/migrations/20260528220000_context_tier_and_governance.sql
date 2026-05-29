-- =====================================================================
-- Migration: context_tier_and_governance
-- Date: 2026-05-28
-- Branch: feature/context-tier-and-governance
-- Purpose: Land the full Coke Vault vocabulary, open-ended 86 list
--          governance_constraints (pointing at the refusals detail
--          document), federation_operator role, and orchestrator-tree
--          escalation_log in a single PR. No follow-up migration.
--
-- Architectural note: Danny conducts the orchestra. Gemma-on-Groq is
-- Tier 0 (default lane). Claude is Tier 1 (edge). Shannon is Tier 2
-- (human-required). escalation_log carries parent_escalation_id so a
-- single user turn renders as a tree, not a line.
-- =====================================================================

-- ---------- 1. Coke Vault vocabulary (canonical) ----------
create type context_tier as enum (
  'public_canon',
  'federation_internal',
  'coke_vault_substrate',
  'coke_vault_operating_method',
  'coke_vault_game_layer',
  'coke_vault_product'
);

-- ---------- 2. context_envelope table ----------
create table context_envelope (
  id uuid primary key default gen_random_uuid(),
  tier context_tier not null,
  is_coke_vault boolean generated always as
    (tier::text like 'coke_vault_%') stored,
  source_ref text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index context_envelope_tier_idx on context_envelope(tier);
create index context_envelope_vault_idx on context_envelope(is_coke_vault);

-- ---------- 3. The 86 list ----------
-- Open-ended, numbered, append-only. Each row is a thin index pointing
-- at the canonical refusals detail document. The prose lives in the
-- governance doc; this table lets escalation envelopes reference it by
-- stable code. Constraints are added over time as edge cases get
-- written back into substrate as canon.
create table governance_constraints (
  id uuid primary key default gen_random_uuid(),
  number serial unique not null,         -- 86-list ordinal, append-only
  code text unique not null,             -- short stable identifier
  label text not null,                   -- human-readable name
  refusals_doc_url text not null         -- pointer to canonical detail
    default 'https://livingsys.org/canon/refusals',
  refusals_doc_anchor text,              -- #anchor inside refusals doc
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table governance_constraints is
  'The 86 list. Open-ended numbered constraints. Each row points at the '
  'canonical refusals detail document rather than embedding prose. '
  'Append-only; deactivate via active=false, do not delete.';

-- ---------- 4. escalation_log with orchestrator tree ----------
create type escalation_target as enum (
  'gemma.groq',
  'claude.anthropic',
  'human.shannon'
);

create table escalation_log (
  id uuid primary key default gen_random_uuid(),
  parent_escalation_id uuid references escalation_log(id),
  orchestrator text not null default 'danny',
  caller text not null,                  -- which edge function called
  target_model escalation_target not null,
  reason_code text not null,             -- tier_breach | low_confidence
                                         -- | vault_access | policy_check
                                         -- | human_required | etc.
  envelope_id uuid references context_envelope(id),
  constraint_id uuid references governance_constraints(id),
  decision text,                         -- result returned by target
  notify_fired boolean not null default false,
  created_at timestamptz not null default now()
);

create index escalation_log_parent_idx on escalation_log(parent_escalation_id);
create index escalation_log_target_idx on escalation_log(target_model);
create index escalation_log_reason_idx on escalation_log(reason_code);

comment on table escalation_log is
  'Orchestrator tree, not linear chain. Danny conducts. A single user '
  'turn may spawn multiple linked escalations across Gemma/Claude/human. '
  'parent_escalation_id renders the tree.';

-- ---------- 5. federation_operator role + RLS ----------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'federation_operator') then
    create role federation_operator;
  end if;
end$$;

grant usage on schema public to federation_operator;
grant federation_operator to authenticated;

alter table context_envelope enable row level security;

-- anon: public_canon only
create policy ce_anon_read on context_envelope
  for select to anon
  using (tier = 'public_canon');

-- authenticated (Tier Two): public_canon + federation_internal
create policy ce_auth_read on context_envelope
  for select to authenticated
  using (tier in ('public_canon','federation_internal'));

-- federation_operator (Tier Three): + substrate + operating_method
-- game_layer and product remain service-role-only.
create policy ce_fedop_read on context_envelope
  for select to federation_operator
  using (tier in (
    'public_canon',
    'federation_internal',
    'coke_vault_substrate',
    'coke_vault_operating_method'
  ));

alter table governance_constraints enable row level security;
create policy gc_read_active on governance_constraints
  for select to anon, authenticated, federation_operator
  using (active = true);

alter table escalation_log enable row level security;
create policy el_fedop_read on escalation_log
  for select to federation_operator using (true);

-- ---------- 6. context_envelope_with_constraints view ----------
-- Joins the active 86 list into every envelope so escalation calls
-- carry the refusals upstream of the user prompt. Each constraint
-- includes a pointer to the canonical refusals detail document.
create or replace view context_envelope_with_constraints as
select
  e.*,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
       'number', gc.number,
       'code', gc.code,
       'label', gc.label,
       'refusals_doc_url', gc.refusals_doc_url,
       'refusals_doc_anchor', gc.refusals_doc_anchor)
       order by gc.number)
     from governance_constraints gc
     where gc.active = true),
    '[]'::jsonb
  ) as governance_constraints,
  'Refer to the refusals detail document for full prose of each constraint.'
    as governance_constraints_note
from context_envelope e;

grant select on context_envelope_with_constraints to
  anon, authenticated, federation_operator;
