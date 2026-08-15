-- ISOLATED-LAB-ONLY Cycle 7A authoritative invitation creation receipt.
--
-- WHAT: add a versioned idempotent invitation command receipt which includes
-- the durable organization_invitations.created_at value. Retire authenticated
-- execution of the superseded receipt shape after the new path is available.
-- WHY: a response-generation clock is not database or append-only proof, and
-- replay must return the original creation time rather than a new local time.
-- BREAKAGE IF SKIPPED: the UI can mislabel a non-durable timestamp as a Passage
-- server receipt and show a different time on replay.
--
-- Apply through Supabase migration tooling only to isolated project
-- uyacxqtsiwlvtmhxvoxr. Never apply to production qsveqfchwylsbncsfgxe.

do $cycle_7a_invitation_receipt_preflight$
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'test_fixture_cycle_7a_production_shape'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7A receipt migration refused: isolated production-shape lab marker is missing';
  end if;

  if not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'cycle_7a_invitation_creation_idempotency'
     )
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'cycle_7a_invitation_idempotency_acl_hardening'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A receipt migration refused: reviewed idempotency migrations are missing';
  end if;

  if to_regclass('public.organization_invitations') is null
     or not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'organization_invitations'
         and column_name = 'created_at'
     )
     or to_regprocedure(
       'passage_private.create_employee_invitation_idempotent(uuid,text,uuid[],text,timestamp with time zone,uuid)'
     ) is null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A receipt migration refused: expected invitation receipt foundation is missing';
  end if;
end
$cycle_7a_invitation_receipt_preflight$;

create or replace function passage_private.create_employee_invitation_idempotent_v2(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_creation_request_id uuid
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  invitation_purpose text,
  inviter_display_name text,
  organization_location_ids uuid[],
  invitation_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_receipt record;
  v_created_at timestamp with time zone;
begin
  -- The reviewed v1 implementation performs authentication, organization and
  -- location authorization, serialized idempotency, and replay-scope checks.
  select * into strict v_receipt
  from passage_private.create_employee_invitation_idempotent(
    p_organization_id,
    p_invited_email,
    p_organization_location_ids,
    p_purpose,
    p_expires_at,
    p_creation_request_id
  );

  select invitation.created_at into strict v_created_at
  from public.organization_invitations as invitation
  where invitation.id = v_receipt.invitation_id;

  return query select
    v_receipt.invitation_id::uuid,
    v_receipt.raw_token::text,
    v_receipt.token_hint::text,
    v_receipt.expires_at::timestamp with time zone,
    v_created_at,
    v_receipt.invitation_purpose::text,
    v_receipt.inviter_display_name::text,
    v_receipt.organization_location_ids::uuid[],
    v_receipt.invitation_state::text,
    v_receipt.replayed::boolean;
end
$function$;

create or replace function public.create_employee_invitation_idempotent_v2(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_creation_request_id uuid
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  invitation_purpose text,
  inviter_display_name text,
  organization_location_ids uuid[],
  invitation_state text,
  replayed boolean
)
language sql
volatile
security invoker
set search_path = ''
as $function$
  select * from passage_private.create_employee_invitation_idempotent_v2(
    p_organization_id,
    p_invited_email,
    p_organization_location_ids,
    p_purpose,
    p_expires_at,
    p_creation_request_id
  )
$function$;

revoke all on function passage_private.create_employee_invitation_idempotent_v2(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from public, anon, authenticated;

revoke all on function public.create_employee_invitation_idempotent_v2(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from public, anon;

grant execute on function passage_private.create_employee_invitation_idempotent_v2(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) to authenticated;

grant execute on function public.create_employee_invitation_idempotent_v2(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) to authenticated;

-- Retire the superseded receipt shape. The v2 checked private function can
-- still invoke v1 as its owner; authenticated clients cannot bypass v2.
revoke execute on function public.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from authenticated;

revoke execute on function passage_private.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from authenticated;
