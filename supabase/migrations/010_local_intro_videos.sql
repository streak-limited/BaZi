-- Point intro scene 1 away from legacy Supabase immersion URL (use /public/video/*.mp4).
update public.modal_templates
set config = jsonb_set(
  config,
  '{media}',
  coalesce(config->'media', '{}'::jsonb) || jsonb_build_object(
    'introVideo', '/video/1.mp4',
    'introVideo1', '/video/1.mp4',
    'introVideo2', '/video/2.mp4',
    'introVideo3', '/video/3.mp4'
  ),
  true
)
where id = 'bazi_full';
