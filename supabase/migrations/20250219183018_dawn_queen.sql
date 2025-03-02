-- First, drop any existing policies on user_profiles
DO $$ 
BEGIN
  -- Drop ALL existing policies to start fresh
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
END $$;

-- Create new policies with unique names
DO $$ 
BEGIN
  -- Basic viewing policy
  CREATE POLICY "profiles_viewable_by_everyone"
    ON user_profiles FOR SELECT
    USING (true);

  -- User management policies
  CREATE POLICY "profiles_self_management"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Admin management policy
  CREATE POLICY "profiles_admin_management"
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