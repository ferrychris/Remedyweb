/*
  # Fix authentication setup

  1. Changes
    - Create admin user if not exists
    - Set proper password and metadata
    - Ensure profile exists
    - Add necessary policies
*/

-- Create or update admin user
DO $$ 
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if admin user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'drbrimah@gmail.com'
  ) THEN
    -- Create new admin user
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
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('5656.99', gen_salt('bf')),
      email_confirmed_at = NOW(),
      last_sign_in_at = NOW(),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
      raw_user_meta_data = '{"name": "Dr. Brimah", "role": "admin"}',
      updated_at = NOW(),
      confirmation_token = NULL
    WHERE email = 'drbrimah@gmail.com'
    RETURNING id INTO new_user_id;

    -- Update admin profile
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
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      display_name = EXCLUDED.display_name,
      is_admin = true,
      updated_at = NOW();
  END IF;
END $$;

-- Ensure proper RLS policies
DO $$ 
BEGIN
  -- Recreate user_profiles policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;

  -- Create new policies
  CREATE POLICY "Public profiles are viewable by everyone"
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