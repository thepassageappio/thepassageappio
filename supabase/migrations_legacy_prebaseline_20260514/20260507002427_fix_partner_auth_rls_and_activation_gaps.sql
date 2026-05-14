
-- ── GAP 1: organization_members has no SELECT policy for non-admin members ────
-- Current policy requires being admin to READ. A staff member signing in
-- cannot see their own org membership. This breaks partner dashboard auth.
DROP POLICY IF EXISTS "Organization members can view membership" ON organization_members;

CREATE POLICY "org_members_select_own"
ON organization_members FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid()
    OR lower(email) = lower(auth.jwt() ->> 'email')
  )
);

-- ── GAP 2: funeral_home_partners has no RLS policy at all ────────────────────
ALTER TABLE funeral_home_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fh_partners_org_member_select"
ON funeral_home_partners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.status = 'active'
    AND (om.user_id = auth.uid() OR lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);

-- Service role bypass for server-side API calls
CREATE POLICY "fh_partners_service_all"
ON funeral_home_partners FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── GAP 3: estate_participants INSERT policy has no WITH CHECK ────────────────
-- Current INSERT policy has no guard — any authenticated user can insert.
-- Lock it down to estate owners and org members.
DROP POLICY IF EXISTS "estate_participants_insert_owner" ON estate_participants;

CREATE POLICY "estate_participants_insert_owner"
ON estate_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows w
    WHERE w.id = estate_id
    AND (
      w.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = w.organization_id
        AND om.status = 'active'
        AND (om.user_id = auth.uid() OR lower(om.email) = lower(auth.jwt() ->> 'email'))
      )
    )
  )
);

-- ── GAP 4: invite_token lookup must work for unauthenticated participants ─────
-- /participating flow hits the DB with a token before auth happens.
-- Need a policy that allows SELECT by token without requiring auth.uid().
CREATE POLICY "estate_participants_token_lookup"
ON estate_participants FOR SELECT
USING (
  invite_token IS NOT NULL
  AND invite_status IN ('sent', 'accepted')
);

-- ── GAP 5: tasks participant UPDATE is scoped to assigned_to_email ────────────
-- But there is no participant SELECT that lets them see the task details
-- before updating. The existing participant select is correct — confirm it
-- covers the workflow join path for org members too.
DROP POLICY IF EXISTS "tasks participant select" ON tasks;

CREATE POLICY "tasks_participant_select"
ON tasks FOR SELECT
USING (
  lower(assigned_to_email) = lower(auth.jwt() ->> 'email')
  OR EXISTS (
    SELECT 1 FROM workflows w
    WHERE w.id = tasks.workflow_id
    AND EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = w.organization_id
      AND om.status = 'active'
      AND (om.user_id = auth.uid() OR lower(om.email) = lower(auth.jwt() ->> 'email'))
    )
  )
);

-- ── GAP 6: file_completion_pct never updates on users table ──────────────────
-- v_north_star reads users.file_completion_pct but nothing writes to it.
-- Create a function that recalculates it from tasks/outcomes.
CREATE OR REPLACE FUNCTION recalculate_user_completion(p_user_id uuid)
RETURNS void AS $$
DECLARE
  total_tasks int;
  done_tasks int;
  pct int;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('done', 'handled', 'completed'))
  INTO total_tasks, done_tasks
  FROM tasks t
  JOIN workflows w ON w.id = t.workflow_id
  WHERE w.user_id = p_user_id;

  IF total_tasks > 0 THEN
    pct := round((done_tasks::numeric / total_tasks::numeric) * 100);
  ELSE
    pct := 0;
  END IF;

  UPDATE users SET file_completion_pct = pct, updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update completion when task status changes
CREATE OR REPLACE FUNCTION trigger_user_completion_update()
RETURNS TRIGGER AS $$
DECLARE
  estate_owner uuid;
BEGIN
  SELECT w.user_id INTO estate_owner
  FROM workflows w WHERE w.id = NEW.workflow_id;

  IF estate_owner IS NOT NULL THEN
    PERFORM recalculate_user_completion(estate_owner);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tasks_completion_update ON tasks;
CREATE TRIGGER tasks_completion_update
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_user_completion_update();
;
