-- Create extension for generating UUIDs if not exists
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

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS ailments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  symptoms text[],
  common_causes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS remedies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  ingredients text[] NOT NULL,
  instructions text[] NOT NULL,
  warnings text[],
  ailment_ids uuid[] REFERENCES ailments(id),
  status text NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS remedy_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  remedy_id uuid REFERENCES remedies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(remedy_id, user_id)
);

CREATE TABLE IF NOT EXISTS remedy_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  remedy_id uuid REFERENCES remedies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  vote_type text CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(remedy_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ailments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedies ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedy_votes ENABLE ROW LEVEL SECURITY;

-- Create policies with unique names
DO $$ 
BEGIN
  -- User Profiles Policies
  DROP POLICY IF EXISTS "profiles_view_20250219183326" ON user_profiles;
  DROP POLICY IF EXISTS "profiles_update_20250219183326" ON user_profiles;
  
  CREATE POLICY "profiles_view_20250219183326"
    ON user_profiles FOR SELECT
    USING (true);

  CREATE POLICY "profiles_update_20250219183326"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Ailments Policies
  DROP POLICY IF EXISTS "ailments_view_20250219183326" ON ailments;
  DROP POLICY IF EXISTS "ailments_admin_20250219183326" ON ailments;
  
  CREATE POLICY "ailments_view_20250219183326"
    ON ailments FOR SELECT
    USING (true);

  CREATE POLICY "ailments_admin_20250219183326"
    ON ailments FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    );

  -- Remedies Policies
  DROP POLICY IF EXISTS "remedies_view_approved_20250219183326" ON remedies;
  DROP POLICY IF EXISTS "remedies_view_own_20250219183326" ON remedies;
  DROP POLICY IF EXISTS "remedies_insert_20250219183326" ON remedies;
  DROP POLICY IF EXISTS "remedies_update_own_20250219183326" ON remedies;

  CREATE POLICY "remedies_view_approved_20250219183326"
    ON remedies FOR SELECT
    USING (status = 'approved');

  CREATE POLICY "remedies_view_own_20250219183326"
    ON remedies FOR SELECT
    USING (user_id = auth.uid());

  CREATE POLICY "remedies_insert_20250219183326"
    ON remedies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "remedies_update_own_20250219183326"
    ON remedies FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Reviews Policies
  DROP POLICY IF EXISTS "reviews_view_20250219183326" ON remedy_reviews;
  DROP POLICY IF EXISTS "reviews_insert_20250219183326" ON remedy_reviews;
  DROP POLICY IF EXISTS "reviews_update_own_20250219183326" ON remedy_reviews;

  CREATE POLICY "reviews_view_20250219183326"
    ON remedy_reviews FOR SELECT
    USING (true);

  CREATE POLICY "reviews_insert_20250219183326"
    ON remedy_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "reviews_update_own_20250219183326"
    ON remedy_reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Votes Policies
  DROP POLICY IF EXISTS "votes_view_20250219183326" ON remedy_votes;
  DROP POLICY IF EXISTS "votes_insert_20250219183326" ON remedy_votes;
  DROP POLICY IF EXISTS "votes_update_own_20250219183326" ON remedy_votes;

  CREATE POLICY "votes_view_20250219183326"
    ON remedy_votes FOR SELECT
    USING (true);

  CREATE POLICY "votes_insert_20250219183326"
    ON remedy_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "votes_update_own_20250219183326"
    ON remedy_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Grant Permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Create or replace function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
  DROP TRIGGER IF EXISTS update_ailments_updated_at ON ailments;
  DROP TRIGGER IF EXISTS update_remedies_updated_at ON remedies;
  DROP TRIGGER IF EXISTS update_remedy_reviews_updated_at ON remedy_reviews;
  
  -- Create new triggers
  CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

  CREATE TRIGGER update_ailments_updated_at
    BEFORE UPDATE ON ailments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

  CREATE TRIGGER update_remedies_updated_at
    BEFORE UPDATE ON remedies
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

  CREATE TRIGGER update_remedy_reviews_updated_at
    BEFORE UPDATE ON remedy_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
END $$;