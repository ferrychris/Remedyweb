/*
  # Enable admin privileges for existing user

  This migration enables admin privileges for an existing user profile.
  It does NOT create the user account itself, as that should be done through the auth UI.

  1. Changes
    - Updates user profile to grant admin privileges
    
  2. Security
    - Only affects user profile table
    - Preserves existing auth system integrity
*/

-- Create function to safely update admin privileges
CREATE OR REPLACE FUNCTION update_admin_privileges(admin_email TEXT)
RETURNS void AS $$
BEGIN
  -- Update or insert admin profile for the user
  INSERT INTO user_profiles (
    id,
    display_name,
    is_admin,
    updated_at
  )
  SELECT 
    id,
    COALESCE(email, 'Admin') as display_name,
    true as is_admin,
    now() as updated_at
  FROM auth.users
  WHERE email = admin_email
  ON CONFLICT (id) DO UPDATE
  SET 
    is_admin = true,
    display_name = EXCLUDED.display_name,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;