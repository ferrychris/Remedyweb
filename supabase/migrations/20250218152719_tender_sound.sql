/*
  # Update admin user profile

  1. Changes
    - Update existing user profile for drbrimah@gmail.com with admin privileges
  
  2. Security
    - Only updates the user profile
    - Ensures admin privileges are set
*/

-- Update admin profile for existing user
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'drbrimah@gmail.com' LIMIT 1
)
INSERT INTO user_profiles (id, display_name, is_admin)
SELECT id, 'Admin', true
FROM admin_user
ON CONFLICT (id) DO UPDATE
SET is_admin = true, display_name = 'Admin';