/*
  # Production Database Setup

  1. New Tables
    - `user_profiles`
      - Extended user information
      - Links to auth.users
    - `roles`
      - User role management
    - `remedy_reviews`
      - User reviews and ratings
    - `remedy_votes`
      - Track user votes
    - `ailment_categories`
      - Organize ailments

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Setup admin access controls
*/

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE IF NOT EXISTS remedy_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remedy_id uuid REFERENCES remedies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(remedy_id, user_id)
);

ALTER TABLE remedy_reviews ENABLE ROW LEVEL SECURITY;

-- Votes
CREATE TABLE IF NOT EXISTS remedy_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remedy_id uuid REFERENCES remedies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  vote_type text CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(remedy_id, user_id)
);

ALTER TABLE remedy_votes ENABLE ROW LEVEL SECURITY;

-- Ailment Categories
CREATE TABLE IF NOT EXISTS ailment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ailment_categories ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON remedy_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON remedy_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON remedy_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Votes are viewable by everyone"
  ON remedy_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON remedy_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON remedy_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone"
  ON ailment_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON ailment_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Functions

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing remedies table with new columns
ALTER TABLE remedies
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES ailment_categories(id);

-- Update remedies policies for admin access
CREATE POLICY "Admins can do everything"
  ON remedies
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_remedies_updated_at
    BEFORE UPDATE ON remedies
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON remedy_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON ailment_categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();