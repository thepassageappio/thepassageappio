
CREATE TABLE IF NOT EXISTS orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orch_events_workflow_idx ON orchestration_events(workflow_id);
CREATE INDEX IF NOT EXISTS orch_events_status_idx ON orchestration_events(status, created_at);
ALTER TABLE orchestration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage orch events" ON orchestration_events FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  disposition text,
  service_type text,
  religious_leader text,
  music_preferences text,
  readings text,
  flower_preferences text,
  obituary_draft text,
  special_requests text,
  organ_donation boolean DEFAULT false,
  notify_employer boolean DEFAULT true,
  notify_faith_community boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wishes_user_idx ON wishes(user_id);
CREATE INDEX IF NOT EXISTS wishes_workflow_idx ON wishes(workflow_id);
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage wishes" ON wishes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS wishes_id uuid REFERENCES wishes(id);

UPDATE workflows SET status = 'archived'
WHERE name ILIKE '%test%' OR name ILIKE '%tyrt%' OR deceased_name ILIKE '%test%';
;
