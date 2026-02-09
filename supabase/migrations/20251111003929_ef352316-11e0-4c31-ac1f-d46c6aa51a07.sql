-- Create enum for product categories (skip if exists)
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('raw', 'graded', 'sealed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create products table for Pokemon TCG database
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  set_name TEXT,
  category product_category NOT NULL DEFAULT 'raw',
  image_url TEXT,
  pokemon_tcg_id TEXT UNIQUE,
  tcgplayer_id TEXT,
  barcode TEXT,
  market_price NUMERIC,
  last_price_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster searches (skip if exists)
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_set ON public.products(set_name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_pokemon_tcg_id ON public.products(pokemon_tcg_id);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Allow everyone to read products (it's a reference database)
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();