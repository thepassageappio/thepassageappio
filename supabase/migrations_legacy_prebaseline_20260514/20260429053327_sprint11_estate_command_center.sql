
-- Estate command center needs a clean view of what matters
-- Add missing columns to outcomes if not present
ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS timeframe_label text;
ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS next_action_cta text;

-- Add estate display name and mode columns
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS mode text DEFAULT 'red' CHECK (mode IN ('red', 'green'));
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS coordinator_phone text;

-- Update existing red path estates
UPDATE workflows SET mode = 'red' WHERE path = 'red' AND mode IS NULL;
UPDATE workflows SET mode = 'green' WHERE path != 'red' AND mode IS NULL;

-- Event log for estate activity feed
CREATE TABLE IF NOT EXISTS estate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  actor text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE estate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage estate events" ON estate_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS estate_events_idx ON estate_events(estate_id, created_at DESC);
;
