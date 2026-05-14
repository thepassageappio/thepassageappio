
-- Obituary table
CREATE TABLE IF NOT EXISTS obituaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  date_of_death date,
  city_of_birth text,
  city_of_residence text,
  occupation text,
  survivors text,
  preceded_by text,
  life_summary text,
  service_details text,
  memorial_fund text,
  draft text,
  published_draft text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE obituaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage obituaries" ON obituaries FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS obituaries_workflow_idx ON obituaries(workflow_id);

-- Add obituary link to workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS obituary_id uuid REFERENCES obituaries(id);

-- Ensure notification_log recipient_name column exists
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS recipient_name text;
;
