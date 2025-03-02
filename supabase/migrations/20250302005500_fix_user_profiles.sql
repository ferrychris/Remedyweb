-- Ensure user_profiles table has correct structure
create table if not exists user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    bio text,
    avatar_url text,
    is_admin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table user_profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can read own profile" on user_profiles;
drop policy if exists "Users can update own profile" on user_profiles;
drop policy if exists "Admins can read all profiles" on user_profiles;
drop policy if exists "Admins can update all profiles" on user_profiles;

-- Create function to check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from user_profiles
    where id = auth.uid()::uuid
    and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Allow users to read their own profile and admins to read all profiles
create policy "Users can read profiles"
on user_profiles for select
using (
  auth.uid()::uuid = id -- User can read their own profile
  or 
  is_admin() -- Admin can read all profiles
);

-- Allow users to update their own non-admin fields
create policy "Users can update own profile"
on user_profiles for update
using (auth.uid()::uuid = id)
with check (
  auth.uid()::uuid = id 
  and 
  case 
    when is_admin() then true -- Admins can update all fields
    else old.is_admin = new.is_admin -- Non-admins cannot change is_admin status
  end
);

-- Allow admins to update any profile
create policy "Admins can update all profiles"
on user_profiles for update
using (is_admin())
with check (is_admin());

-- Create trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
    before update on user_profiles
    for each row
    execute function update_updated_at_column();