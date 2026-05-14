-- Remove old seeded/test demo data from the shared production schema.
-- Runtime demo cases are now admin-gated in the application and clearly marked as demo data.

with candidate_workflows as (
  select id
  from public.workflows
  where id = '22222222-2222-4222-8222-222222222222'::uuid
     or organization_case_reference ilike 'DEMO%'
     or name ilike 'demo - %'
     or name ilike '% test%'
     or name ilike 'test%'
     or estate_name ilike '%test%'
     or deceased_name ilike '%test%'
     or estate_name in ('Marian Ellis','Margaret Collins','Testing Dead Guy','Mark Test')
     or deceased_name in ('Marian Ellis','Margaret Collins','Testing Dead Guy','Mark Test')
), candidate_tasks as (
  select id from public.tasks where workflow_id in (select id from candidate_workflows)
), candidate_orgs as (
  select id
  from public.organizations
  where id = '11111111-1111-4111-8111-111111111111'::uuid
     or slug ilike '%demo%'
     or name ilike '%demo%'
), d_messages as (
  delete from public.messages where estate_id in (select id from candidate_workflows) or related_task_id in (select id from candidate_tasks) returning 1
), d_announcements as (
  delete from public.announcements where estate_id in (select id from candidate_workflows) returning 1
), d_estate_events as (
  delete from public.estate_events where estate_id in (select id from candidate_workflows) returning 1
), d_estate_user_context as (
  delete from public.estate_user_context where estate_id in (select id from candidate_workflows) returning 1
), d_estate_participants as (
  delete from public.estate_participants where estate_id in (select id from candidate_workflows) returning 1
), d_urgent_sessions as (
  delete from public.urgent_sessions where estate_id in (select id from candidate_workflows) returning 1
), d_outcomes as (
  delete from public.outcomes where estate_id in (select id from candidate_workflows) returning 1
), d_documents as (
  delete from public.documents where workflow_id in (select id from candidate_workflows) returning 1
), d_events as (
  delete from public.events where workflow_id in (select id from candidate_workflows) returning 1
), d_obituaries as (
  delete from public.obituaries where workflow_id in (select id from candidate_workflows) returning 1
), d_marketplace as (
  delete from public.marketplace_interactions where workflow_id in (select id from candidate_workflows) returning 1
), d_referrals as (
  delete from public.referrals where workflow_id in (select id from candidate_workflows) returning 1
), d_scheduled as (
  delete from public.scheduled_deliveries where workflow_id in (select id from candidate_workflows) returning 1
), d_impact as (
  delete from public.impact_commitments where workflow_id in (select id from candidate_workflows) returning 1
), d_workflow_actions as (
  delete from public.workflow_actions where workflow_id in (select id from candidate_workflows) returning 1
), d_workflow_announcements as (
  delete from public.workflow_announcements where workflow_id in (select id from candidate_workflows) returning 1
), d_workflow_events as (
  delete from public.workflow_events where workflow_id in (select id from candidate_workflows) returning 1
), d_orchestration_events as (
  delete from public.orchestration_events where workflow_id in (select id from candidate_workflows) returning 1
), d_notification_log as (
  delete from public.notification_log where workflow_id in (select id from candidate_workflows) or provider = 'demo' or provider_id ilike 'demo%' returning 1
), d_webhook_events as (
  delete from public.webhook_events where workflow_id in (select id from candidate_workflows) or task_id in (select id from candidate_tasks) or provider_event_id ilike 'demo%' returning 1
), d_task_status_events as (
  delete from public.task_status_events where workflow_id in (select id from candidate_workflows) or task_id in (select id from candidate_tasks) returning 1
), d_people as (
  delete from public.people where estate_id in (select id from candidate_workflows) returning 1
), d_tasks as (
  delete from public.tasks where id in (select id from candidate_tasks) returning 1
), d_estate_access as (
  delete from public.estate_access where workflow_id in (select id from candidate_workflows) returning 1
), d_workflows as (
  delete from public.workflows where id in (select id from candidate_workflows) returning 1
), d_org_members as (
  delete from public.organization_members where organization_id in (select id from candidate_orgs) returning 1
)
delete from public.organizations where id in (select id from candidate_orgs);
