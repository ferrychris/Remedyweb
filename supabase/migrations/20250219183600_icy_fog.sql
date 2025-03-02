-- First, ensure proper schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "view_profiles" ON user_profiles;
  DROP POLICY IF EXISTS "manage_own_profile" ON user_profiles;
  DROP POLICY IF EXISTS "admin_manage_profiles" ON user_profiles;
END $$;

-- Create simplified RLS policies
CREATE POLICY "view_profiles"
  ON user_profiles FOR SELECT
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
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (true);

-- Create function to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Delete existing admin if exists
  DELETE FROM user_profiles 
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'drbrimah@gmail.com');
  
  DELETE FROM auth.users 
  WHERE email = 'drbrimah@gmail.com';

  -- Create new admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'drbrimah@gmail.com',
    crypt('5656.99', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dr. Brimah","role":"admin"}',
    false,
    null,
    null
  ) RETURNING id INTO admin_id;

  -- Create admin profile
  INSERT INTO user_profiles (
    id,
    display_name,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    'Dr. Brimah',
    true,
    now(),
    now()
  );
END;
$$;

-- Execute the function to create admin user
SELECT create_admin_user();

-- Drop the function after use
DROP FUNCTION create_admin_user();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;