
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  audience text CHECK (audience IN ('immediate_family','close_friends','broader_community','public')),
  tone text CHECK (tone IN ('simple','warm','minimal')),
  content text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','sent','cancelled')),
  requires_review boolean DEFAULT true,
  reviewed_by text,
  reviewed_at timestamptz,
  channel text CHECK (channel IN ('sms','email','copy','social_pending')),
  sent_at timestamptz,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS announcements_estate_idx ON announcements(estate_id, status);
;
