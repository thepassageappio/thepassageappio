
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS deceased_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS coordinator_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS coordinator_email text;
;
