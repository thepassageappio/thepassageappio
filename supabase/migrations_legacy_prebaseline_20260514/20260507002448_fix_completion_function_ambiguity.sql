
-- Fix ambiguous column reference in recalculate_user_completion
CREATE OR REPLACE FUNCTION recalculate_user_completion(p_user_id uuid)
RETURNS void AS $$
DECLARE
  total_tasks int;
  done_tasks int;
  pct int;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE t.status IN ('done', 'handled', 'completed'))
  INTO total_tasks, done_tasks
  FROM tasks t
  JOIN workflows w ON w.id = t.workflow_id
  WHERE w.user_id = p_user_id;

  pct := CASE WHEN total_tasks > 0
    THEN round((done_tasks::numeric / total_tasks::numeric) * 100)
    ELSE 0
  END;

  UPDATE users SET file_completion_pct = pct, updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed org member for demo funeral home
WITH demo_org AS (
  SELECT id FROM organizations WHERE slug = 'collins-family-fh' LIMIT 1
)
INSERT INTO organization_members (
  organization_id, email, role, status, created_at, updated_at
)
SELECT
  demo_org.id,
  'demo@collinsffh.com',
  'owner',
  'active',
  now(), now()
FROM demo_org
ON CONFLICT DO NOTHING;

-- Recalculate completion for all users
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    PERFORM recalculate_user_completion(u.id);
  END LOOP;
END $$;
;
