/*
  # Create remedies table and related schemas

  1. New Tables
    - `remedies`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `ailments` (text array)
      - `ingredients` (text)
      - `preparation` (text)
      - `status` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `remedies` table
    - Add policies for authenticated users to create remedies
    - Add policies for public to read approved remedies
*/

CREATE TABLE IF NOT EXISTS remedies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  ailments text[] NOT NULL,
  ingredients text NOT NULL,
  preparation text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE remedies ENABLE ROW LEVEL SECURITY;

-- Policy for creating remedies (authenticated users only)
CREATE POLICY "Users can create remedies"
  ON remedies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for reading remedies (public can read approved remedies)
CREATE POLICY "Public can read approved remedies"
  ON remedies
  FOR SELECT
  TO public
  USING (status = 'approved');

-- Policy for users to read their own pending remedies
CREATE POLICY "Users can read own remedies"
  ON remedies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate slug before insert
CREATE OR REPLACE FUNCTION set_remedy_slug()
RETURNS trigger AS $$
BEGIN
  NEW.slug := generate_slug(NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remedy_slug_trigger
  BEFORE INSERT ON remedies
  FOR EACH ROW
  EXECUTE FUNCTION set_remedy_slug();