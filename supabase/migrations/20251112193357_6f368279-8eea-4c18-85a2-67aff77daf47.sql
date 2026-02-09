-- Drop existing function
DROP FUNCTION IF EXISTS public.search_products_prioritized(text, text, integer);

-- Create improved search function with better card number matching
CREATE OR REPLACE FUNCTION public.search_products_prioritized(
  search_query text,
  exact_card_num text,
  result_limit integer DEFAULT 1000
)
RETURNS TABLE(
  id uuid,
  name text,
  set_name text,
  card_number text,
  image_url text,
  market_price numeric,
  rarity text,
  subtypes text[],
  artist text,
  pokemon_tcg_id text
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If query is ONLY a card number (e.g., "#180" or "180"), search by card number only
  IF exact_card_num IS NOT NULL AND (search_query = exact_card_num OR search_query = '#' || exact_card_num) THEN
    RETURN QUERY
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
      p.pokemon_tcg_id
    FROM public.products p
    WHERE p.card_number = exact_card_num
    ORDER BY p.name ASC
    LIMIT result_limit;
  ELSE
    -- Otherwise, search with name/set matching and prioritize exact card number matches
    RETURN QUERY
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
      p.pokemon_tcg_id
    FROM public.products p
    WHERE 
      p.name ILIKE '%' || search_query || '%' 
      OR p.set_name ILIKE '%' || search_query || '%'
      OR (exact_card_num IS NOT NULL AND p.card_number = exact_card_num)
    ORDER BY
      -- Exact card number match gets highest priority
      CASE WHEN exact_card_num IS NOT NULL AND p.card_number = exact_card_num THEN 1 ELSE 2 END,
      -- Exact name match second priority
      CASE WHEN LOWER(p.name) = LOWER(search_query) THEN 1 ELSE 2 END,
      -- Then name starts with query
      CASE WHEN LOWER(p.name) LIKE LOWER(search_query || '%') THEN 1 ELSE 2 END,
      -- Then alphabetically by name
      p.name ASC
    LIMIT result_limit;
  END IF;
END;
$$;