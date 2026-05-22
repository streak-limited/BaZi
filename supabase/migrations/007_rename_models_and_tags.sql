-- Product catalog: modal_templates → models
-- Tags: normalized tables (not JSON config)

-- ---------------------------------------------------------------------------
-- Rename catalog table (existing deployments)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'modal_templates'
  ) then
    alter table public.modal_templates rename to models;
  end if;
end $$;

comment on table public.models is 'Product SKU / report model (八字、財運、合盤…)';

-- ---------------------------------------------------------------------------
-- trials.modal_template_id → model_id
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trials'
      and column_name = 'modal_template_id'
  ) then
    alter table public.trials rename column modal_template_id to model_id;
  end if;
end $$;

alter index if exists idx_trials_modal rename to idx_trials_model;

-- ---------------------------------------------------------------------------
-- Tags (home page filter pills)
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id text primary key,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_tags_label on public.tags (label);

comment on table public.tags is 'Home page filter labels (戀愛, 財運, …)';

create table if not exists public.model_tags (
  model_id text not null references public.models (id) on delete cascade,
  tag_id text not null references public.tags (id) on delete cascade,
  primary key (model_id, tag_id)
);

create index if not exists idx_model_tags_tag on public.model_tags (tag_id);

comment on table public.model_tags is 'Many-to-many: which models appear under which filter tags';

-- ---------------------------------------------------------------------------
-- Seed tags + link default BaZi model
-- ---------------------------------------------------------------------------
insert into public.tags (id, label, sort_order) values
  ('love', '戀愛', 10),
  ('wealth', '財運', 20),
  ('marriage', '合婚', 30),
  ('general', '綜合', 40)
on conflict (id) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.model_tags (model_id, tag_id) values
  ('bazi_full', 'general'),
  ('bazi_full', 'love')
on conflict (model_id, tag_id) do nothing;

-- Remove tags from JSON config (source of truth is model_tags)
update public.models
set config = config - 'tags'
where config ? 'tags';
