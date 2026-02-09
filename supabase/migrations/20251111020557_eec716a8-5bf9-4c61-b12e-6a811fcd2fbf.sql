-- Add market_price column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN market_price NUMERIC;