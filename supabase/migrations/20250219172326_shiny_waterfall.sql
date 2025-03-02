-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- First ensure the admin profile exists
DO $$ 
DECLARE
  new_admin_id uuid := gen_random_uuid();
BEGIN
  -- Try to get the admin user's ID
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'drbrimah@gmail.com'
  ) THEN
    -- Update existing admin user's password and metadata
    UPDATE auth.users
    SET 
      encrypted_password = crypt('5656.99', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      raw_user_meta_data = jsonb_build_object(
        'name', 'Dr. Brimah',
        'role', 'admin'
      ),
      is_super_admin = false,
      role = 'authenticated'
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
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'name', 'Dr. Brimah',
        'role', 'admin'
      ),
      false
    );
  END IF;

  -- Create or update the admin profile
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
END $$;

-- Create admin-specific policies
DO $$ 
BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Admins can do everything" ON remedies;
  DROP POLICY IF EXISTS "Admins can manage categories" ON ailment_categories;
  
  -- Create new admin policies
  CREATE POLICY "Admins can do everything"
    ON remedies
    FOR ALL
    TO authenticated
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

  CREATE POLICY "Admins can manage categories"
    ON ailment_categories
    FOR ALL
    TO authenticated
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