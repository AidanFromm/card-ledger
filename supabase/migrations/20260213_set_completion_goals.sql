-- Migration: Set Completion Goals and Master Set Tracking
-- Add new columns to set_progress table for goals and master set tracking

-- Add goal_percentage column (default to 100 for full completion)
ALTER TABLE set_progress 
ADD COLUMN IF NOT EXISTS goal_percentage INTEGER DEFAULT 100;

-- Add track_master_set column (includes all variants like reverse holos, secret rares)
ALTER TABLE set_progress 
ADD COLUMN IF NOT EXISTS track_master_set BOOLEAN DEFAULT FALSE;

-- Add master_total column (total cards including all variants)
ALTER TABLE set_progress 
ADD COLUMN IF NOT EXISTS master_total INTEGER DEFAULT NULL;

-- Add master_owned column (owned cards including variants)
ALTER TABLE set_progress 
ADD COLUMN IF NOT EXISTS master_owned INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN set_progress.goal_percentage IS 'Completion goal percentage (10-100). User can set a target like 75% instead of full 100%';
COMMENT ON COLUMN set_progress.track_master_set IS 'Whether to track all variants (reverse holos, secret rares, promos) for master set completion';
COMMENT ON COLUMN set_progress.master_total IS 'Total cards including all variants for master set tracking';
COMMENT ON COLUMN set_progress.master_owned IS 'Owned cards including all variants for master set tracking';

-- Add index for faster goal tracking queries
CREATE INDEX IF NOT EXISTS idx_set_progress_goal 
ON set_progress(user_id, goal_percentage, completion_percentage);

-- Update existing records to have default goal of 100%
UPDATE set_progress 
SET goal_percentage = 100 
WHERE goal_percentage IS NULL;
