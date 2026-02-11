-- CardLedger Price Aggregation Schema Updates
-- Created: 2026-02-11
-- Feature: Track price sources and history on products table

-- ============================================
-- ADD COLUMNS TO PRODUCTS TABLE
-- ============================================

DO $$
BEGIN
    -- Add price_source column (tracks which API provided the current price)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_source') THEN
        ALTER TABLE public.products ADD COLUMN price_source TEXT;
        COMMENT ON COLUMN public.products.price_source IS 'API source of current price: pokemon_tcg, scrydex, scryfall, tavily, manual';
    END IF;

    -- Add lowest_listed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'lowest_listed') THEN
        ALTER TABLE public.products ADD COLUMN lowest_listed DECIMAL(12,2);
        COMMENT ON COLUMN public.products.lowest_listed IS 'Lowest current listing price';
    END IF;

    -- Add price_history JSONB column (stores recent price snapshots)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_history') THEN
        ALTER TABLE public.products ADD COLUMN price_history JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN public.products.price_history IS 'Recent price snapshots: [{price, source, timestamp}]';
    END IF;

    -- Add price_confidence column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_confidence') THEN
        ALTER TABLE public.products ADD COLUMN price_confidence INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.products.price_confidence IS 'Confidence score 0-100 based on source agreement';
    END IF;

    -- Add card_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'card_number') THEN
        ALTER TABLE public.products ADD COLUMN card_number TEXT;
    END IF;

    -- Add rarity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rarity') THEN
        ALTER TABLE public.products ADD COLUMN rarity TEXT;
    END IF;
END $$;

-- ============================================
-- INDEXES FOR STALE PRICE QUERIES
-- ============================================

-- Index for finding stale prices (prices not updated recently)
CREATE INDEX IF NOT EXISTS idx_products_last_price_update 
ON public.products(last_price_update)
WHERE last_price_update IS NOT NULL;

-- Index for finding products needing price updates (NULL or old)
CREATE INDEX IF NOT EXISTS idx_products_stale_prices 
ON public.products(last_price_update NULLS FIRST)
WHERE market_price IS NULL OR last_price_update < NOW() - INTERVAL '24 hours';

-- Index on price_source for analytics
CREATE INDEX IF NOT EXISTS idx_products_price_source 
ON public.products(price_source)
WHERE price_source IS NOT NULL;

-- GIN index on price_history for JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_price_history 
ON public.products USING GIN (price_history);

-- ============================================
-- FUNCTION: Add price to history
-- ============================================

