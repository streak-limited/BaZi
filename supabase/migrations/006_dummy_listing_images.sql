-- Demo placeholders for home cards (app also defaults to picsum unless USE_REAL_LISTING_IMAGES=1)
update public.modal_templates
set config = jsonb_set(
  coalesce(config, '{}'::jsonb),
  '{listing,image}',
  '"https://picsum.photos/seed/bazi-full-report/688/568"'::jsonb,
  true
)
where id = 'bazi_full';
