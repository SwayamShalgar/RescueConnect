-- Complete Migration Script for Volunteers Table
-- This script ensures all required columns exist

DO $$ 
BEGIN
    RAISE NOTICE 'Starting migration for volunteers table...';
    
    -- Add lat column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'lat'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN lat DOUBLE PRECISION;
        RAISE NOTICE '✓ Added lat column';
    ELSE
        RAISE NOTICE '• lat column already exists';
    END IF;

    -- Add long column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'long'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN long DOUBLE PRECISION;
        RAISE NOTICE '✓ Added long column';
    ELSE
        RAISE NOTICE '• long column already exists';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'status'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN status VARCHAR(50) DEFAULT 'offline';
        RAISE NOTICE '✓ Added status column';
        
        -- Set existing volunteers with location to 'available'
        UPDATE volunteers 
        SET status = 'available' 
        WHERE lat IS NOT NULL AND long IS NOT NULL;
        RAISE NOTICE '✓ Updated volunteers with location to available status';
    ELSE
        RAISE NOTICE '• status column already exists';
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE volunteers ADD COLUMN last_login TIMESTAMP;
        RAISE NOTICE '✓ Added last_login column';
    ELSE
        RAISE NOTICE '• last_login column already exists';
    END IF;

    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'volunteers' 
AND column_name IN ('lat', 'long', 'status', 'last_login')
ORDER BY column_name;

-- Show current statistics
SELECT 
    COUNT(*) as total_volunteers,
    COUNT(lat) as with_latitude,
    COUNT(long) as with_longitude,
    COUNT(CASE WHEN lat IS NOT NULL AND long IS NOT NULL THEN 1 END) as with_complete_location,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as status_available,
    COUNT(CASE WHEN status = 'busy' THEN 1 END) as status_busy,
    COUNT(CASE WHEN status = 'offline' THEN 1 END) as status_offline
FROM volunteers;

-- Show sample data
SELECT 
    id,
    name,
    SUBSTRING(contact, 1, 20) as contact,
    lat,
    long,
    status,
    last_login
FROM volunteers 
LIMIT 5;
