-- Local only. All fixture rows roll back; identity sequence increments do not.
-- Sequential SQL replay tests the command contract, not a committed HTTP failure.
DO $test$
DECLARE
  command_key uuid := gen_random_uuid();
  inquiry_id uuid;
  first_result jsonb;
  retry_result jsonb;
  caller text;
  attempt integer;
  args text := format('%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L::uuid',
    'demo', 'Fictional Reviewer', 'replay-' || command_key || '@example.invalid',
    'Fictional Test Institution', 'bank', 'Reviewer', 'email_and_documents',
    'under_100', 'Fictional replay test', 'commercial-contact-2026.1', '/contact', command_key);
BEGIN
  BEGIN
    FOREACH caller IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      PERFORM set_config('role', caller, true);
      BEGIN
        EXECUTE 'select public.create_commercial_inquiry_v1(' || args || ')';
        RAISE EXCEPTION 'browser role unexpectedly permitted';
      EXCEPTION WHEN insufficient_privilege THEN NULL;
      END;
      PERFORM set_config('role', 'postgres', true);
    END LOOP;
    PERFORM set_config('role', 'service_role', true);
    EXECUTE 'select public.create_commercial_inquiry_v1(' || args || ')' INTO first_result;
    IF first_result->>'replayed' IS DISTINCT FROM 'false'
      OR first_result->>'reference_code' IS NULL THEN RAISE EXCEPTION 'first result invalid'; END IF;
    FOR attempt IN 1..3 LOOP
      EXECUTE 'select public.create_commercial_inquiry_v1(' || args || ')' INTO retry_result;
      IF retry_result->>'replayed' IS DISTINCT FROM 'true'
        OR retry_result->>'reference_code' IS DISTINCT FROM first_result->>'reference_code'
        THEN RAISE EXCEPTION 'retry changed result'; END IF;
    END LOOP;
    -- Existing key identifies the saved submission even if the form is edited.
    EXECUTE 'select public.create_commercial_inquiry_v1(' || replace(args, 'Fictional replay test', 'Edited after response loss') || ')'
      INTO retry_result;
    IF retry_result->>'replayed' IS DISTINCT FROM 'true'
      OR retry_result->>'reference_code' IS DISTINCT FROM first_result->>'reference_code'
      THEN RAISE EXCEPTION 'edited retry changed result'; END IF;
    PERFORM set_config('role', 'postgres', true);
    SELECT id INTO STRICT inquiry_id FROM authority_private.commercial_inquiries WHERE idempotency_key = command_key;
    IF (SELECT message FROM authority_private.commercial_inquiries WHERE id = inquiry_id) <> 'Fictional replay test'
      THEN RAISE EXCEPTION 'saved input rewritten'; END IF;
    IF (SELECT count(*) FROM authority_private.commercial_event_ledger WHERE aggregate_id = inquiry_id) <> 1
      OR (SELECT count(*) FROM authority_private.integration_outbox WHERE subject_id = inquiry_id) <> 1
      THEN RAISE EXCEPTION 'duplicate or missing event/outbox'; END IF;
    RAISE EXCEPTION USING ERRCODE='P9001', MESSAGE='contact_fixture_rollback';
  EXCEPTION WHEN SQLSTATE 'P9001' THEN
    IF SQLERRM <> 'contact_fixture_rollback' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM authority_private.commercial_inquiries WHERE idempotency_key = command_key)
    OR EXISTS (SELECT 1 FROM authority_private.commercial_event_ledger WHERE aggregate_id = inquiry_id)
    OR EXISTS (SELECT 1 FROM authority_private.integration_outbox WHERE subject_id = inquiry_id)
    THEN RAISE EXCEPTION 'fixture cleanup failed'; END IF;
END;
$test$;
