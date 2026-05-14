
-- ── FIX 1: organization_members self-referential policy ───────────────────────
-- The admin policy checks organization_members FROM WITHIN organization_members
-- Break the cycle with a SECURITY DEFINER function that bypasses RLS

CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND coalesce(status, 'active') = 'active'
      AND role IN ('owner', 'admin')
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
  );
$$;

DROP POLICY IF EXISTS "Organization admins can manage membership" ON organization_members;

CREATE POLICY "org_admins_manage"
ON organization_members FOR ALL
USING (
  auth.uid() IS NOT NULL AND is_org_admin(organization_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND is_org_admin(organization_id)
);

-- ── FIX 2: workflows ↔ estate_access mutual recursion ────────────────────────
-- workflows SELECT checks estate_access, estate_access ALL checks workflows
-- Break by making estate_access check use a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION is_workflow_owner(wf_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workflows
    WHERE id = wf_id AND user_id = auth.uid()
  );
$$;

-- Replace estate_access policy that checks back into workflows
DROP POLICY IF EXISTS "owners manage estate access" ON estate_access;

CREATE POLICY "estate_access_owner_manage"
ON estate_access FOR ALL
USING ( is_workflow_owner(workflow_id) )
WITH CHECK ( is_workflow_owner(workflow_id) );

-- ── FIX 3: drop the duplicate workflows participant read policy ───────────────
-- "workflows participant read" and "workflows owner coordinator participant or org select"
-- both check estate_access — the latter is the correct comprehensive one, drop the duplicate
DROP POLICY IF EXISTS "workflows participant read" ON workflows;

-- ── FIX 4: make the comprehensive workflows SELECT safe ───────────────────────
-- It references estate_access which now has a safe policy — should be fine
-- But also references organization_members directly which could still recurse
-- Replace org_members subquery with the safe function

DROP POLICY IF EXISTS "workflows owner coordinator participant or org select" ON workflows;

CREATE OR REPLACE FUNCTION is_org_member_of(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND coalesce(status, 'active') = 'active'
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
  );
$$;

CREATE POLICY "workflows_select_safe"
ON workflows FOR SELECT
USING (
  user_id = auth.uid()
  OR lower(coordinator_email) = lower(auth.jwt() ->> 'email')
  OR EXISTS (
    SELECT 1 FROM estate_access ea
    WHERE ea.workflow_id = workflows.id
      AND coalesce(ea.status, 'accepted') <> 'revoked'
      AND (ea.user_id = auth.uid() OR lower(ea.email) = lower(auth.jwt() ->> 'email'))
  )
  OR (organization_id IS NOT NULL AND is_org_member_of(organization_id))
);
;
