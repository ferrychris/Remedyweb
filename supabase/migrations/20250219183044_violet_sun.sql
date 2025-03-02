-- First, drop ALL existing policies to start fresh
DO $$ 
BEGIN
  -- Drop ALL possible existing policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;
  DROP POLICY IF EXISTS "view_profiles" ON user_profiles;
  DROP POLICY IF EXISTS "manage_own_profile" ON user_profiles;
  DROP POLICY IF EXISTS "admin_manage_profiles" ON user_profiles;
  DROP POLICY IF EXISTS "profiles_viewable_by_everyone" ON user_profiles;
  DROP POLICY IF EXISTS "profiles_self_management" ON user_profiles;
  DROP POLICY IF EXISTS "profiles_admin_management" ON user_profiles;
END $$;

-- Create new policies with guaranteed unique names
DO $$ 
BEGIN
  -- Basic viewing policy with timestamp in name to ensure uniqueness
  CREATE POLICY "view_all_profiles_20250219183542"
    ON user_profiles FOR SELECT
    USING (true);

  -- User management policy with timestamp
  CREATE POLICY "manage_own_profile_20250219183542"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Admin management policy with timestamp
  CREATE POLICY "admin_full_access_20250219183542"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )
    WITH CHECK (true);
END $$;