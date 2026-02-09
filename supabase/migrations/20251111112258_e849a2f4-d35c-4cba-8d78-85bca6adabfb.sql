-- Add card_number column to products table to store card numbers like "199", "SV01", etc.
ALTER TABLE public.products ADD COLUMN card_number TEXT;