create or replace function authority_private.normalize_activation_event_copy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_type = 'authority.activated' then
    new.detail := 'The evaluation started, one request was counted, and principal access was prepared. Representative access remains held until the principal confirms.';
    new.payload := new.payload || jsonb_build_object(
      'principal_notification_queued', true,
      'representative_notification_held', true
    );
  end if;
  return new;
end;
$$;

create trigger authority_events_normalize_activation_copy
before insert on public.authority_events
for each row execute function authority_private.normalize_activation_event_copy();

create or replace function public.activate_authority_request_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  v_result := authority_private.activate_authority_request_v1(
    p_organization_id, p_authority_record_id, p_expected_version, p_idempotency_key
  );
  return (v_result - 'representative_token' - 'notifications_queued') || jsonb_build_object(
    'notifications_queued', 1,
    'representative_notification_held', true
  );
end;
$$;

revoke execute on function authority_private.activate_authority_request_v1(uuid, uuid, bigint, uuid) from anon, authenticated;
revoke execute on function authority_private.normalize_activation_event_copy() from public, anon, authenticated;
revoke execute on function public.activate_authority_request_v1(uuid, uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function public.activate_authority_request_v1(uuid, uuid, bigint, uuid) to authenticated;
