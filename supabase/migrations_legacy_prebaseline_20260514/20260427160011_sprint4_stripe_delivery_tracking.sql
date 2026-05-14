
-- Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  plan text DEFAULT 'free',
  status text DEFAULT 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscription" ON stripe_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS stripe_subs_user_idx ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS stripe_subs_customer_idx ON stripe_subscriptions(stripe_customer_id);

-- Add stripe columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_activated_at timestamptz;

-- Delivery status on workflow_actions
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'
  CHECK (delivery_status IN ('pending','sent','delivered','failed','bounced'));
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS recipient_name text;

-- Notification log for full audit trail
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  action_id uuid REFERENCES workflow_actions(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms')),
  recipient_email text,
  recipient_phone text,
  recipient_name text,
  subject text,
  body_preview text,
  provider text CHECK (provider IN ('resend','twilio')),
  provider_id text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage notification log" ON notification_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS notif_log_workflow_idx ON notification_log(workflow_id);
CREATE INDEX IF NOT EXISTS notif_log_status_idx ON notification_log(status, created_at);
;
