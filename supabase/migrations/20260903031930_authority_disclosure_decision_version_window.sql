create or replace function authority_private.require_disclosure_before_institution_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_disclosure public.authority_disclosures%rowtype;
begin
  select * into v_disclosure
  from public.authority_disclosures
  where authority_record_id = new.authority_record_id
    and organization_id = new.organization_id;
  if not found or v_disclosure.record_version >= new.record_version then
    raise exception using errcode = '42501', message = 'institution_decision_submission_required';
  end if;

  new.receipt_snapshot := new.receipt_snapshot || jsonb_build_object(
    'disclosure', jsonb_build_object(
      'id', v_disclosure.id,
      'text_version', v_disclosure.text_version,
      'disclosed_fields', to_jsonb(v_disclosure.disclosed_fields),
      'submitted_at', v_disclosure.submitted_at
    )
  );
  new.receipt_sha256 := encode(extensions.digest(convert_to(new.receipt_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  return new;
end;
$$;

revoke execute on function authority_private.require_disclosure_before_institution_decision() from public, anon, authenticated;

comment on function authority_private.require_disclosure_before_institution_decision() is
  'Requires a prior representative disclosure while allowing append-only review questions and responses before the institution decision.';
