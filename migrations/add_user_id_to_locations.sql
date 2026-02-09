-- Migration: Add user_id column to practice_locations table
-- This enables user-isolated locations where each user sees only their own locations

-- IMPORTANT: Run this in your Neon DB console or via psql

-- Step 1: Add user_id column (nullable first)
ALTER TABLE practice_locations ADD COLUMN user_id VARCHAR(255);

-- Step 2: Update existing rows with a default user (e.g., 'novaosc' as default)
UPDATE practice_locations SET user_id = 'novaosc' WHERE user_id IS NULL;

-- Step 3: Set NOT NULL constraint after all rows have user_id
ALTER TABLE practice_locations ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add index for faster lookups
CREATE INDEX idx_practice_locations_user_id ON practice_locations(user_id);

-- Verify the table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'practice_locations';

-- Optional: If you want to drop old hardcoded data and start fresh
-- TRUNCATE TABLE practice_locations;
