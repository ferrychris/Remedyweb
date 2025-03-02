-- Drop existing function if exists
drop function if exists is_admin(uuid);

-- Create a function to check if a user is an admin
create or replace function is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from user_profiles
    where id::uuid = user_id and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Add RLS policies for admin access
alter table user_profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Admins can view all profiles" on user_profiles;
drop policy if exists "Admins can update all profiles" on user_profiles;

create policy "Admins can view all profiles"
  on user_profiles for select
  to authenticated
  using (
    is_admin(auth.uid()::uuid) = true
    or id::uuid = auth.uid()::uuid
  );

create policy "Admins can update all profiles"
  on user_profiles for update
  to authenticated
  using (is_admin(auth.uid()::uuid) = true)
  with check (is_admin(auth.uid()::uuid) = true);

-- Create initial admin user if not exists
do $$
declare
  admin_user_id uuid;
begin
  -- Get or create admin user
  insert into auth.users (email, password_hash, email_confirmed_at)
  values (
    'admin@admin.com',
    crypt('admin', gen_salt('bf')),
    now()
  )
  on conflict (email) do update
  set email_confirmed_at = now()
  returning id into admin_user_id;

  -- Set admin privileges
  insert into user_profiles (id, display_name, is_admin, created_at, updated_at)
  values (
    admin_user_id,
    'Administrator',
    true,
    now(),
    now()
  )
  on conflict (id) do update
  set 
    is_admin = true,
    display_name = 'Administrator',
    updated_at = now();
end;
$$ language plpgsql security definer;