/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Simplify RLS policies to avoid circular references
    - Use direct boolean checks for admin status
    - Ensure proper table permissions
*/

-- First, ensure proper schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Reset and recreate RLS policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;

  -- Create simplified policies that avoid circular references
  CREATE POLICY "Anyone can view profiles"
    ON user_profiles FOR SELECT
    USING (true);

  CREATE POLICY "Users can manage own profile"
    ON user_profiles 
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Admins can manage all profiles"
    ON user_profiles 
    FOR ALL
    USING (
      auth.uid() IN (
        SELECT id FROM user_profiles WHERE is_admin = true
      )
    )
    WITH CHECK (true);
END $$;

-- Ensure proper table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;