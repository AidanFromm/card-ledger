-- FIX MISSING COLUMNS FOR CARDLEDGER
-- Run this in Supabase SQL Editor to fix the app breaking issues

-- Add missing columns to sales table (safe - won't error if already exists)
DO $$
BEGIN
    -- Add client_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'client_name') THEN
        ALTER TABLE public.sales ADD COLUMN client_name TEXT;
    END IF;

    -- Add event_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'event_name') THEN
        ALTER TABLE public.sales ADD COLUMN event_name TEXT;
    END IF;

    -- Add condition if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'condition') THEN
        ALTER TABLE public.sales ADD COLUMN condition TEXT;
    END IF;

    -- Add card_image_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'card_image_url') THEN
        ALTER TABLE public.sales ADD COLUMN card_image_url TEXT;
    END IF;

    -- Add set_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'set_name') THEN
        ALTER TABLE public.sales ADD COLUMN set_name TEXT;
    END IF;

    -- Add card_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'card_number') THEN
        ALTER TABLE public.sales ADD COLUMN card_number TEXT;
    END IF;

    -- Add grading_company if missing (as text, not enum for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'grading_company') THEN
        ALTER TABLE public.sales ADD COLUMN grading_company TEXT;
    END IF;

    -- Add grade if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'grade') THEN
        ALTER TABLE public.sales ADD COLUMN grade TEXT;
    END IF;

    -- Add sale_group_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'sale_group_id') THEN
        ALTER TABLE public.sales ADD COLUMN sale_group_id UUID;
    END IF;
END $$;

-- Add indexes for new columns (safe - uses IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON public.sales(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_event_name ON public.sales(event_name);
CREATE INDEX IF NOT EXISTS idx_sales_sale_group_id ON public.sales(sale_group_id);

-- Fix inventory_items table - add any missing columns
DO $$
BEGIN
    -- Add cert_number if missing (for graded cards)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'cert_number') THEN
        ALTER TABLE public.inventory_items ADD COLUMN cert_number TEXT;
    END IF;

    -- Add lowest_listed if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'lowest_listed') THEN
        ALTER TABLE public.inventory_items ADD COLUMN lowest_listed DECIMAL(12,2);
    END IF;
END $$;

-- Add SGC and TAG to grading_company enum if it exists
DO $$
BEGIN
    -- Check if enum exists first
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grading_company') THEN
        -- Add SGC if not exists
        BEGIN
            ALTER TYPE grading_company ADD VALUE IF NOT EXISTS 'sgc';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        -- Add TAG if not exists
        BEGIN
            ALTER TYPE grading_company ADD VALUE IF NOT EXISTS 'tag';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- Verify the fix
SELECT 'Sales table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales' ORDER BY ordinal_position;
