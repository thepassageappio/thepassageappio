
-- Obituary / announcements table
CREATE TABLE IF NOT EXISTS workflow_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  master_text text,
  facebook_text text,
  linkedin_text text,
  twitter_text text,
  instagram_text text,
  sms_text text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_workflow_idx ON workflow_announcements(workflow_id);

ALTER TABLE workflow_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage announcements" ON workflow_announcements FOR ALL USING (true) WITH CHECK (true);

-- Add obituary_url to workflows for linking in shares
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS obituary_url text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS announcement_id uuid REFERENCES workflow_announcements(id);
;