CREATE OR REPLACE FUNCTION add_price_to_history(
    p_product_id UUID,
    p_price DECIMAL(12,2),
    p_source TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_new_entry JSONB;
    v_history JSONB;
    v_max_entries INT := 30; -- Keep last 30 price snapshots
BEGIN
    -- Create new entry
    v_new_entry := jsonb_build_object(
        'price', p_price,
        'source', p_source,
        'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
    );
    
    -- Get current history
    SELECT COALESCE(price_history, '[]'::jsonb) INTO v_history
    FROM public.products WHERE id = p_product_id;
    
    -- Prepend new entry and trim to max
    v_history := v_new_entry || v_history;
    IF jsonb_array_length(v_history) > v_max_entries THEN
        v_history := (
            SELECT jsonb_agg(elem)
            FROM (
                SELECT elem
                FROM jsonb_array_elements(v_history) WITH ORDINALITY arr(elem, idx)
                WHERE idx <= v_max_entries
            ) sub
        );
    END IF;
    
    RETURN v_history;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update product price with history
-- ============================================

CREATE OR REPLACE FUNCTION update_product_price(
    p_product_id UUID,
    p_market_price DECIMAL(12,2),
    p_lowest_listed DECIMAL(12,2) DEFAULT NULL,
    p_source TEXT DEFAULT 'unknown',
    p_confidence INTEGER DEFAULT 50
)
RETURNS BOOLEAN AS $$
DECLARE
    v_new_history JSONB;
BEGIN
    -- Calculate new history
    v_new_history := add_price_to_history(p_product_id, p_market_price, p_source);
    
    -- Update product
    UPDATE public.products
    SET 
        market_price = p_market_price,
        lowest_listed = COALESCE(p_lowest_listed, lowest_listed),
        price_source = p_source,
        price_confidence = p_confidence,
        price_history = v_new_history,
        last_price_update = NOW(),
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get stale products needing price update
-- ============================================

CREATE OR REPLACE FUNCTION get_stale_products(
    p_hours_old INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    set_name TEXT,
    card_number TEXT,
    category product_category,
    market_price DECIMAL,
    last_price_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.set_name,
        p.card_number,
        p.category,
        p.market_price,
        p.last_price_update
    FROM public.products p
    WHERE p.last_price_update IS NULL 
       OR p.last_price_update < NOW() - (p_hours_old || ' hours')::INTERVAL
    ORDER BY 
        p.last_price_update NULLS FIRST,
        p.market_price DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Upsert product with price
-- ============================================

CREATE OR REPLACE FUNCTION upsert_product_with_price(
    p_name TEXT,
    p_set_name TEXT DEFAULT NULL,
    p_card_number TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_market_price DECIMAL(12,2) DEFAULT NULL,
    p_lowest_listed DECIMAL(12,2) DEFAULT NULL,
    p_price_source TEXT DEFAULT NULL,
    p_category product_category DEFAULT 'raw',
    p_pokemon_tcg_id TEXT DEFAULT NULL,
    p_rarity TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_product_id UUID;
    v_existing_id UUID;
BEGIN
    -- Try to find existing product
    SELECT id INTO v_existing_id
    FROM public.products
    WHERE (pokemon_tcg_id IS NOT NULL AND pokemon_tcg_id = p_pokemon_tcg_id)
       OR (name = p_name AND COALESCE(set_name, '') = COALESCE(p_set_name, '') 
           AND COALESCE(card_number, '') = COALESCE(p_card_number, ''))
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing product
        UPDATE public.products
        SET 
            image_url = COALESCE(p_image_url, image_url),
            market_price = COALESCE(p_market_price, market_price),
            lowest_listed = COALESCE(p_lowest_listed, lowest_listed),
            price_source = COALESCE(p_price_source, price_source),
            rarity = COALESCE(p_rarity, rarity),
            last_price_update = CASE WHEN p_market_price IS NOT NULL THEN NOW() ELSE last_price_update END,
            price_history = CASE 
                WHEN p_market_price IS NOT NULL 
                THEN add_price_to_history(id, p_market_price, p_price_source)
                ELSE price_history 
            END,
            updated_at = NOW()
        WHERE id = v_existing_id;
        
        RETURN v_existing_id;
    ELSE
        -- Insert new product
        INSERT INTO public.products (
            name, set_name, card_number, image_url, 
            market_price, lowest_listed, price_source, 
            category, pokemon_tcg_id, rarity,
            last_price_update, price_history
        ) VALUES (
            p_name, p_set_name, p_card_number, p_image_url,
            p_market_price, p_lowest_listed, p_price_source,
            p_category, p_pokemon_tcg_id, p_rarity,
            CASE WHEN p_market_price IS NOT NULL THEN NOW() ELSE NULL END,
            CASE WHEN p_market_price IS NOT NULL 
                THEN jsonb_build_array(jsonb_build_object(
                    'price', p_market_price,
                    'source', p_price_source,
                    'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
                ))
                ELSE '[]'::jsonb
            END
        )
        RETURNING id INTO v_product_id;
        
        RETURN v_product_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION add_price_to_history(UUID, DECIMAL, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_product_price(UUID, DECIMAL, DECIMAL, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_stale_products(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_product_with_price(TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, TEXT, product_category, TEXT, TEXT) TO service_role;
