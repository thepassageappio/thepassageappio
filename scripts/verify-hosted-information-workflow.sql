begin;

do $$
declare
  v_owner uuid := '10000000-0000-4000-8000-000000000001';
  v_staff uuid := '10000000-0000-4000-8000-000000000002';
  v_org uuid := '20000000-0000-4000-8000-000000000001';
  v_record uuid := '30000000-0000-4000-8000-000000000001';
  v_requirement uuid := '40000000-0000-4000-8000-000000000001';
  v_invitation uuid := '50000000-0000-4000-8000-000000000001';
  v_session_token text := repeat('a', 64);
  v_result jsonb;
  v_count bigint;
begin
  insert into auth.users (id, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'owner@local.authority.test', now(), now(), now()),
    (v_staff, 'staff@local.authority.test', now(), now(), now());

  insert into public.organizations (
    id, legal_name, display_name, organization_type, address_line_1,
    locality, region, postal_code, created_by, onboarding_status
  ) values (
    v_org, 'Local Authority Test Bank', 'Local Authority Test Bank', 'regional_bank',
    '1 Test Way', 'Albany', 'NY', '12207', v_owner, 'ready'
  );
  insert into public.organization_memberships (organization_id, user_id, email_normalized, display_name, role)
  values
    (v_org, v_owner, 'owner@local.authority.test', 'Owner', 'owner'),
    (v_org, v_staff, 'staff@local.authority.test', 'Staff', 'staff');

  insert into public.authority_records (
    id, organization_id, created_by, assigned_reviewer_id, status, template_key,
    template_version, account_boundary, principal_name, principal_email_normalized,
    representative_name, representative_email_normalized, allowed_action_keys,
    valid_until, activated_at
  ) values (
    v_record, v_org, v_owner, v_owner, 'ready_to_submit', 'ny-financial-poa', '1',
    'Deposit account ending 4821', 'Eleanor Carter', 'eleanor@local.authority.test',
    'Maya Carter', 'maya@local.authority.test', array['receive_duplicate_statements']::text[],
    now() + interval '30 days', now()
  );
  insert into public.authority_requirements (
    id, organization_id, authority_record_id, requirement_key, title, reason,
    input_kind, status, ordinal, completed_at
  ) values (
    v_requirement, v_org, v_record, 'power_of_attorney', 'Power of attorney document',
    'The institution needs the source document.', 'document', 'completed', 1, now()
  );
  insert into public.authority_participant_invitations (
    id, organization_id, authority_record_id, participant_role, email_normalized,
    status, invited_by, accepted_at, expires_at
  ) values (
    v_invitation, v_org, v_record, 'representative', 'maya@local.authority.test',
    'accepted', v_owner, now(), now() + interval '3 days'
  );
  insert into authority_private.participant_sessions (
    invitation_id, organization_id, authority_record_id, participant_role, token_hash, expires_at
  ) values (
    v_invitation, v_org, v_record, 'representative',
    encode(extensions.digest(convert_to(v_session_token, 'UTF8'), 'sha256'), 'hex'),
    now() + interval '3 days'
  );

  begin
    perform authority_private.record_institution_decision_service_v1(
      v_owner, v_org, v_record, 1, 'accepted', 'All synthetic requirements passed.',
      '{}'::text[], true, '60000000-0000-4000-8000-000000000010'
    );
    raise exception 'decision before representative submission unexpectedly succeeded';
  exception when sqlstate '42501' then
    if sqlerrm <> 'institution_decision_submission_required' then raise; end if;
  end;

  begin
    perform authority_private.submit_authority_for_review_v1(
      v_session_token, v_record, 1, false,
      '60000000-0000-4000-8000-000000000011'
    );
    raise exception 'unacknowledged submission unexpectedly succeeded';
  exception when sqlstate '22023' then
    if sqlerrm <> 'submission_acknowledgment_required' then raise; end if;
  end;

  v_result := authority_private.submit_authority_for_review_v1(
    v_session_token, v_record, 1, true,
    '60000000-0000-4000-8000-000000000012'
  );
  if v_result ->> 'status' <> 'under_review' or (v_result ->> 'replayed')::boolean then
    raise exception 'representative submission did not transition once: %', v_result;
  end if;
  v_result := authority_private.submit_authority_for_review_v1(
    v_session_token, v_record, 1, true,
    '60000000-0000-4000-8000-000000000012'
  );
  if not (v_result ->> 'replayed')::boolean then raise exception 'submission replay was not detected'; end if;
  select count(*) into v_count from public.authority_disclosures where authority_record_id = v_record;
  if v_count <> 1 then raise exception 'expected one append-only disclosure, found %', v_count; end if;

  begin
    perform authority_private.record_institution_decision_service_v1(
      v_owner, v_org, v_record, 2, 'accepted', 'All synthetic requirements passed.',
      '{}'::text[], true, '60000000-0000-4000-8000-000000000013'
    );
    if not exists (
      select 1 from public.authority_institution_decisions d
      where d.authority_record_id = v_record
        and d.receipt_snapshot ? 'disclosure'
        and d.receipt_snapshot #>> '{disclosure,text_version}' = 'minimum-necessary-disclosure-2026.1'
    ) then raise exception 'decision receipt did not include the saved disclosure'; end if;
    raise exception using errcode = 'P0001', message = 'rollback_successful_decision_probe';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'rollback_successful_decision_probe' then raise; end if;
  end;

  begin
    perform authority_private.request_authority_information_service_v1(
      v_staff, v_org, v_record, 2, 'power_of_attorney', 'Confirm page two is complete.',
      '60000000-0000-4000-8000-000000000001'
    );
    raise exception 'unauthorized staff request unexpectedly succeeded';
  exception when sqlstate '42501' then
    if sqlerrm <> 'information_request_not_allowed' then raise; end if;
  end;

  v_result := authority_private.request_authority_information_service_v1(
    v_owner, v_org, v_record, 2, 'power_of_attorney', 'Confirm page two is complete.',
    '60000000-0000-4000-8000-000000000002'
  );
  if v_result ->> 'status' <> 'information_requested' or (v_result ->> 'replayed')::boolean then
    raise exception 'information request did not transition once: %', v_result;
  end if;
  v_result := authority_private.request_authority_information_service_v1(
    v_owner, v_org, v_record, 2, 'power_of_attorney', 'Confirm page two is complete.',
    '60000000-0000-4000-8000-000000000002'
  );
  if not (v_result ->> 'replayed')::boolean then raise exception 'request replay was not detected'; end if;

  begin
    perform authority_private.respond_to_authority_information_v1(
      v_session_token, v_record, 2, 'Page two is complete.',
      '70000000-0000-4000-8000-000000000001'
    );
    raise exception 'stale response unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'participant_record_changed' then raise; end if;
  end;

  v_result := authority_private.respond_to_authority_information_v1(
    v_session_token, v_record, 3, 'Page two is complete.',
    '70000000-0000-4000-8000-000000000002'
  );
  if v_result ->> 'status' <> 'under_review' or (v_result ->> 'replayed')::boolean then
    raise exception 'response did not resolve the request once: %', v_result;
  end if;
  v_result := authority_private.respond_to_authority_information_v1(
    v_session_token, v_record, 3, 'Page two is complete.',
    '70000000-0000-4000-8000-000000000002'
  );
  if not (v_result ->> 'replayed')::boolean then raise exception 'response replay was not detected'; end if;

  select count(*) into v_count from public.authority_information_responses where authority_record_id = v_record;
  if v_count <> 1 then raise exception 'expected one durable response, found %', v_count; end if;

  begin
    perform authority_private.record_institution_decision_service_v1(
      v_owner, v_org, v_record, 4, 'accepted_with_limits', 'Synthetic review completed after clarification.',
      array['No money movement.']::text[], true, '60000000-0000-4000-8000-000000000014'
    );
    if not exists (
      select 1 from public.authority_institution_decisions d
      where d.authority_record_id = v_record
        and d.receipt_snapshot ? 'disclosure'
        and d.receipt_snapshot #>> '{disclosure,text_version}' = 'minimum-necessary-disclosure-2026.1'
    ) then raise exception 'post-clarification decision receipt did not include the saved disclosure'; end if;
    raise exception using errcode = 'P0001', message = 'rollback_post_clarification_decision_probe';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'rollback_post_clarification_decision_probe' then raise; end if;
  end;

  perform authority_private.request_authority_information_service_v1(
    v_owner, v_org, v_record, 4, 'power_of_attorney', 'Confirm the signature date.',
    '60000000-0000-4000-8000-000000000003'
  );
  begin
    perform authority_private.withdraw_authority_responsibility_v1(
      v_session_token, v_record, 4, 'I can no longer serve.', false,
      '80000000-0000-4000-8000-000000000001'
    );
    raise exception 'unacknowledged withdrawal unexpectedly succeeded';
  exception when sqlstate '22023' then
    if sqlerrm <> 'withdrawal_acknowledgment_required' then raise; end if;
  end;
  v_result := authority_private.withdraw_authority_responsibility_v1(
    v_session_token, v_record, 5, 'I can no longer serve.', true,
    '80000000-0000-4000-8000-000000000002'
  );
  if v_result ->> 'status' <> 'withdrawn' or (v_result ->> 'replayed')::boolean then
    raise exception 'withdrawal did not end the request once: %', v_result;
  end if;
  v_result := authority_private.withdraw_authority_responsibility_v1(
    v_session_token, v_record, 5, 'I can no longer serve.', true,
    '80000000-0000-4000-8000-000000000002'
  );
  if not (v_result ->> 'replayed')::boolean then raise exception 'withdrawal replay was not detected'; end if;

  select count(*) into v_count from public.authority_events
  where authority_record_id = v_record
    and event_type in ('representative.submitted', 'review.information_requested', 'review.information_resolved', 'representative.withdrawn');
  if v_count <> 5 then raise exception 'expected five append-only workflow events, found %', v_count; end if;

  if (select activated_count from public.organization_entitlements where organization_id = v_org) <> 0
    or (select count(*) from public.authority_usage_events where organization_id = v_org) <> 0 then
    raise exception 'information, stale, wrong-role, or withdrawal paths changed usage';
  end if;
end;
$$;

rollback;
