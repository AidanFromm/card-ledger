-- CardLedger Market Trends Infrastructure
-- Created: 2026-02-12
-- Feature: Track card activity, trending cards, and market movements

-- ============================================
-- CARD_ACTIVITY TABLE
-- Tracks searches, views, and additions for trending cards
-- ============================================

CREATE TABLE IF NOT EXISTS public.card_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Card identification (can be from products table or free-form)
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  set_name TEXT,
  card_image_url TEXT,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN ('search', 'view', 'add', 'watchlist', 'sale')),
  
  -- Price at time of activity (for tracking)
  price_at_activity DECIMAL(12,2),
  
  -- User who performed activity (optional for anonymous searches)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- For trending queries (recent activity by type)
CREATE INDEX idx_card_activity_recent ON public.card_activity(created_at DESC);
CREATE INDEX idx_card_activity_type ON public.card_activity(activity_type, created_at DESC);
CREATE INDEX idx_card_activity_product ON public.card_activity(product_id, created_at DESC) WHERE product_id IS NOT NULL;
CREATE INDEX idx_card_activity_card_name ON public.card_activity(card_name, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.card_activity ENABLE ROW LEVEL SECURITY;

-- Anyone can insert activity (for tracking searches)
CREATE POLICY "Insert card activity" ON public.card_activity
  FOR INSERT WITH CHECK (true);

-- Users can view aggregate activity (for trends)
CREATE POLICY "View card activity" ON public.card_activity
  FOR SELECT USING (true);

-- ============================================
-- FUNCTION: Get Trending Cards
-- Returns most active cards in a time period
-- ============================================

CREATE OR REPLACE FUNCTION get_trending_cards(
  p_days INTEGER DEFAULT 7,
  p_activity_types TEXT[] DEFAULT ARRAY['search', 'view', 'add'],
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  card_name TEXT,
  set_name TEXT,
  card_image_url TEXT,
  product_id UUID,
  activity_count BIGINT,
  latest_price DECIMAL,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.card_name,
    MAX(ca.set_name) as set_name,
    MAX(ca.card_image_url) as card_image_url,
    MAX(ca.product_id) as product_id,
    COUNT(*) as activity_count,
    (
      SELECT ca2.price_at_activity 
      FROM public.card_activity ca2 
      WHERE ca2.card_name = ca.card_name 
        AND ca2.price_at_activity IS NOT NULL
      ORDER BY ca2.created_at DESC 
      LIMIT 1
    ) as latest_price,
    COUNT(DISTINCT ca.user_id) as unique_users
  FROM public.card_activity ca
  WHERE ca.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND ca.activity_type = ANY(p_activity_types)
  GROUP BY ca.card_name
  ORDER BY activity_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Price Movers (Gainers/Losers)
-- Returns cards with biggest price changes
-- ============================================

CREATE OR REPLACE FUNCTION get_price_movers(
  p_days INTEGER DEFAULT 7,
  p_direction TEXT DEFAULT 'up', -- 'up' for gainers, 'down' for losers
  p_limit INTEGER DEFAULT 10,
  p_min_price DECIMAL DEFAULT 1.00 -- Ignore penny cards
)
RETURNS TABLE (
  inventory_item_id UUID,
  item_name TEXT,
  set_name TEXT,
  card_image_url TEXT,
  grading_company TEXT,
  grade TEXT,
  current_price DECIMAL,
  previous_price DECIMAL,
  price_change DECIMAL,
  change_percent DECIMAL,
  quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_prices AS (
    SELECT DISTINCT ON (ph.inventory_item_id)
      ph.inventory_item_id,
      ph.item_name,
      ph.set_name,
      ph.grading_company::TEXT,
      ph.grade,
      ph.market_price as current_price,
      ph.recorded_date as current_date
    FROM public.price_history ph
    WHERE ph.recorded_date >= CURRENT_DATE - 1
    ORDER BY ph.inventory_item_id, ph.recorded_at DESC
  ),
  past_prices AS (
    SELECT DISTINCT ON (ph.inventory_item_id)
      ph.inventory_item_id,
      ph.market_price as previous_price
    FROM public.price_history ph
    WHERE ph.recorded_date <= CURRENT_DATE - p_days
      AND ph.recorded_date >= CURRENT_DATE - p_days - 3
    ORDER BY ph.inventory_item_id, ph.recorded_at DESC
  )
  SELECT 
    rp.inventory_item_id,
    rp.item_name,
    rp.set_name,
    ii.card_image_url,
    rp.grading_company,
    rp.grade,
    rp.current_price,
    pp.previous_price,
    (rp.current_price - pp.previous_price) as price_change,
    CASE 
      WHEN pp.previous_price > 0 
      THEN ((rp.current_price - pp.previous_price) / pp.previous_price * 100)
      ELSE 0 
    END as change_percent,
    ii.quantity
  FROM recent_prices rp
  JOIN past_prices pp ON rp.inventory_item_id = pp.inventory_item_id
  LEFT JOIN public.inventory_items ii ON rp.inventory_item_id = ii.id
  WHERE rp.current_price >= p_min_price
    AND pp.previous_price >= p_min_price
    AND CASE 
      WHEN p_direction = 'up' THEN rp.current_price > pp.previous_price
      WHEN p_direction = 'down' THEN rp.current_price < pp.previous_price
      ELSE true
    END
  ORDER BY 
    CASE WHEN p_direction = 'up' THEN change_percent END DESC NULLS LAST,
    CASE WHEN p_direction = 'down' THEN change_percent END ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Record Card Activity
-- Helper to log card interactions
-- ============================================

CREATE OR REPLACE FUNCTION record_card_activity(
  p_card_name TEXT,
  p_set_name TEXT DEFAULT NULL,
  p_activity_type TEXT DEFAULT 'search',
  p_product_id UUID DEFAULT NULL,
  p_card_image_url TEXT DEFAULT NULL,
  p_price DECIMAL DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.card_activity (
    card_name,
    set_name,
    activity_type,
    product_id,
    card_image_url,
    price_at_activity,
    user_id
  ) VALUES (
    p_card_name,
    p_set_name,
    p_activity_type,
    p_product_id,
    p_card_image_url,
    p_price,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Recently Sold Cards
-- For "Recently Sold" section in market trends
-- ============================================

CREATE OR REPLACE FUNCTION get_recently_sold(
  p_limit INTEGER DEFAULT 20,
  p_user_id UUID DEFAULT NULL -- NULL = all users (for market trends)
)
RETURNS TABLE (
  sale_id UUID,
  item_name TEXT,
  set_name TEXT,
  card_image_url TEXT,
  sale_price DECIMAL,
  purchase_price DECIMAL,
  profit DECIMAL,
  profit_percent DECIMAL,
  sale_date DATE,
  grading_company TEXT,
  grade TEXT,
  quantity_sold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as sale_id,
    s.item_name,
    s.set_name,
    s.card_image_url,
    s.sale_price,
    s.purchase_price,
    (s.sale_price - s.purchase_price) as profit,
    CASE 
      WHEN s.purchase_price > 0 
      THEN ((s.sale_price - s.purchase_price) / s.purchase_price * 100)
      ELSE 0 
    END as profit_percent,
    s.sale_date,
    s.grading_company::TEXT,
    s.grade,
    s.quantity_sold
  FROM public.sales s
  WHERE (p_user_id IS NULL OR s.user_id = p_user_id)
  ORDER BY s.sale_date DESC, s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Cleanup Old Activity
-- Retain 30 days of activity data
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_card_activity()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.card_activity
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT ON public.card_activity TO authenticated;
GRANT SELECT ON public.card_activity TO anon;
GRANT EXECUTE ON FUNCTION get_trending_cards(INTEGER, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_price_movers(INTEGER, TEXT, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION record_card_activity(TEXT, TEXT, TEXT, UUID, TEXT, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recently_sold(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_card_activity() TO service_role;
