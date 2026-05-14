
-- ── 1. MISSING COLUMNS ────────────────────────────────────────────────────────
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id uuid;

-- ── 2. CASE ACTIVATION FUNCTION (correct status values) ──────────────────────
CREATE OR REPLACE FUNCTION activate_estate(p_workflow_id uuid, p_activated_by text DEFAULT 'system')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_count int := 0;
  v_fh_count int := 0;
BEGIN
  -- Activate the estate (draft → activated)
  UPDATE workflows
  SET
    activation_status = 'activated',
    activated_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id
    AND activation_status = 'draft';

  -- Family tasks: draft → pending
  UPDATE tasks
  SET status = 'pending', activated_at = now(), updated_at = now()
  WHERE workflow_id = p_workflow_id
    AND status = 'draft'
    AND (funeral_home_eligible = false OR funeral_home_eligible IS NULL);
  GET DIAGNOSTICS v_family_count = ROW_COUNT;

  -- FH-eligible tasks: draft → assigned (go to FH work queue)
  UPDATE tasks
  SET status = 'assigned', activated_at = now(), updated_at = now()
  WHERE workflow_id = p_workflow_id
    AND status = 'draft'
    AND funeral_home_eligible = true;
  GET DIAGNOSTICS v_fh_count = ROW_COUNT;

  -- Log activation event
  INSERT INTO estate_events (estate_id, event_type, title, description, actor, created_at)
  VALUES (
    p_workflow_id, 'estate_activated', 'Case activated',
    v_family_count || ' family tasks + ' || v_fh_count || ' staff tasks activated.',
    p_activated_by, now()
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'activated', true,
    'family_tasks', v_family_count,
    'fh_tasks', v_fh_count
  );
END;
$$;

-- ── 3. AUTO-ACTIVATE TRIGGER (urgent intake → tasks go live immediately) ──────
CREATE OR REPLACE FUNCTION auto_activate_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('urgent_first_steps_generated','active','in_progress','coordination_active','planning_active')
    AND coalesce(OLD.activation_status,'draft') = 'draft'
    AND NEW.activation_status = 'draft'
  THEN
    PERFORM activate_estate(NEW.id, 'auto');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS workflows_auto_activate ON workflows;
CREATE TRIGGER workflows_auto_activate
  AFTER UPDATE OF status ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_on_status_change();

-- ── 4. BACKFILL: activate estates whose status is already live ─────────────────
-- Safe: only touches estates that are in draft activation_status
-- but whose workflow status indicates they should be live
DO $$
DECLARE
  w record;
  result jsonb;
BEGIN
  FOR w IN
    SELECT id, deceased_name, status FROM workflows
    WHERE activation_status = 'draft'
    AND status IN (
      'urgent_first_steps_generated','active','coordination_active',
      'planning_active','in_progress','triggered'
    )
  LOOP
    result := activate_estate(w.id, 'backfill');
    RAISE NOTICE 'Activated: % - %', w.deceased_name, result::text;
  END LOOP;
END $$;
;
