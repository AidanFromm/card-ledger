-- =============================================
-- Fast Search: Full-Text Search + Trigram Indexes
-- Migration: 20260202_fast_search_indexes.sql
-- =============================================

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- PRODUCTS TABLE: Add sports fields + search indexes
-- =============================================

-- Add sports card fields to products table (for caching sports card lookups)
ALTER TABLE products ADD COLUMN IF NOT EXISTS player TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rookie BOOLEAN DEFAULT false;

-- Add search optimization column
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Update search_text to concatenate all searchable fields
UPDATE products SET search_text = LOWER(
  COALESCE(name, '') || ' ' ||
  COALESCE(set_name, '') || ' ' ||
  COALESCE(card_number, '') || ' ' ||
  COALESCE(player, '') || ' ' ||
  COALESCE(team, '') || ' ' ||
  COALESCE(brand, '')
);

-- Create trigger to auto-update search_text
CREATE OR REPLACE FUNCTION update_products_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := LOWER(
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.set_name, '') || ' ' ||
    COALESCE(NEW.card_number, '') || ' ' ||
    COALESCE(NEW.player, '') || ' ' ||
    COALESCE(NEW.team, '') || ' ' ||
    COALESCE(NEW.brand, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_text ON products;
CREATE TRIGGER trg_products_search_text
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_search_text();

-- =============================================
-- TRIGRAM INDEXES for fuzzy matching
-- =============================================

-- Main trigram index on search_text (covers all fields)
CREATE INDEX IF NOT EXISTS idx_products_search_trgm
ON products USING GIN (search_text gin_trgm_ops);

-- Trigram index on name for fast name lookups
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
ON products USING GIN (name gin_trgm_ops);

-- Trigram index on player for sports card searches
CREATE INDEX IF NOT EXISTS idx_products_player_trgm
ON products USING GIN (player gin_trgm_ops)
WHERE player IS NOT NULL;

-- =============================================
-- FULL-TEXT SEARCH INDEX
-- =============================================

-- Add tsvector column for full-text search
ALTER TABLE products ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- Update FTS vector
UPDATE products SET fts_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(set_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(player, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(team, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(brand, '')), 'C');

-- Create trigger to auto-update FTS vector
CREATE OR REPLACE FUNCTION update_products_fts_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.set_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.player, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.team, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_fts_vector ON products;
CREATE TRIGGER trg_products_fts_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_fts_vector();

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_products_fts
ON products USING GIN (fts_vector);

-- =============================================
-- SEARCH CACHE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 hours')
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- =============================================
-- FAST SEARCH FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION search_products_fast(
  search_query TEXT,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  set_name TEXT,
  card_number TEXT,
  image_url TEXT,
  market_price NUMERIC,
  rarity TEXT,
  subtypes TEXT[],
  artist TEXT,
  pokemon_tcg_id TEXT,
  category TEXT,
  player TEXT,
  team TEXT,
  sport TEXT,
  year INTEGER,
  brand TEXT,
  rookie BOOLEAN,
  relevance REAL
) AS $$
DECLARE
  normalized_query TEXT;
  query_words TEXT[];
BEGIN
  -- Normalize query
  normalized_query := LOWER(TRIM(search_query));
  query_words := string_to_array(normalized_query, ' ');

  RETURN QUERY
  WITH scored_results AS (
    SELECT
      p.id,
      p.name,
      p.set_name,
      p.card_number,
      p.image_url,
      p.market_price,
      p.rarity,
      p.subtypes,
      p.artist,
      p.pokemon_tcg_id,
      p.category,
      p.player,
      p.team,
      p.sport,
      p.year,
      p.brand,
      p.rookie,
      -- Calculate relevance score
      GREATEST(
        -- Exact match bonus
        CASE WHEN LOWER(p.name) = normalized_query THEN 1.0 ELSE 0 END,
        -- Starts with bonus
        CASE WHEN LOWER(p.name) LIKE normalized_query || '%' THEN 0.9 ELSE 0 END,
        -- Trigram similarity on name
        similarity(LOWER(p.name), normalized_query) * 0.8,
        -- Trigram similarity on search_text (all fields)
        similarity(p.search_text, normalized_query) * 0.6,
        -- Player name similarity for sports
        CASE WHEN p.player IS NOT NULL
          THEN similarity(LOWER(p.player), normalized_query) * 0.85
          ELSE 0
        END,
        -- Full-text search rank
        CASE WHEN p.fts_vector @@ plainto_tsquery('english', search_query)
          THEN ts_rank(p.fts_vector, plainto_tsquery('english', search_query)) * 0.7
          ELSE 0
        END
      )::REAL as relevance
    FROM products p
    WHERE
      -- Trigram similarity threshold (catches typos)
      similarity(p.search_text, normalized_query) > 0.15
      OR similarity(LOWER(p.name), normalized_query) > 0.2
      OR (p.player IS NOT NULL AND similarity(LOWER(p.player), normalized_query) > 0.3)
      -- Full-text search
      OR p.fts_vector @@ plainto_tsquery('english', search_query)
      -- Substring match fallback
      OR p.search_text LIKE '%' || normalized_query || '%'
  )
  SELECT * FROM scored_results
  WHERE relevance > 0.1
  ORDER BY
    relevance DESC,
    (image_url IS NOT NULL) DESC,
    market_price DESC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION search_products_fast TO anon, authenticated;
