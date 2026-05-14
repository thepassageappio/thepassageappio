
-- Link a participant to the most recent red-path estate (invite_status must be draft/sent/accepted/declined/bounced)
WITH demo_estate AS (
  SELECT id FROM workflows WHERE path = 'red' ORDER BY created_at DESC LIMIT 1
),
demo_person AS (
  SELECT id FROM people ORDER BY created_at DESC LIMIT 1
)
INSERT INTO estate_participants (
  estate_id, person_id,
  role, can_view, can_complete_tasks,
  invite_status, invite_token,
  invited_at, created_at, updated_at
)
SELECT
  demo_estate.id,
  demo_person.id,
  'task_helper',
  true, true,
  'sent',
  encode(gen_random_bytes(20), 'hex'),
  now(), now(), now()
FROM demo_estate, demo_person
WHERE EXISTS (SELECT 1 FROM demo_estate)
  AND EXISTS (SELECT 1 FROM demo_person)
ON CONFLICT DO NOTHING;

-- Normalize 'completed' tasks to 'done' so analytics have real data
UPDATE tasks SET status = 'done', updated_at = now()
WHERE status = 'completed';

-- Normalize 'waiting' to 'pending'  
UPDATE tasks SET status = 'pending', updated_at = now()
WHERE status = 'waiting';
;
