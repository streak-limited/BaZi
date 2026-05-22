-- Product flow: modal templates, trials, deliverables, payments
-- Run in Supabase SQL Editor or: supabase db push

-- ---------------------------------------------------------------------------
-- Modal = product template (八字完整報告, 財運專章, …)
-- ---------------------------------------------------------------------------
create table if not exists public.modal_templates (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  family text not null default 'bazi',
  version int not null default 1,
  config jsonb not null default '{}'::jsonb,
  template_entries_ref text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.modal_templates is 'Product SKU / modal type; scales to many report products';
comment on column public.modal_templates.config is 'e.g. { "phases": ["pre_report","full_report"], "page_count": 20, "price_hkd": 88 }';

-- ---------------------------------------------------------------------------
-- Trial = one user run (input → pre-report → pay → full report)
-- ---------------------------------------------------------------------------
create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  modal_template_id text not null references public.modal_templates (id),
  email text not null default '',
  user_input jsonb not null,
  birth_place jsonb,
  locale text not null default 'zh-Hant',
  status text not null default 'started',
  stripe_checkout_session_id text,
  stripe_payment_status text,
  paid_at timestamptz,
  error_message text,
  legacy_subject_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trials_public_token on public.trials (public_token);
create index if not exists idx_trials_modal on public.trials (modal_template_id, created_at desc);
create index if not exists idx_trials_email on public.trials (email);
create index if not exists idx_trials_status on public.trials (status);

comment on table public.trials is 'One purchase/generation run; share via public_token';
comment on column public.trials.status is 'started | pre_report_generating | pre_report_ready | checkout_pending | paid | full_generating | completed | failed';

-- ---------------------------------------------------------------------------
-- Deliverable = saved output per phase (AI already run — link replays DB)
-- ---------------------------------------------------------------------------
create table if not exists public.trial_deliverables (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references public.trials (id) on delete cascade,
  phase text not null,
  deliverable_key text not null default 'main',
  content jsonb not null,
  ai_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trial_id, phase, deliverable_key)
);

create index if not exists idx_deliverables_trial on public.trial_deliverables (trial_id);

comment on column public.trial_deliverables.phase is 'pre_report | full_report | custom per modal config';

-- ---------------------------------------------------------------------------
-- Payments (Stripe)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references public.trials (id) on delete cascade,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents int,
  currency text not null default 'hkd',
  status text not null default 'pending',
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_trial on public.payments (trial_id);
create index if not exists idx_payments_session on public.payments (stripe_session_id);

-- ---------------------------------------------------------------------------
-- Email audit log
-- ---------------------------------------------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid references public.trials (id) on delete set null,
  to_email text not null,
  template text not null,
  subject text,
  status text not null default 'queued',
  provider_message_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed: 八字完整報告 (v1)
-- ---------------------------------------------------------------------------
insert into public.modal_templates (id, slug, display_name, family, version, config, template_entries_ref)
values (
  'bazi_full',
  'bazi-full-report',
  '八字完整命理報告',
  'bazi',
  1,
  '{"phases":["pre_report","full_report"],"page_count":20,"price_hkd":88,"pre_report_entries_ref":"pre-report-analysis.json","full_report_entries_ref":"ai_generated_content.json"}'::jsonb,
  'bazi_full_v1'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  config = excluded.config,
  template_entries_ref = excluded.template_entries_ref;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trials_updated_at on public.trials;
create trigger trials_updated_at
  before update on public.trials
  for each row execute function public.set_updated_at();

drop trigger if exists trial_deliverables_updated_at on public.trial_deliverables;
create trigger trial_deliverables_updated_at
  before update on public.trial_deliverables
  for each row execute function public.set_updated_at();
