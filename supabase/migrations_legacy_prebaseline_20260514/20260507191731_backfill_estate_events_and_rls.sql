
-- Backfill actor nulls to prevent JS null dereference
UPDATE estate_events SET actor = 'system' WHERE actor IS NULL;
ALTER TABLE estate_events ALTER COLUMN actor SET DEFAULT 'system';

-- RLS for estate_events
ALTER TABLE estate_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estate_events_select_all" ON estate_events;
DROP POLICY IF EXISTS "estate_events_insert_all" ON estate_events;

CREATE POLICY "estate_events_select_all" ON estate_events FOR SELECT USING (true);
CREATE POLICY "estate_events_insert_all" ON estate_events FOR INSERT WITH CHECK (true);

-- Backfill estate_participants name field — empty string not null
UPDATE estate_participants SET name = '' WHERE name IS NULL;
UPDATE estate_participants SET phone = '' WHERE phone IS NULL;
UPDATE estate_participants SET email = '' WHERE email IS NULL;
;
