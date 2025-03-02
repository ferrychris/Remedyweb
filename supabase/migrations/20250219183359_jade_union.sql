-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- First ensure we have the admin user with correct credentials
DO $$ 
DECLARE
  new_admin_id uuid := gen_random_uuid();
BEGIN
  -- Try to get the admin user's ID
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'drbrimah@gmail.com'
  ) THEN
    -- Update existing admin user and get their ID
    UPDATE auth.users
    SET 
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"name":"Dr. Brimah","role":"admin"}',
      email_confirmed_at = now(),
      confirmation_token = null,
      recovery_token = null,
      is_super_admin = false,
      role = 'authenticated',
      updated_at = now()
    WHERE email = 'drbrimah@gmail.com'
    RETURNING id INTO new_admin_id;
  ELSE
    -- Create new admin user with explicit ID
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      new_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'drbrimah@gmail.com',
      crypt('5656.99', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Dr. Brimah","role":"admin"}',
      false
    );
  END IF;

  -- Now we can safely create or update the admin profile with the known ID
  IF new_admin_id IS NOT NULL THEN
    INSERT INTO user_profiles (
      id,
      display_name,
      is_admin,
      created_at,
      updated_at
    ) VALUES (
      new_admin_id,
      'Dr. Brimah',
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      display_name = EXCLUDED.display_name,
      is_admin = true,
      updated_at = now();
  END IF;
END $$;

-- Ensure proper RLS policies exist
DO $$ 
BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;
  
  -- Create new admin policies
  CREATE POLICY "Admins have full access"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (
      is_admin = true OR id = auth.uid()
    )
    WITH CHECK (
      is_admin = true OR id = auth.uid()
    );
END $$;