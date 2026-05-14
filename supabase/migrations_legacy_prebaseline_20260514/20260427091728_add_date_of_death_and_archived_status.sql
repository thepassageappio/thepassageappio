
-- Add date_of_death to workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS date_of_death date;

-- Add renewal_date to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS renewal_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- Widen workflow status to allow 'archived'
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_status_check;
ALTER TABLE workflows ADD CONSTRAINT workflows_status_check
  CHECK (status IN ('draft','active','triggered','completed','archived'));

-- Update loadUserWorkflows to exclude archived (handled in code)
-- Index for faster dashboard load
CREATE INDEX IF NOT EXISTS workflows_user_status_idx ON workflows(user_id, status, created_at DESC);
;
