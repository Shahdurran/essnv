-- MIGRATION: Fix practice_locations NOT NULL constraints in Neon DB
-- Run this in Neon DB Console or via psql to fix the location saving issue
-- ============================================================================

-- Step 1: Drop existing constraints on optional columns
ALTER TABLE practice_locations 
ALTER COLUMN city DROP NOT NULL,
ALTER COLUMN state DROP NOT NULL,
ALTER COLUMN zip_code DROP NOT NULL,
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL;

-- Step 2: Set default values to empty string for safety
ALTER TABLE practice_locations 
ALTER COLUMN city SET DEFAULT '',
ALTER COLUMN state SET DEFAULT '',
ALTER COLUMN zip_code SET DEFAULT '',
ALTER COLUMN address SET DEFAULT '',
ALTER COLUMN phone SET DEFAULT '';

-- Step 3: Update existing NULL values to empty strings
UPDATE practice_locations SET city = '' WHERE city IS NULL;
UPDATE practice_locations SET state = '' WHERE state IS NULL;
UPDATE practice_locations SET zip_code = '' WHERE zip_code IS NULL;
UPDATE practice_locations SET address = '' WHERE address IS NULL;
UPDATE practice_locations SET phone = '' WHERE phone IS NULL;

-- Verification: Check the table structure
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'practice_locations'
-- ORDER BY ordinal_position;

-- Success message
-- SELECT 'Migration complete! Columns are now nullable with default empty string.' AS status;
