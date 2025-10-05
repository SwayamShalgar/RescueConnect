-- Migration script to add status column to volunteers table
-- Run this if you get errors about missing 'status' column

-- Check and add status column
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'status'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN status VARCHAR(50) DEFAULT 'offline';
        RAISE NOTICE 'Added status column with default value offline';
        
        -- Set existing volunteers with location to 'available'
        UPDATE volunteers 
        SET status = 'available' 
        WHERE lat IS NOT NULL AND long IS NOT NULL;
        RAISE NOTICE 'Updated volunteers with location to available status';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'volunteers' AND column_name = 'status';

-- Show current volunteer statuses
SELECT 
    COUNT(*) as total_volunteers,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
    COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy,
    COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM volunteers;
