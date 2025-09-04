-- Cleanup script to remove any previous main modifier attempts
-- Run this FIRST in your Supabase SQL editor

-- 1. Remove main_modifier_id column from estimates if it exists
ALTER TABLE estimates DROP COLUMN IF EXISTS main_modifier_id;

-- 2. Drop main_modifiers table if it exists
DROP TABLE IF EXISTS main_modifiers;

-- 3. Drop any indexes that might exist
DROP INDEX IF EXISTS idx_main_modifiers_enabled;
DROP INDEX IF EXISTS idx_estimates_main_modifier_id;

-- 4. Check that cleanup worked
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'estimates' AND column_name = 'main_modifier_id';
-- This should return no rows if cleanup worked

SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'main_modifiers';
-- This should return no rows if cleanup worked
