-- Create function to search products with smart prioritization
-- Exact card number matches come first, then name/set matches
CREATE OR REPLACE FUNCTION public.search_products_prioritized(
  search_query TEXT,
  exact_card_num TEXT,
  result_limit INT DEFAULT 8
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
  artist TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
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
    p.artist
  FROM public.products p
  WHERE 
    p.name ILIKE '%' || search_query || '%' 
    OR p.set_name ILIKE '%' || search_query || '%'
    OR p.card_number ILIKE '%' || search_query || '%'
  ORDER BY
    -- Exact card number match gets highest priority
    CASE WHEN exact_card_num IS NOT NULL AND p.card_number = exact_card_num THEN 1 ELSE 2 END,
    -- Then sort by name
    p.name ASC
  LIMIT result_limit;
END;
$$;