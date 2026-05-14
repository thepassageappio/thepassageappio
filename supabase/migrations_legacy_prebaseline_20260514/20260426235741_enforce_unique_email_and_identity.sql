
-- ─── 1. USERS TABLE ──────────────────────────────────────────────────────────
-- Unique email constraint (Supabase auth.users already enforces this at the
-- auth layer, but public.users needs it too)
ALTER TABLE public.users 
  ADD CONSTRAINT users_email_unique UNIQUE (email);

-- ─── 2. PROFILES TABLE ───────────────────────────────────────────────────────
-- Already have profiles_user_id_key from earlier migration — verify it exists,
-- add if not
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- ─── 3. LEADS TABLE ──────────────────────────────────────────────────────────
-- Leads intentionally allow multiple submissions per email (someone can go
-- through the flow more than once) — don't unique-constrain email here.
-- But add an index for fast lookup.
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);

-- ─── 4. UPDATE AUTH TRIGGER ──────────────────────────────────────────────────
-- When a user signs in with Google, if they already exist (same email),
-- update their record rather than trying to insert a duplicate.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Upsert into public.users — handles both new signups and re-logins
  INSERT INTO public.users (
    id, email, first_name, last_name, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'family_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    first_name  = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name   = COALESCE(EXCLUDED.last_name, public.users.last_name),
    updated_at  = NOW();

  -- Upsert profile row — one per user, always
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. PEOPLE TABLE ─────────────────────────────────────────────────────────
-- Don't unique-constrain people by email — the same executor could be added
-- to multiple estate plans, which is valid. Allow it.
-- But add an index for fast lookup by owner.
CREATE INDEX IF NOT EXISTS people_owner_id_idx ON people(owner_id);
CREATE INDEX IF NOT EXISTS people_owner_email_idx ON people(owner_id, email) 
  WHERE email IS NOT NULL;

-- ─── 6. WORKFLOWS TABLE ──────────────────────────────────────────────────────
-- One user can have multiple workflows (e.g. helped with dad's estate, 
-- then mom's). Don't unique-constrain — that's intentional.
-- Add index for dashboard load performance.
CREATE INDEX IF NOT EXISTS workflows_user_id_idx ON workflows(user_id, created_at DESC);

-- ─── 7. TASKS TABLE ──────────────────────────────────────────────────────────
-- Tasks are unique per workflow + title (prevents duplicate inserts on retry)
ALTER TABLE tasks 
  DROP CONSTRAINT IF EXISTS tasks_workflow_title_unique;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_workflow_title_unique UNIQUE (workflow_id, title);

-- ─── 8. VERIFY ───────────────────────────────────────────────────────────────
-- Return confirmation of all unique constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
  'public.users'::regclass,
  'public.profiles'::regclass,
  'public.tasks'::regclass
)
AND contype = 'u'
ORDER BY conrelid::text, conname;
;
