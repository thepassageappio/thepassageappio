begin;

insert into auth.users (id, email, email_confirmed_at, created_at, updated_at)
values
  ('11000000-0000-4000-8000-000000000001', 'matrix-owner@local.authority.test', now(), now(), now()),
  ('11000000-0000-4000-8000-000000000002', 'matrix-staff@local.authority.test', now(), now(), now());

insert into public.organizations (
  id, legal_name, display_name, organization_type, address_line_1,
  locality, region, postal_code, created_by, onboarding_status
) values (
  '21000000-0000-4000-8000-000000000001',
  'Negative Matrix Test Bank', 'Negative Matrix Test Bank', 'regional_bank',
  '1 Test Way', 'Albany', 'NY', '12207',
  '11000000-0000-4000-8000-000000000001', 'ready'
);

insert into public.organization_memberships (
  organization_id, user_id, email_normalized, display_name, role
) values
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'matrix-owner@local.authority.test', 'Matrix Owner', 'owner'
  ),
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    'matrix-staff@local.authority.test', 'Matrix Staff', 'staff'
  );

insert into public.authority_records (
  id, organization_id, created_by, status, version, template_key, template_version,
  account_boundary, principal_name, principal_email_normalized,
  representative_name, representative_email_normalized, allowed_action_keys,
  valid_until, activated_at
) values
  (
    '31000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'awaiting_principal', 1, 'ny_financial_poa', '2026.1',
    'Sample account ending 1101', 'Parker Quinn', 'parker@local.authority.test',
    'Casey Quinn', 'casey@local.authority.test',
    array['receive_duplicate_statements']::text[], now() + interval '30 days', now()
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'under_review', 5, 'ny_financial_poa', '2026.1',
    'Sample account ending 2202', 'Robin Lane', 'robin@local.authority.test',
    'Taylor Lane', 'taylor@local.authority.test',
    array['receive_duplicate_statements']::text[], now() + interval '30 days', now()
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'under_review', 5, 'ny_financial_poa', '2026.1',
    'Sample account ending 3303', 'Morgan Reed', 'morgan@local.authority.test',
    'Jordan Reed', 'jordan@local.authority.test',
    array['discuss_service_issues']::text[], now() + interval '30 days', now()
  );

insert into public.authority_requirements (
  id, organization_id, authority_record_id, requirement_key, title, reason,
  input_kind, status, ordinal, completed_at
) values
  (
    '41000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    'power_of_attorney', 'Power of attorney document',
    'The institution needs the source document.', 'document', 'completed', 1, now()
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    'power_of_attorney', 'Power of attorney document',
    'The institution needs the source document.', 'document', 'completed', 1, now()
  );

insert into public.authority_participant_invitations (
  id, organization_id, authority_record_id, participant_role, email_normalized,
  status, invited_by, accepted_at, expires_at
) values
  (
    '51000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'principal', 'parker@local.authority.test', 'pending',
    '11000000-0000-4000-8000-000000000001', null, now() + interval '3 days'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'representative', 'casey@local.authority.test', 'pending',
    '11000000-0000-4000-8000-000000000001', null, now() + interval '3 days'
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    'representative', 'taylor@local.authority.test', 'accepted',
    '11000000-0000-4000-8000-000000000001', now(), now() + interval '3 days'
  ),
  (
    '51000000-0000-4000-8000-000000000004',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    'representative', 'jordan@local.authority.test', 'accepted',
    '11000000-0000-4000-8000-000000000001', now(), now() + interval '3 days'
  );

insert into authority_private.participant_invitation_secrets (invitation_id, token_hash)
values
  (
    '51000000-0000-4000-8000-000000000001',
    encode(extensions.digest(convert_to(repeat('a', 64), 'UTF8'), 'sha256'), 'hex')
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    encode(extensions.digest(convert_to(repeat('b', 64), 'UTF8'), 'sha256'), 'hex')
  );

