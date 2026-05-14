
-- FIX 1: tasks_category_check constraint is blocking inserts
-- Our code uses categories like 'legal','service','notifications','property','personal',
-- 'medical','memorial','logistics','digital','financial','government','other'
-- Check what the constraint allows and widen it
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Re-add with correct allowed values
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
  CHECK (category IN ('legal','service','notifications','property','personal','medical',
                      'memorial','logistics','digital','financial','government','other'));

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending','in_progress','completed','skipped','blocked'));

ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('urgent','high','normal','low'));

-- FIX 2: people_owner_id_fkey — anon users send '00000000-0000-0000-0000-000000000000'
-- which doesn't exist in users table. Drop the FK or make owner_id nullable with no FK.
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_owner_id_fkey;
-- owner_id is already nullable, so anon users just get null instead of fake UUID
-- We handle this in code already
;
