-- Create remedy_likes table
CREATE TABLE IF NOT EXISTS remedy_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remedy_id integer NOT NULL REFERENCES remedies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, remedy_id)
);

-- Add likes_count column to remedies table if it doesn't exist
ALTER TABLE remedies ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE remedy_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for remedy_likes
CREATE POLICY "Users can view all likes"
  ON remedy_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like remedies"
  ON remedy_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike remedies"
  ON remedy_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to increment likes count
CREATE OR REPLACE FUNCTION increment_remedy_likes(p_remedy_id integer)
RETURNS void AS $$
BEGIN
  UPDATE remedies
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_remedy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_remedy_likes(p_remedy_id integer)
RETURNS void AS $$
BEGIN
  UPDATE remedies
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = p_remedy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update likes_count when a like is inserted or deleted
CREATE OR REPLACE FUNCTION update_remedy_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE remedies
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.remedy_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE remedies
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.remedy_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_remedy_likes_count
  AFTER INSERT OR DELETE ON remedy_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_remedy_likes_count(); 