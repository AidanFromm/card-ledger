-- Migration: Backfill profit field for existing sales
-- The profit field was not being set when recording sales, causing analytics to show $0

-- Update all sales where profit is NULL or 0 to calculate it from sale_price - purchase_price
UPDATE sales
SET profit = sale_price - purchase_price
WHERE profit IS NULL;

-- Also update any that might have been set to 0 incorrectly
UPDATE sales
SET profit = sale_price - purchase_price
WHERE profit = 0 AND sale_price != purchase_price;

-- Add a comment explaining the profit field
COMMENT ON COLUMN sales.profit IS 'Profit per unit (sale_price - purchase_price). Total profit = profit * quantity_sold';
