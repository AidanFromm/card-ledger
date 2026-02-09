-- Create enum for card condition
CREATE TYPE card_condition AS ENUM (
  'mint',
  'near-mint',
  'lightly-played',
  'moderately-played',
  'heavily-played',
  'damaged'
);

-- Create enum for grading companies
CREATE TYPE grading_company AS ENUM (
  'raw',
  'psa',
  'bgs',
  'cgc',
  'ace'
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  category TEXT,
  condition card_condition NOT NULL DEFAULT 'near-mint',
  grading_company grading_company NOT NULL DEFAULT 'raw',
  grade TEXT,
  purchase_price NUMERIC(10, 2) NOT NULL,
  sale_price NUMERIC(10, 2),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  platform_sold TEXT,
  card_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Users can view their own inventory items"
  ON public.inventory_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON public.inventory_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON public.inventory_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON public.inventory_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);

-- Storage policies for card images
CREATE POLICY "Anyone can view card images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'card-images');

CREATE POLICY "Authenticated users can upload card images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own card images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'card-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own card images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'card-images' 
    AND auth.role() = 'authenticated'
  );