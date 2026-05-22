-- Prompt + layout slots per model and phase (result | report)
-- entry_key: stable id for UI (e.g. pre-ai-narrative-1) — used in deliverables + components

create table if not exists public.model_prompt_entries (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.models (id) on delete cascade,
  phase text not null check (phase in ('result', 'report')),
  entry_key text not null,
  page int not null default 1,
  display_order int not null default 0,
  entry_type text not null default 'static'
    check (entry_type in ('static', 'computed', 'ai')),
  description text not null default '',
  section text,
  static_content text,
  prompt_template text,
  image_url text,
  image_url_proxy text,
  length_min int,
  length_max int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, phase, entry_key)
);

create index if not exists idx_model_prompt_entries_model_phase
  on public.model_prompt_entries (model_id, phase, display_order);

comment on table public.model_prompt_entries is
  'Page layout + AI prompt templates per product model; generation fills content into trial_deliverables';

drop trigger if exists model_prompt_entries_updated_at on public.model_prompt_entries;
create trigger model_prompt_entries_updated_at
  before update on public.model_prompt_entries
  for each row execute function public.set_updated_at();
