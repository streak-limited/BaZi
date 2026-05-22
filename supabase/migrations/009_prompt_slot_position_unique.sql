-- Slot identity = model + phase + page + display_order (entry_key is derived from slug)

alter table public.model_prompt_entries
  drop constraint if exists model_prompt_entries_model_id_phase_entry_key_key;

create unique index if not exists uq_model_prompt_slot_position
  on public.model_prompt_entries (model_id, phase, page, display_order);

comment on column public.model_prompt_entries.entry_key is
  'Derived: {model_slug}-{phase}-{page}-{display_order} — not typed by admins';
