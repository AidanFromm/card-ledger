-- Add card_image_url column to inventory_items if it doesn't exist
-- The TypeScript types expect card_image_url but the original schema had image_url

DO $$
BEGIN
    -- Add card_image_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'inventory_items' AND column_name = 'card_image_url') THEN
        ALTER TABLE public.inventory_items ADD COLUMN card_image_url TEXT;

        -- Copy data from image_url if it exists and card_image_url is new
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'inventory_items' AND column_name = 'image_url') THEN
            UPDATE public.inventory_items SET card_image_url = image_url WHERE image_url IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'inventory_items'
AND column_name IN ('image_url', 'card_image_url');
