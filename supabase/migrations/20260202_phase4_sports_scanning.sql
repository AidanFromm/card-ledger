-- =============================================
-- Phase 4: Sports Cards + Scanning Support
-- Migration: 20260202_phase4_sports_scanning.sql
-- =============================================

-- =============================================
-- SPORTS CARD FIELDS
-- =============================================

-- Player name (e.g., "LeBron James", "Mike Trout")
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS player TEXT;

-- Team name (e.g., "Los Angeles Lakers", "New York Yankees")
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS team TEXT;

-- Sport type enum for efficient filtering
DO $$ BEGIN
  CREATE TYPE sport_type AS ENUM ('baseball', 'basketball', 'football', 'hockey', 'soccer', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS sport sport_type;

-- Card year (e.g., 2023, 1986)
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Rookie card flag - important for collectors
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS rookie BOOLEAN DEFAULT false;

-- Brand/Manufacturer (e.g., "Topps", "Panini", "Upper Deck")
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS brand TEXT;

-- =============================================
-- SCANNING FIELDS
-- =============================================

-- Barcode (UPC for sealed products, cert number for graded cards)
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- How the item was added to inventory
DO $$ BEGIN
  CREATE TYPE scan_source_type AS ENUM ('manual', 'barcode', 'ai_vision', 'import');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS scan_source scan_source_type DEFAULT 'manual';

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Index for sport filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_inventory_items_sport
ON inventory_items(sport) WHERE sport IS NOT NULL;

-- Index for rookie cards (valuable subset)
CREATE INDEX IF NOT EXISTS idx_inventory_items_rookie
ON inventory_items(rookie) WHERE rookie = true;

-- Index for player searches
CREATE INDEX IF NOT EXISTS idx_inventory_items_player
ON inventory_items(user_id, player) WHERE player IS NOT NULL;

-- Index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode
ON inventory_items(barcode) WHERE barcode IS NOT NULL;

-- Composite index for sports card searches
CREATE INDEX IF NOT EXISTS idx_inventory_items_sports_search
ON inventory_items(user_id, sport, year, player);

-- =============================================
-- PRODUCTS TABLE UPDATE (for barcode lookup cache)
-- =============================================

-- Ensure barcode column exists on products table for caching
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- Index for barcode lookups on products (if table exists)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;
