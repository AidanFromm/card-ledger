-- Create enum for product categories
CREATE TYPE product_category AS ENUM ('raw', 'graded', 'sealed');

-- Create products table for Pokemon TCG database
CREATE TABLE public.products (
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

-- Create index for faster searches
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_set ON public.products(set_name);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_pokemon_tcg_id ON public.products(pokemon_tcg_id);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products (it's a reference database)
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();