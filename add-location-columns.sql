-- Migration script to add lat and long columns to volunteers table
-- Run this if the columns don't exist

-- Check if columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add lat column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'lat'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN lat DOUBLE PRECISION;
        RAISE NOTICE 'Added lat column';
    ELSE
        RAISE NOTICE 'lat column already exists';
    END IF;

    -- Add long column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'long'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN long DOUBLE PRECISION;
        RAISE NOTICE 'Added long column';
    ELSE
        RAISE NOTICE 'long column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'volunteers' AND column_name IN ('lat', 'long')
ORDER BY column_name;
