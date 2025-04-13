-- Create consultant_availability table
CREATE TABLE IF NOT EXISTS consultant_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    custom_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(consultant_id, day, custom_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_consultant_availability_consultant_id ON consultant_availability(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_availability_custom_date ON consultant_availability(custom_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_consultant_availability_updated_at
    BEFORE UPDATE ON consultant_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 