-- Migration: Enhanced Grading System
-- Adds BGS subgrade columns and raw condition tracking

-- Add BGS subgrade columns to inventory_items
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS bgs_centering DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_corners DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_edges DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_surface DECIMAL(3,1);

-- Add raw condition column (NM, LP, MP, HP, DMG)
-- This supplements the existing condition enum with a more flexible text field
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS raw_condition VARCHAR(10);

-- Add index for filtering by raw condition
CREATE INDEX IF NOT EXISTS idx_inventory_items_raw_condition
ON inventory_items(raw_condition)
WHERE raw_condition IS NOT NULL;

-- Add index for BGS graded items (to quickly find items needing subgrade display)
CREATE INDEX IF NOT EXISTS idx_inventory_items_bgs
ON inventory_items(grading_company, grade)
WHERE grading_company = 'bgs';

-- Comment on new columns
COMMENT ON COLUMN inventory_items.bgs_centering IS 'BGS subgrade for centering (1-10, supports half grades like 9.5)';
COMMENT ON COLUMN inventory_items.bgs_corners IS 'BGS subgrade for corners (1-10, supports half grades like 9.5)';
COMMENT ON COLUMN inventory_items.bgs_edges IS 'BGS subgrade for edges (1-10, supports half grades like 9.5)';
COMMENT ON COLUMN inventory_items.bgs_surface IS 'BGS subgrade for surface (1-10, supports half grades like 9.5)';
COMMENT ON COLUMN inventory_items.raw_condition IS 'Raw card condition: NM (Near Mint), LP (Lightly Played), MP (Moderately Played), HP (Heavily Played), DMG (Damaged)';

-- Add same columns to sales table for historical tracking
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS bgs_centering DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_corners DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_edges DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS bgs_surface DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS raw_condition VARCHAR(10);
