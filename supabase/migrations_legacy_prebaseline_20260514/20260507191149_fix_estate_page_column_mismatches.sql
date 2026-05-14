
-- Fix 1: Add name and phone to estate_participants
-- API selects these but they live on people table — denormalize for the bulk query
ALTER TABLE estate_participants ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE estate_participants ADD COLUMN IF NOT EXISTS phone text;

-- Backfill from people (people uses first_name + last_name)
UPDATE estate_participants ep
SET
  name = trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
  phone = p.phone
FROM people p
WHERE p.id = ep.person_id
  AND ep.name IS NULL;

-- Fix 2: Add final_value_cents column to vendor_requests
-- API selects final_value_cents but column is final_value
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS final_value_cents integer;

-- Backfill existing rows
UPDATE vendor_requests
SET final_value_cents = (final_value * 100)::integer
WHERE final_value IS NOT NULL AND final_value_cents IS NULL;

-- Add trigger to keep final_value_cents in sync
CREATE OR REPLACE FUNCTION sync_vendor_final_value_cents()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.final_value IS NOT NULL THEN
    NEW.final_value_cents := (NEW.final_value * 100)::integer;
  ELSE
    NEW.final_value_cents := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vendor_requests_sync_cents ON vendor_requests;
CREATE TRIGGER vendor_requests_sync_cents
  BEFORE INSERT OR UPDATE OF final_value ON vendor_requests
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_final_value_cents();

-- Fix 3: estate_participants missing email column — add it
ALTER TABLE estate_participants ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from people
UPDATE estate_participants ep
SET email = p.email
FROM people p
WHERE p.id = ep.person_id
  AND ep.email IS NULL;
;
