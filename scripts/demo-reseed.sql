-- Passage demo instance — reseed script
-- docs/redesign/06-admin-access-demo-instance.md
--
-- Scope discipline: every statement below is scoped to organization_id =
-- DEMO_ORG_ID (the "Rivera Funeral Home (Demo)" org, created 2026-07-12,
-- slug 'rivera-funeral-home-demo'). Nothing here ever touches a row outside
-- that organization_id / the workflow/task/people rows linked to it. Safe to
-- re-run: each block deletes only its own demo rows first, then re-inserts.
--
-- ONE MANUAL STEP REQUIRED BEFORE THIS SCRIPT CAN RUN (flagged to Steve):
-- Supabase Auth users cannot be safely created by hand-inserting into
-- auth.users via SQL — that bypasses GoTrue's password hashing/session
-- machinery and produces a broken login. There is no Auth-admin MCP tool
-- available in this environment either. So the demo *director* login must
-- be created the same way every real funeral-home account is created: sign
-- up once at /funeral-home/setup with a dedicated demo email (suggested:
-- demo@thepassageapp.io). That signup flow creates the auth.users row and
-- an organizations row the normal way — DISCARD the auto-created
-- organization from that signup (or repoint it), then set
-- organization_members.organization_id for that user to the DEMO_ORG_ID
-- below so they land in the seeded demo org instead of an empty one.
--
-- Once that login exists, replace :owner_user_id below with its auth.users
-- id and run this whole script (psql -v or Supabase SQL editor "Find and
-- replace" both work) to populate realistic case data.

-- ============================================================
-- Constants (fill in after the manual signup step above)
-- ============================================================
-- DEMO_ORG_ID:     b36f8032-2f08-43f1-91f6-760c3c4f4ca6   (already created — see organizations.slug='rivera-funeral-home-demo')
-- :owner_user_id    <- REPLACE with the auth.users.id from the demo signup

-- ============================================================
-- 1. Director membership (the login Steve signs in with to demo)
-- ============================================================
DELETE FROM organization_members WHERE organization_id = 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6';

INSERT INTO organization_members (organization_id, user_id, email, role, status, display_name, title)
VALUES (
  'b36f8032-2f08-43f1-91f6-760c3c4f4ca6',
  :'owner_user_id',
  'demo@thepassageapp.io',
  'director',
  'active',
  'Maria Rivera',
  'Funeral Director / Owner'
);

-- ============================================================
-- 2. Sample cases (workflows) — mirrors the hero-mockup scenario
--    (docs/redesign/hero-screens-mockup.html, Screen 3)
-- ============================================================
DELETE FROM tasks WHERE organization_id = 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6';
DELETE FROM workflows WHERE organization_id = 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6';

WITH new_workflows AS (
  INSERT INTO workflows (
    user_id, organization_id, name, status, mode,
    deceased_first_name, deceased_last_name, deceased_name,
    coordinator_name, coordinator_email,
    date_of_death, setup_stage, activation_status
  )
  VALUES
    (:'owner_user_id', 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', 'Margaret Reyes — Passage', 'active', 'guided',
      'Margaret', 'Reyes', 'Margaret Reyes',
      'Elena Reyes', 'elena.demo@thepassageapp.io',
      CURRENT_DATE - INTERVAL '6 days', 'complete', 'active'),
    (:'owner_user_id', 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', 'Harold Kim — Passage', 'active', 'guided',
      'Harold', 'Kim', 'Harold Kim',
      'James Kim', 'james.demo@thepassageapp.io',
      CURRENT_DATE - INTERVAL '3 days', 'complete', 'active'),
    (:'owner_user_id', 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', 'Dorothy Fields — Passage', 'completed', 'guided',
      'Dorothy', 'Fields', 'Dorothy Fields',
      'Grace Fields', 'grace.demo@thepassageapp.io',
      CURRENT_DATE - INTERVAL '18 days', 'complete', 'active')
  RETURNING id, deceased_first_name
)
-- ============================================================
-- 3. Tasks per case — a realistic, partly-completed task spine
-- ============================================================
INSERT INTO tasks (workflow_id, organization_id, user_id, title, category, status, priority, owner_kind, partner_owner_role, waiting_on, funeral_home_eligible)
SELECT id, 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', :'owner_user_id', t.title, t.category, t.status, t.priority, t.owner_kind, t.partner_owner_role, t.waiting_on, true
FROM new_workflows w
CROSS JOIN LATERAL (
  VALUES
    ('Confirm service date and location', 'logistics', 'done', 'high', 'organization', 'director', NULL),
    ('Draft obituary', 'communication', 'in_progress', 'high', 'organization', 'director', 'family'),
    ('Confirm burial plot paperwork', 'documents', 'in_progress', 'medium', 'organization', 'director', 'family'),
    ('Send vendor request — florist', 'vendor', 'not_started', 'medium', 'organization', 'staff', 'vendor'),
    ('Share service date with family', 'communication', 'not_started', 'medium', 'family', NULL, NULL)
) AS t(title, category, status, priority, owner_kind, partner_owner_role, waiting_on)
WHERE w.deceased_first_name = 'Margaret'
UNION ALL
SELECT id, 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', :'owner_user_id', t.title, t.category, t.status, t.priority, t.owner_kind, t.partner_owner_role, t.waiting_on, true
FROM new_workflows w
CROSS JOIN LATERAL (
  VALUES
    ('Confirm service date and location', 'logistics', 'done', 'high', 'organization', 'director', NULL),
    ('Confirm vendor quote', 'vendor', 'not_started', 'high', 'organization', 'staff', 'vendor')
) AS t(title, category, status, priority, owner_kind, partner_owner_role, waiting_on)
WHERE w.deceased_first_name = 'Harold'
UNION ALL
SELECT id, 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6', :'owner_user_id', t.title, t.category, t.status, t.priority, t.owner_kind, t.partner_owner_role, t.waiting_on, true
FROM new_workflows w
CROSS JOIN LATERAL (
  VALUES
    ('Confirm service date and location', 'logistics', 'done', 'high', 'organization', 'director', NULL),
    ('Draft obituary', 'communication', 'done', 'high', 'organization', 'director', NULL),
    ('Family sign-off on arrangements', 'communication', 'done', 'medium', 'family', NULL, NULL)
) AS t(title, category, status, priority, owner_kind, partner_owner_role, waiting_on)
WHERE w.deceased_first_name = 'Dorothy';

-- ============================================================
-- 4. Verification query — run after signup + this script
-- ============================================================
-- select o.name, count(distinct w.id) as cases, count(t.id) as tasks
-- from organizations o
-- left join workflows w on w.organization_id = o.id
-- left join tasks t on t.organization_id = o.id
-- where o.id = 'b36f8032-2f08-43f1-91f6-760c3c4f4ca6'
-- group by o.name;
