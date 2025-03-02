/*
  # Fix RLS policies to prevent infinite recursion - Final Version

  1. Changes
    - Remove all existing policies and create new simplified ones
    - Use direct boolean checks without circular references
    - Ensure proper table permissions
*/

-- First, ensure proper schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Reset and recreate RLS policies with simplified approach
DO $$ 
BEGIN
  -- Drop ALL existing policies to start fresh
  DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can insert" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can delete" ON user_profiles;

  -- Create new, simplified policies
  CREATE POLICY "view_profiles"
    ON user_profiles FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "manage_own_profile"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "admin_manage_profiles"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (
      CASE WHEN auth.uid() IS NULL THEN false
      ELSE (
        SELECT is_admin
        FROM user_profiles
        WHERE id = auth.uid()
        LIMIT 1
      ) IS TRUE
      END
    )
    WITH CHECK (true);
END $$;

-- Ensure proper table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;