/*
  # Fix admin user and authentication

  1. Changes
    - Safely handle foreign key constraints
    - Recreate admin user with proper credentials
    - Update RLS policies
*/

-- Reset and recreate admin user
DO $$ 
DECLARE
  new_user_id uuid;
BEGIN
  -- First delete the profile, then the user to handle foreign key constraint
  DELETE FROM user_profiles 
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'drbrimah@gmail.com');
  
  DELETE FROM auth.users 
  WHERE email = 'drbrimah@gmail.com';
  
  -- Create new admin user with proper password
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
    confirmation_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'drbrimah@gmail.com',
    crypt('5656.99', gen_salt('bf')),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dr. Brimah", "role": "admin"}',
    false,
    NOW(),
    NOW(),
    NULL
  ) RETURNING id INTO new_user_id;

  -- Create admin profile
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
    NOW(),
    NOW()
  );
END $$;

-- Recreate RLS policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;

  -- Create simplified policies
  CREATE POLICY "Anyone can view profiles"
    ON user_profiles FOR SELECT
    USING (true);

  CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Admins have full access"
    ON user_profiles FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    );
END $$;