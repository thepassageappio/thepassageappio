
-- Seed demo funeral home partner (plan values: trial, basic, premium)
INSERT INTO funeral_home_partners (
  name, owner_name, email, phone,
  address, city, state, zip,
  plan, monthly_fee_cents,
  trial_started_at, trial_ends_at,
  brand_name, families_referred, families_activated, activation_rate,
  created_at, updated_at
) VALUES (
  'Collins Family Funeral Home',
  'Michael Collins',
  'demo@collinsffh.com',
  '+18455550100',
  '42 River Street',
  'Beacon', 'NY', '12508',
  'trial', 0,
  now(), now() + interval '90 days',
  'Collins Family', 0, 0, 0,
  now(), now()
) ON CONFLICT DO NOTHING;

-- Seed the organization
INSERT INTO organizations (
  type, name, slug,
  support_email, from_name,
  white_label_enabled, marketplace_enabled,
  created_at, updated_at
) VALUES (
  'funeral_home',
  'Collins Family Funeral Home',
  'collins-family-fh',
  'demo@collinsffh.com',
  'Collins Family via Passage',
  false, false,
  now(), now()
) ON CONFLICT (slug) DO NOTHING;

-- Add 3 additional marketplace providers for demo completeness
INSERT INTO marketplace_providers (name, category) VALUES
  ('Neptune Society', 'funeral_home'),
  ('Dignity Memorial', 'funeral_home'),
  ('National Cremation Society', 'funeral_home')
ON CONFLICT DO NOTHING;
;
