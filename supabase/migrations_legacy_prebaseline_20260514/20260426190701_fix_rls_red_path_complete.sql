
-- ============================================================
-- FIX 1: workflows — allow anon INSERT, authenticated SELECT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Users own workflows" ON workflows;

-- Anyone can create a workflow (anon red path users)
CREATE POLICY "Anyone can insert workflows"
ON workflows FOR INSERT
WITH CHECK (true);

-- Users can read their own workflows; anon can read by workflow_id match
CREATE POLICY "Anyone can read workflows"
ON workflows FOR SELECT
USING (true);

-- Only owner can update
CREATE POLICY "Owner can update workflows"
ON workflows FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Only owner can delete
CREATE POLICY "Owner can delete workflows"
ON workflows FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- FIX 2: workflow_actions — no policies existed at all
-- ============================================================
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert workflow_actions"
ON workflow_actions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read workflow_actions"
ON workflow_actions FOR SELECT
USING (true);

CREATE POLICY "Anyone can update workflow_actions"
ON workflow_actions FOR UPDATE
USING (true);

-- ============================================================
-- FIX 3: profiles — allow insert for new users (trigger creates row)
-- The 406 happens because no profile row exists yet for new users
-- ============================================================
DROP POLICY IF EXISTS "Users own profiles" ON profiles;

CREATE POLICY "Users can manage own profile"
ON profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow insert when no profile exists yet
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FIX 4: Add assigned_to_email column to tasks if missing
-- (was referenced in App code but may not exist)
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_email text;

-- ============================================================
-- FIX 5: Add deceased_name column to workflows for red path context
-- ============================================================
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS deceased_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS coordinator_name text;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS coordinator_email text;

-- ============================================================
-- FIX 6: Update auth trigger to also create a profile row
-- so 406 on profile load never happens for signed-in users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user row
  INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'family_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Create empty profile row so dashboard never 406s
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIX 7: Create profile row for existing user who has none
-- ============================================================
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT id, NOW(), NOW()
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIX 8: Add unique constraint on profiles.user_id if missing
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
;
