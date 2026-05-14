
-- ── 5. NOTIFICATION IMPROVEMENTS ─────────────────────────────────────────────
-- Twilio error 30034 = trial account sending to unverified number
-- Add error_code column for better debugging + retry tracking
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS error_code text;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS retry_count int DEFAULT 0;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS last_retry_at timestamptz;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS next_expected_update text;

-- Backfill error_code from error_message for the 3 known failures
UPDATE notification_log
SET error_code = error_message
WHERE status = 'failed' AND error_message IS NOT NULL AND error_code IS NULL;

-- ── 6. DEMO DATA: seed a clean activated estate for demo ──────────────────────
-- Activate the Collins Family demo estate specifically
DO $$
DECLARE
  demo_estate_id uuid;
BEGIN
  SELECT id INTO demo_estate_id
  FROM workflows
  WHERE deceased_name ILIKE '%Alvarez%'
  AND organization_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF demo_estate_id IS NOT NULL THEN
    PERFORM activate_estate(demo_estate_id, 'demo_seed');
    RAISE NOTICE 'Demo estate activated: %', demo_estate_id;
  END IF;
END $$;

-- ── 7. VENDOR REQUESTS: ensure write path has all required columns ─────────────
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS created_by_email text;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS task_title text;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'normal'
  CHECK (urgency IN ('urgent','high','normal','low'));
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now();

-- ── 8. INDEX FOR DEMO SPEED ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS workflows_activation_status_idx ON workflows(activation_status);
CREATE INDEX IF NOT EXISTS tasks_activated_at_idx ON tasks(activated_at) WHERE activated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_log_status_channel_idx ON notification_log(status, channel);
;
