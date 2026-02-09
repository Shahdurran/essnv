-- Migration: Add user_id column to practice_locations table
-- This enables user-isolated locations where each user sees only their own locations

-- IMPORTANT: Run this in your Neon DB console or via psql

-- Step 1: Add user_id column with default empty string (nullable first)
ALTER TABLE practice_locations ADD COLUMN user_id VARCHAR(255) DEFAULT '';

-- Step 2: Update existing rows with default empty string
UPDATE practice_locations SET user_id = '' WHERE user_id IS NULL OR user_id = '';

-- Step 3: If you want to make it NOT NULL, uncomment the following:
-- ALTER TABLE practice_locations ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_practice_locations_user_id ON practice_locations(user_id);

-- Verify the table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'practice_locations';

-- Optional: Drop old index if exists
-- DROP INDEX IF EXISTS idx_practice_locations_user_id;
