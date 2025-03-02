/*
  # Fix RLS policies and admin setup - Final version

  1. Changes
    - Create secure admin check function
    - Reset and simplify RLS policies
    - Set up admin user safely
    - Ensure proper permissions
*/

-- First, ensure proper schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a secure function to check admin status
CREATE OR REPLACE FUNCTION check_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id
    AND is_admin = true
  );
$$;

-- Reset and recreate RLS policies with a new approach
DO $$ 
BEGIN
  -- Drop ALL existing policies
  DROP POLICY IF EXISTS "view_profiles" ON user_profiles;
  DROP POLICY IF EXISTS "manage_own_profile" ON user_profiles;
  DROP POLICY IF EXISTS "admin_manage_profiles" ON user_profiles;
  
  -- Create new, simplified policies
  -- 1. Allow anyone to view profiles (no auth required)
  CREATE POLICY "allow_view_profiles"
    ON user_profiles
    FOR SELECT
    TO public
    USING (true);

  -- 2. Allow users to manage their own profile
  CREATE POLICY "allow_manage_own_profile"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

  -- 3. Allow admins to manage all profiles using the secure function
  CREATE POLICY "allow_admin_manage_profiles"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (check_is_admin(auth.uid()))
    WITH CHECK (check_is_admin(auth.uid()));
END $$;

-- Ensure proper table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Set up admin user safely
DO $$ 
DECLARE
  admin_id uuid;
BEGIN
  -- Get existing admin user ID if it exists
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'drbrimah@gmail.com'
  LIMIT 1;

  -- If admin user doesn't exist, we'll just create the profile
  -- The actual user creation will be handled by the auth UI
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin user not found. Please create via the auth UI.';
  ELSE
    -- Ensure admin profile exists
    INSERT INTO user_profiles (
      id,
      display_name,
      is_admin,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      'Dr. Brimah',
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET is_admin = true,
        display_name = 'Dr. Brimah',
        updated_at = now();
  END IF;
END $$;