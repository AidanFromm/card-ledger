-- Add card_number column to inventory_items table for raw and graded cards
ALTER TABLE public.inventory_items ADD COLUMN card_number TEXT;