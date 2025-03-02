/*
  # Update Admin Password

  1. Changes
    - Updates password for existing admin user
    - Ensures admin privileges are set
  
  2. Security
    - Password is securely hashed
    - Only updates if user exists
*/

-- Update admin user's password
UPDATE auth.users
SET encrypted_password = crypt('5656.99', gen_salt('bf')),
    updated_at = now()
WHERE email = 'drbrimah@gmail.com';

-- Ensure admin profile is set up correctly
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'drbrimah@gmail.com' LIMIT 1
)
INSERT INTO user_profiles (id, display_name, is_admin)
SELECT id, 'Admin', true
FROM admin_user
ON CONFLICT (id) DO UPDATE
SET is_admin = true, display_name = 'Admin';