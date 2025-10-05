-- Add latitude and longitude columns to volunteers table
-- Run this migration if using simple columns instead of PostGIS

-- Add latitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN latitude NUMERIC(10, 8);
    END IF;
END $$;

-- Add longitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN longitude NUMERIC(11, 8);
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'status'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN status VARCHAR(20) DEFAULT 'offline';
    END IF;
END $$;

-- Add last_login column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN last_login TIMESTAMP;
    END IF;
END $$;

-- Add experience column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'experience'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN experience VARCHAR(100);
    END IF;
END $$;

-- Create index on location for faster queries
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);

-- Set default status for existing volunteers
UPDATE volunteers SET status = 'offline' WHERE status IS NULL;

COMMENT ON COLUMN volunteers.latitude IS 'Volunteer current latitude coordinate';
COMMENT ON COLUMN volunteers.longitude IS 'Volunteer current longitude coordinate';
COMMENT ON COLUMN volunteers.status IS 'Volunteer availability status: available, busy, offline';
COMMENT ON COLUMN volunteers.last_login IS 'Last login timestamp with location update';
COMMENT ON COLUMN volunteers.experience IS 'Volunteer experience level or description';
