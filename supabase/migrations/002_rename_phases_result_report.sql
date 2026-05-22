-- Rename deliverable phases and trial statuses: pre_report → result, full_report → report

update public.trial_deliverables set phase = 'result' where phase = 'pre_report';
update public.trial_deliverables set phase = 'report' where phase = 'full_report';

update public.trials set status = 'result_generating' where status = 'pre_report_generating';
update public.trials set status = 'result_ready' where status = 'pre_report_ready';
update public.trials set status = 'report_generating' where status = 'full_generating';

update public.modal_templates
set config = config
  - 'pre_report_entries_ref'
  - 'full_report_entries_ref'
  || jsonb_build_object(
    'result_entries_ref', config->'pre_report_entries_ref',
    'report_entries_ref', config->'full_report_entries_ref',
    'phases', '["result","report"]'::jsonb
  )
where id = 'bazi_full' and config ? 'pre_report_entries_ref';

update public.modal_templates
set config = jsonb_set(config, '{phases}', '["result","report"]'::jsonb)
where config->'phases' = '["pre_report","full_report"]'::jsonb;
