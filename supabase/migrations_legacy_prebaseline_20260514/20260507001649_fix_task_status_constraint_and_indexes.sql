
-- Drop old constraint that doesn't match real data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_status_check'
    AND conrelid = 'tasks'::regclass
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
  END IF;
END $$;

-- Add constraint that includes ALL values found in real data plus done
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN (
    'pending','draft','assigned','in_progress','blocked',
    'done','skipped','handled','not_started','needs_owner',
    'completed','waiting','active'
  ));

-- Outcomes constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'outcomes_status_check'
    AND conrelid = 'outcomes'::regclass
  ) THEN
    ALTER TABLE outcomes DROP CONSTRAINT outcomes_status_check;
  END IF;
END $$;

ALTER TABLE outcomes ADD CONSTRAINT outcomes_status_check
  CHECK (status IN ('needs_owner','not_started','in_progress','handled','done'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS tasks_workflow_status_idx ON tasks(workflow_id, status);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS outcomes_estate_status_idx ON outcomes(estate_id, status);
CREATE INDEX IF NOT EXISTS estate_participants_estate_idx ON estate_participants(estate_id);
CREATE INDEX IF NOT EXISTS estate_participants_token_idx ON estate_participants(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS task_status_events_task_idx ON task_status_events(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_log_workflow_idx ON notification_log(workflow_id, status);
CREATE INDEX IF NOT EXISTS fh_partners_email_idx ON funeral_home_partners(email);

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_outcomes_updated_at ON outcomes;
CREATE TRIGGER update_outcomes_updated_at
  BEFORE UPDATE ON outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
;
