-- ============================================
-- WISHLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  set_name TEXT,
  image_url TEXT,
  target_price NUMERIC(12, 2),
  current_price NUMERIC(12, 2),
  notes TEXT,
  tcg_type TEXT DEFAULT 'pokemon',
  card_number TEXT,
  rarity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_card_id ON wishlist(card_id);

-- RLS policies for wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist"
  ON wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlist"
  ON wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist"
  ON wishlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlist"
  ON wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wishlist_updated_at
  BEFORE UPDATE ON wishlist
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_updated_at();

-- ============================================
-- SET PROGRESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS set_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  tcg_type TEXT NOT NULL DEFAULT 'pokemon',
  set_logo_url TEXT,
  set_symbol_url TEXT,
  release_date DATE,
  total_cards INTEGER NOT NULL DEFAULT 0,
  owned_cards INTEGER NOT NULL DEFAULT 0,
  completion_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_cards > 0 
      THEN ROUND((owned_cards::NUMERIC / total_cards::NUMERIC) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  owned_card_ids TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, set_id)
);

-- Indexes for set_progress
CREATE INDEX IF NOT EXISTS idx_set_progress_user_id ON set_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_tcg_type ON set_progress(tcg_type);
CREATE INDEX IF NOT EXISTS idx_set_progress_completion ON set_progress(user_id, completion_percentage DESC);

-- RLS policies for set_progress
ALTER TABLE set_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own set progress"
  ON set_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own set progress"
  ON set_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own set progress"
  ON set_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own set progress"
  ON set_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_set_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_progress_updated_at
  BEFORE UPDATE ON set_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_set_progress_updated_at();

-- ============================================
-- SET CARDS CACHE TABLE (for offline support)
-- ============================================

CREATE TABLE IF NOT EXISTS set_cards_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id TEXT NOT NULL UNIQUE,
  tcg_type TEXT NOT NULL,
  set_name TEXT NOT NULL,
  total_cards INTEGER NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for set cards cache
CREATE INDEX IF NOT EXISTS idx_set_cards_cache_set_id ON set_cards_cache(set_id);
CREATE INDEX IF NOT EXISTS idx_set_cards_cache_tcg_type ON set_cards_cache(tcg_type);

-- No RLS needed - this is public cache data