insert into public.authority_disclosures (
  organization_id, authority_record_id, invitation_id, record_version,
  text_version, disclosed_fields, acknowledged
) values
  (
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000003', 5,
    'minimum-necessary-disclosure-2026.1', array['authority_scope']::text[], true
  ),
  (
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    '51000000-0000-4000-8000-000000000004', 5,
    'minimum-necessary-disclosure-2026.1', array['authority_scope']::text[], true
  );

create temporary table negative_matrix_results (
  label text primary key,
  result jsonb not null
);
grant all on negative_matrix_results to authenticated;

do $$
declare
  v_exchange jsonb;
  v_error text;
  v_event_count bigint;
begin
  v_exchange := authority_private.exchange_participant_invitation_v1(
    repeat('a', 64), '61000000-0000-4000-8000-000000000001'
  );
  insert into negative_matrix_results(label, result) values ('first_exchange', v_exchange);

  if v_exchange->>'replayed' <> 'false' then
    raise exception 'first participant exchange did not establish access';
  end if;

  if (authority_private.exchange_participant_invitation_v1(
    repeat('a', 64), '61000000-0000-4000-8000-000000000001'
  )->>'replayed') <> 'true' then
    raise exception 'exact participant exchange replay was not detected';
  end if;

  select count(*) into v_event_count from public.authority_events
  where authority_record_id = '31000000-0000-4000-8000-000000000001';

  begin
    perform authority_private.exchange_participant_invitation_v1(
      repeat('a', 64), '61000000-0000-4000-8000-000000000002'
    );
    raise exception 'reused one-time link unexpectedly established a second session';
  exception when sqlstate '22023' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'participant_invitation_already_used' then raise; end if;
  end;

  begin
    perform authority_private.submit_participant_decision_v1(
      v_exchange->>'session_token', '31000000-0000-4000-8000-000000000001',
      1, 'representative_accept', true, '',
      '61000000-0000-4000-8000-000000000003'
    );
    raise exception 'principal session unexpectedly performed the representative action';
  exception when sqlstate '42501' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'participant_decision_not_allowed' then raise; end if;
  end;

  begin
    perform authority_private.submit_participant_decision_v1(
      v_exchange->>'session_token', '31000000-0000-4000-8000-000000000001',
      99, 'principal_confirm', true, '',
      '61000000-0000-4000-8000-000000000004'
    );
    raise exception 'stale participant page unexpectedly changed the request';
  exception when sqlstate 'P0001' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'participant_record_changed' then raise; end if;
  end;

  if (select status from public.authority_records where id = '31000000-0000-4000-8000-000000000001') <> 'awaiting_principal'
    or (select version from public.authority_records where id = '31000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.authority_events where authority_record_id = '31000000-0000-4000-8000-000000000001') <> v_event_count
    or (select count(*) from public.authority_participant_decisions where authority_record_id = '31000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'reused-link, wrong-role, or stale-page denial changed durable request state';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);

do $$
declare
  v_reissue jsonb;
begin
  v_reissue := public.reissue_participant_invitation_v1(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'principal', 1, 2,
    '61000000-0000-4000-8000-000000000005'
  );
  if v_reissue->>'replayed' <> 'false' or v_reissue->>'access_purpose' <> 'decision' then
    raise exception 'fresh-link recovery did not prepare one new decision link';
  end if;
  insert into negative_matrix_results(label, result) values ('reissue', v_reissue);
end;
$$;

reset role;

do $$
declare
  v_old_session_token text;
  v_new_invitation_token text;
  v_new_exchange jsonb;
  v_error text;
begin
  select result->>'session_token' into v_old_session_token
  from negative_matrix_results where label = 'first_exchange';
  select result->>'invitation_token' into v_new_invitation_token
  from negative_matrix_results where label = 'reissue';

  begin
    perform authority_private.get_participant_session_context_v1(
      v_old_session_token, '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'fresh-link recovery left the prior session active';
  exception when sqlstate 'P0002' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'participant_session_unavailable' then raise; end if;
  end;

  v_new_exchange := authority_private.exchange_participant_invitation_v1(
    v_new_invitation_token, '61000000-0000-4000-8000-000000000006'
  );
  if v_new_exchange->>'participant_role' <> 'principal'
    or v_new_exchange->>'access_purpose' <> 'decision'
    or v_new_exchange->>'replayed' <> 'false' then
    raise exception 'fresh-link recovery did not establish the expected role-bound session';
  end if;

  if (select status from public.authority_records where id = '31000000-0000-4000-8000-000000000001') <> 'awaiting_principal'
    or (select version from public.authority_records where id = '31000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from authority_private.participant_sessions where authority_record_id = '31000000-0000-4000-8000-000000000001' and status = 'active') <> 1
    or (select count(*) from public.authority_events where authority_record_id = '31000000-0000-4000-8000-000000000001') <> 3 then
    raise exception 'fresh-link recovery changed request state or produced the wrong evidence chain';
  end if;
end;
$$;

do $$
declare
  v_rejected jsonb;
  v_rejected_replay jsonb;
  v_accepted jsonb;
  v_expired jsonb;
begin
  v_rejected := authority_private.record_institution_decision_service_v1(
    '11000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    5, 'rejected', 'The sample evidence does not meet the institution policy.',
    '{}'::text[], true, '61000000-0000-4000-8000-000000000007'
  );
  v_rejected_replay := authority_private.record_institution_decision_service_v1(
    '11000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    5, 'rejected', 'The sample evidence does not meet the institution policy.',
    '{}'::text[], true, '61000000-0000-4000-8000-000000000007'
  );
  if v_rejected->>'status' <> 'rejected' or v_rejected->>'version' <> '6'
    or v_rejected_replay->>'replayed' <> 'true' then
    raise exception 'rejection did not transition and replay exactly once';
  end if;
  if (select cardinality(accepted_action_keys) from public.authority_institution_decisions where authority_record_id = '31000000-0000-4000-8000-000000000002') <> 0
    or (select count(*) from public.authority_events where authority_record_id = '31000000-0000-4000-8000-000000000002' and event_type = 'institution.decision_recorded') <> 1 then
    raise exception 'rejection did not preserve a single, no-authority decision receipt';
  end if;

  v_accepted := authority_private.record_institution_decision_service_v1(
    '11000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    5, 'accepted', 'The synthetic evidence meets the institution policy.',
    '{}'::text[], true, '61000000-0000-4000-8000-000000000008'
  );
  if v_accepted->>'status' <> 'accepted' or v_accepted->>'version' <> '6' then
    raise exception 'expiration fixture decision did not save';
  end if;

  update public.authority_records set valid_until = now() - interval '1 second'
  where id = '31000000-0000-4000-8000-000000000003';

  v_expired := authority_private.record_authority_lifecycle_service_v1(
    '11000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    6, 'expire', '', true, '61000000-0000-4000-8000-000000000009'
  );
  if v_expired->>'status' <> 'expired' or v_expired->>'version' <> '7'
    or (select outcome from public.authority_institution_decisions where authority_record_id = '31000000-0000-4000-8000-000000000003') <> 'accepted'
    or (select count(*) from public.authority_events where authority_record_id = '31000000-0000-4000-8000-000000000003' and event_type in ('institution.decision_recorded', 'authority.expiration_recorded')) <> 2 then
    raise exception 'expiration did not preserve the decision and append one lifecycle event';
  end if;
end;
$$;

do $$
begin
  if (select activated_count from public.organization_entitlements where organization_id = '21000000-0000-4000-8000-000000000001') <> 0
    or (select count(*) from public.authority_usage_events where organization_id = '21000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'negative, terminal, or recovery paths changed usage';
  end if;
end;
$$;

rollback;
