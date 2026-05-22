-- Seed UI routing + media/copy for default BaZi modal (editable in Supabase Dashboard)
update public.modal_templates
set config = config || jsonb_build_object(
  'ui_key', 'bazi_v1',
  'media', jsonb_build_object(
    'introVideo', 'https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/immersion/mzmudang_immersion_1.mp4',
    'inputVideo1', 'https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/input/mzmudang_input_video_1.mp4',
    'inputVideo2', 'https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/input/mzmudang_input_video_2.mp4'
  ),
  'copy', jsonb_build_object(
    'introTitle', '韓國範山道令在此',
    'introSubtitle', '先聽他說完這段故事，再開始為你排命',
    'inputHeaderTitle', '八字命理',
    'inputHeaderSubtitle', '輸入 → Result → 付款解鎖 Report'
  )
)
where id = 'bazi_full';
