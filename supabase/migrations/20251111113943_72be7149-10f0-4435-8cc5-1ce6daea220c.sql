-- Add additional Pokemon card metadata fields
ALTER TABLE public.products ADD COLUMN rarity TEXT;
ALTER TABLE public.products ADD COLUMN subtypes TEXT[];
ALTER TABLE public.products ADD COLUMN artist TEXT;