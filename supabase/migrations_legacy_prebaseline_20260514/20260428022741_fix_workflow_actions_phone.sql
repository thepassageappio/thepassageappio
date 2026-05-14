
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS recipient_phone text;
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS task_title text;

-- Fix the pending actions — mark them failed so UI is honest
UPDATE workflow_actions SET status = 'failed', error_message = 'Pre-fix: email delivery was broken' WHERE status = 'pending';
;
