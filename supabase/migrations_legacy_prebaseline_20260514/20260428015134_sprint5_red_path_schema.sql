
-- Estate user context (role, situation, authority)
CREATE TABLE IF NOT EXISTS estate_user_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  relationship_to_deceased text,
  decision_authority text CHECK (decision_authority IN ('yes','no','helping','unknown')),
  urgent_situation text CHECK (urgent_situation IN ('home','hospital','hospice','nursing_facility','unexpected','expected_soon','unknown')),
  funeral_home_status text CHECK (funeral_home_status IN ('selected','need_help','unknown')),
  funeral_home_name text,
  funeral_home_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE estate_user_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage estate context" ON estate_user_context FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS estate_context_estate_idx ON estate_user_context(estate_id);

-- Widen workflow status for new states
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_status_check;
ALTER TABLE workflows ADD CONSTRAINT workflows_status_check CHECK (
  status IN ('urgent_intake_started','urgent_first_steps_generated','coordination_setup_started',
             'coordination_active','planning_active','draft','active','ready','triggered','completed','archived')
);

-- Add estate name field (user-chosen like "Dad's plan")
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS estate_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS urgent_situation text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS funeral_home_status text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS relationship_to_deceased text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS decision_authority text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS deceased_first_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS deceased_last_name text;

-- Messages table (proper orchestration messages with status)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  related_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  recipient_person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  channel text CHECK (channel IN ('sms','email','copy_link')),
  subject text,
  body text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','scheduled','sent','failed','cancelled')),
  approved_by_user_id uuid,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS messages_estate_idx ON messages(estate_id);
;
