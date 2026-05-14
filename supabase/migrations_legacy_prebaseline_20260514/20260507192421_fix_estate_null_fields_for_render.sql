
-- Set safe defaults on workflows so the estate page render never gets null on fields it renders
UPDATE workflows SET
  activation_status = COALESCE(activation_status, 'draft'),
  setup_stage = COALESCE(setup_stage, 'intake'),
  mode = COALESCE(mode, 'red'),
  status = COALESCE(status, 'active'),
  estate_name = COALESCE(estate_name, COALESCE(deceased_name, 'My Estate')),
  coordinator_name = COALESCE(coordinator_name, ''),
  coordinator_email = COALESCE(coordinator_email, '')
WHERE activation_status IS NULL
   OR setup_stage IS NULL
   OR mode IS NULL
   OR status IS NULL
   OR estate_name IS NULL;

-- Set defaults on outcomes so render never gets null
UPDATE outcomes SET
  status = COALESCE(status, 'not_started'),
  priority = COALESCE(priority, 'normal'),
  title = COALESCE(title, 'Untitled'),
  owner_label = COALESCE(owner_label, '')
WHERE status IS NULL OR priority IS NULL OR title IS NULL;

-- Set defaults on tasks so task list never crashes
UPDATE tasks SET
  status = COALESCE(status, 'pending'),
  title = COALESCE(title, 'Untitled task'),
  assigned_to_name = COALESCE(assigned_to_name, ''),
  assigned_to_email = COALESCE(assigned_to_email, '')
WHERE status IS NULL OR title IS NULL;

-- Verify
SELECT
  COUNT(*) FILTER (WHERE activation_status IS NULL) as null_activation,
  COUNT(*) FILTER (WHERE setup_stage IS NULL) as null_stage,
  COUNT(*) FILTER (WHERE estate_name IS NULL) as null_estate_name
FROM workflows;
;
