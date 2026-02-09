-- Make market_price nullable in client_list_items to allow items without market prices
ALTER TABLE public.client_list_items 
ALTER COLUMN market_price DROP NOT NULL;