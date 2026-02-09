-- Migration: Add grading fields to watchlist
-- Allows users to track specific graded versions of cards they want

-- Add grading columns to watchlist
ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS grading_company VARCHAR(10),
ADD COLUMN IF NOT EXISTS grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS raw_condition VARCHAR(10);

-- Add index for filtering by grading
CREATE INDEX IF NOT EXISTS idx_watchlist_grading
ON watchlist(grading_company, grade)
WHERE grading_company IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN watchlist.grading_company IS 'Grading company: psa, bgs, cgc, sgc, ace, tag (null for raw)';
COMMENT ON COLUMN watchlist.grade IS 'Grade value for graded cards (e.g., 10, 9.5, 9)';
COMMENT ON COLUMN watchlist.raw_condition IS 'Condition for raw cards: NM, LP, MP, HP, DMG';
