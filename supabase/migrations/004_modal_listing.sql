-- Home page card: image, description, optional view_count override
update public.modal_templates
set config = config || jsonb_build_object(
  'listing', jsonb_build_object(
    'image', 'https://picsum.photos/seed/bazi-full-report/688/568',
    'description', '完整八字命盤解讀，從性格、感情到事業與流年運勢',
    'view_count', 12000,
    'badge', '推薦'
  )
)
where id = 'bazi_full';
