-- CardLedger Price History Infrastructure
-- Created: 2026-02-04
-- Feature: Track historical prices for portfolio P&L analysis

-- ============================================
-- PRICE_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to inventory item (nullable for historical data of deleted items)
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,

  -- Item identification (denormalized for historical accuracy)
  item_name TEXT NOT NULL,
  set_name TEXT,
  grading_company grading_company,
  grade TEXT,

  -- Price data
  market_price DECIMAL(12,2) NOT NULL CHECK (market_price >= 0),
  lowest_listed DECIMAL(12,2) CHECK (lowest_listed >= 0),
  price_source TEXT, -- e.g., 'scrydex', 'pokemon_tcg_api', 'tavily', 'manual'

  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  recorded_date DATE DEFAULT CURRENT_DATE NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary lookup: item history sorted by date
CREATE INDEX idx_price_history_item_date ON public.price_history(inventory_item_id, recorded_at DESC);

-- Date-based queries for portfolio snapshots
CREATE INDEX idx_price_history_recorded_date ON public.price_history(recorded_date DESC);

-- User-based queries (via inventory_items join)
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Users can only view price history for their own inventory items
CREATE POLICY "Users view own price history" ON public.price_history
  FOR SELECT
  USING (
    inventory_item_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.inventory_items
      WHERE id = price_history.inventory_item_id
      AND user_id = auth.uid()
    )
  );

-- Only system (via service role) can insert price history
-- This prevents users from manipulating historical data
CREATE POLICY "Service role inserts price history" ON public.price_history
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RETENTION CLEANUP FUNCTION
-- ============================================

-- Data retention policy:
-- - Keep all data for first 90 days (daily granularity)
-- - After 90 days, keep only weekly snapshots (Saturday)
-- - After 1 year, keep only monthly snapshots (1st of month)

CREATE OR REPLACE FUNCTION cleanup_price_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  weekly_deleted INTEGER := 0;
  monthly_deleted INTEGER := 0;
BEGIN
  -- Delete non-Saturday records older than 90 days (keep weekly)
  DELETE FROM public.price_history
  WHERE recorded_date < CURRENT_DATE - INTERVAL '90 days'
    AND recorded_date >= CURRENT_DATE - INTERVAL '1 year'
    AND EXTRACT(DOW FROM recorded_date) != 6; -- 6 = Saturday

  GET DIAGNOSTICS weekly_deleted = ROW_COUNT;

  -- Delete non-first-of-month records older than 1 year (keep monthly)
  DELETE FROM public.price_history
  WHERE recorded_date < CURRENT_DATE - INTERVAL '1 year'
    AND EXTRACT(DAY FROM recorded_date) != 1;

  GET DIAGNOSTICS monthly_deleted = ROW_COUNT;

  deleted_count := weekly_deleted + monthly_deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get the latest price snapshot for each item for a specific user
CREATE OR REPLACE FUNCTION get_latest_prices_for_user(p_user_id UUID)
RETURNS TABLE (
  inventory_item_id UUID,
  item_name TEXT,
  market_price DECIMAL(12,2),
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ph.inventory_item_id)
    ph.inventory_item_id,
    ph.item_name,
    ph.market_price,
    ph.recorded_at
  FROM public.price_history ph
  INNER JOIN public.inventory_items ii ON ph.inventory_item_id = ii.id
  WHERE ii.user_id = p_user_id
  ORDER BY ph.inventory_item_id, ph.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get yesterday's portfolio value for "today's change" calculation
CREATE OR REPLACE FUNCTION get_yesterday_portfolio_value(p_user_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  yesterday_value DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(ph.market_price * ii.quantity), 0)
  INTO yesterday_value
  FROM (
    SELECT DISTINCT ON (inventory_item_id)
      inventory_item_id,
      market_price
    FROM public.price_history
    WHERE recorded_date = CURRENT_DATE - INTERVAL '1 day'
    ORDER BY inventory_item_id, recorded_at DESC
  ) ph
  INNER JOIN public.inventory_items ii ON ph.inventory_item_id = ii.id
  WHERE ii.user_id = p_user_id
    AND ii.quantity > 0
    AND ii.sale_date IS NULL;

  RETURN COALESCE(yesterday_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get price history for a specific item with time range
CREATE OR REPLACE FUNCTION get_item_price_history(
  p_item_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  recorded_date DATE,
  market_price DECIMAL(12,2),
  lowest_listed DECIMAL(12,2),
  price_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ph.recorded_date)
    ph.recorded_date,
    ph.market_price,
    ph.lowest_listed,
    ph.price_source
  FROM public.price_history ph
  WHERE ph.inventory_item_id = p_item_id
    AND ph.recorded_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  ORDER BY ph.recorded_date DESC, ph.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON public.price_history TO authenticated;
GRANT INSERT ON public.price_history TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_price_history() TO service_role;
GRANT EXECUTE ON FUNCTION get_latest_prices_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_portfolio_value(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_item_price_history(UUID, INTEGER) TO authenticated;
