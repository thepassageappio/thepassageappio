-- CRITICAL, found via this session's own adversarial testing of the structured-
-- role migration: accept_case_family_invitation's "on conflict (workflow_id,
-- user_id)" target list is ambiguous against the function's own
-- RETURNS TABLE(workflow_id uuid, ...) output columns, which PL/pgSQL
-- registers as implicit variables. Every real acceptance attempt in
-- production has always raised 42702 ("column reference workflow_id is
-- ambiguous") and failed -- confirmed empirically: 0 rows in
-- case_family_invitations have ever had accepted_at set, and the sole
-- estate_access row in production (role='external_partner') was not created
-- through this path at all. This predates today's participant_role change
-- entirely -- it's the original, always-broken accept flow.
--
-- Fix: #variable_conflict use_column tells PL/pgSQL to prefer the SQL
-- column interpretation over a same-named plpgsql variable for any bare,
-- unqualified identifier. Safe here because every actual read of the
-- RETURNS TABLE columns in this function body is already table-qualified
-- (v_invitation.workflow_id, v_workflow.family_name, etc.), never bare --
-- so this only changes resolution of the ON CONFLICT target list, nothing else.
create or replace function passage_private.accept_case_family_invitation(p_raw_token text)
returns table (
  workflow_id uuid,
  family_name text,
  person_name text,
  accepted_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
#variable_conflict use_column
declare
  v_actor uuid := (select auth.uid());
  v_verified_email text;
  v_invitation public.case_family_invitations%rowtype;
  v_workflow public.workflows%rowtype;
  v_event record;
  v_estate_role text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_raw_token is null or length(p_raw_token) not between 32 and 256 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  v_verified_email := passage_private.current_verified_email();

  select i.* into v_invitation
  from public.case_family_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;
  if v_invitation.id is null then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id is distinct from v_actor then
      raise exception 'Invitation was accepted by another account' using errcode = '42501';
    end if;
    select w.* into v_workflow from public.workflows as w where w.id = v_invitation.workflow_id;
    return query select v_invitation.workflow_id, v_workflow.family_name, v_workflow.person_name, v_invitation.accepted_at, true;
    return;
  end if;
  if v_invitation.revoked_at is not null or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  if v_verified_email is distinct from v_invitation.invited_email then
    raise exception 'Sign in with the verified email address that received this invitation' using errcode = '42501';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = v_invitation.workflow_id;

  v_estate_role := case
    when v_invitation.participant_role in ('executor', 'poa_medical_proxy') then 'authorized_participant'
    else 'participant'
  end;

  insert into public.estate_access (workflow_id, user_id, email, role, status)
  values (v_invitation.workflow_id, v_actor, v_verified_email, v_estate_role, 'active')
  on conflict (workflow_id, user_id) do update
    set email = excluded.email, role = v_estate_role, status = 'active', updated_at = pg_catalog.clock_timestamp();

  update public.case_family_invitations
  set accepted_at = pg_catalog.clock_timestamp(), accepted_by_user_id = v_actor
  where id = v_invitation.id
  returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    v_invitation.workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':accepted',
    'case_family_invitation.accepted', 'available', 'accepted',
    pg_catalog.jsonb_build_object('relationship', v_invitation.relationship, 'participant_role', v_invitation.participant_role, 'next_owner', 'invited_family_member')
  );
  return query select v_invitation.workflow_id, v_workflow.family_name, v_workflow.person_name, v_invitation.accepted_at, false;
end
$function$;
