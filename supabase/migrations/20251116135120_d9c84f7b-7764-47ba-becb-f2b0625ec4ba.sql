-- Add lowest_listed column to inventory_items table to track the lowest listed price from marketplaces
ALTER TABLE inventory_items 
ADD COLUMN lowest_listed NUMERIC;