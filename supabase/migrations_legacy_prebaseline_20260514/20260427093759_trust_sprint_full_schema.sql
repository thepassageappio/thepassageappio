
-- ── WORKFLOW EVENTS (wake, funeral, reception) ────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('visitation','funeral','burial','reception','memorial','other')),
  name text,
  date date,
  time text,
  location_name text,
  location_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_events_workflow_idx ON workflow_events(workflow_id);

-- RLS
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON workflow_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read events" ON workflow_events FOR SELECT USING (true);
CREATE POLICY "Anyone can update events" ON workflow_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON workflow_events FOR DELETE USING (true);

-- ── GREEN PATH: trigger people + token on workflows ───────────────────────────
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS path text DEFAULT 'red' CHECK (path IN ('red','green'));
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_token text UNIQUE DEFAULT gen_random_uuid()::text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_people jsonb DEFAULT '[]'::jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS confirmed_by jsonb DEFAULT '[]'::jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS confirmation_count int DEFAULT 2;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS triggered_at timestamptz;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS plan_name text;

-- Widen status check
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_status_check;
ALTER TABLE workflows ADD CONSTRAINT workflows_status_check
  CHECK (status IN ('draft','active','ready','triggered','completed','archived'));

-- ── PEOPLE: notification channel preference ───────────────────────────────────
ALTER TABLE people ADD COLUMN IF NOT EXISTS notify_channel text DEFAULT 'both' 
  CHECK (notify_channel IN ('email','sms','both'));

-- ── TASKS: message preview content ───────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS custom_message text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- ── USERS: plan tracking ──────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS renewal_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- ── CONFIRM PAGE: index for token lookup ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS workflows_trigger_token_idx ON workflows(trigger_token);
CREATE INDEX IF NOT EXISTS workflows_path_idx ON workflows(user_id, path, status);
;
