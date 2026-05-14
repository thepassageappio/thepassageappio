
-- Outcomes table (spec-compliant)
CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  why_it_matters text,
  recommended_action text,
  reassurance text,
  owner_id uuid REFERENCES people(id) ON DELETE SET NULL,
  owner_label text,
  status text DEFAULT 'not_started' CHECK (status IN ('needs_owner','not_started','in_progress','handled')),
  priority text DEFAULT 'high' CHECK (priority IN ('critical','high','normal')),
  timeframe text DEFAULT 'today' CHECK (timeframe IN ('now','today','this_week','later')),
  category text,
  position integer DEFAULT 0,
  source text DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage outcomes" ON outcomes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS outcomes_estate_idx ON outcomes(estate_id, position);

-- Urgent flow state persistence (resume where user left off)
CREATE TABLE IF NOT EXISTS urgent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_key text UNIQUE NOT NULL,
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  step integer DEFAULT 0,
  situation text,
  location text,
  first_name text,
  role text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE urgent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage urgent sessions" ON urgent_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS urgent_sessions_key_idx ON urgent_sessions(session_key);
CREATE INDEX IF NOT EXISTS urgent_sessions_user_idx ON urgent_sessions(user_id);

-- People table for owner assignment
ALTER TABLE people ADD COLUMN IF NOT EXISTS estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS people_estate_idx ON people(estate_id);
;
