
-- The estate page API queries estate_participants with workflow_id=in.(...)
-- but the column is estate_id. Add workflow_id as a generated alias.
ALTER TABLE estate_participants
  ADD COLUMN IF NOT EXISTS workflow_id uuid GENERATED ALWAYS AS (estate_id) STORED;

-- Index it so the IN query is fast
CREATE INDEX IF NOT EXISTS estate_participants_workflow_id_idx
  ON estate_participants(workflow_id);
;
