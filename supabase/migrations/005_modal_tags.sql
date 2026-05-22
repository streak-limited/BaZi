-- Home page filter tags per modal
update public.modal_templates
set config = config || jsonb_build_object('tags', '["綜合","戀愛"]'::jsonb)
where id = 'bazi_full';
