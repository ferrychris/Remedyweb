-- First, ensure proper schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- First, ensure we can create the admin user
  DELETE FROM user_profiles 
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'drbrimah@gmail.com');
  
  DELETE FROM auth.users 
  WHERE email = 'drbrimah@gmail.com';

  -- Create the admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'drbrimah@gmail.com',
    crypt('5656.99', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dr. Brimah","role":"admin"}',
    false,
    now(),
    now(),
    null,
    null,
    null,
    null
  ) RETURNING id INTO new_user_id;

  -- Create the admin profile
  INSERT INTO user_profiles (
    id,
    display_name,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'Dr. Brimah',
    true,
    now(),
    now()
  );

  RETURN new_user_id;
END;
$$;

-- Create admin user using the secure function
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT create_admin_user() INTO admin_id;
END $$;

-- Drop the function after use
DROP FUNCTION create_admin_user();

-- Ensure proper table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Reset and recreate RLS policies with unique names
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;

  -- Create policies with unique names
  CREATE POLICY "profiles_view_20250219062655"
    ON user_profiles FOR SELECT
    USING (true);

  CREATE POLICY "profiles_update_20250219062655"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "profiles_admin_20250219062655"
    ON user_profiles FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )
    WITH CHECK (true);
END $$;