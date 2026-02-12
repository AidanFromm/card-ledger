-- CardLedger V3: Purchase Tracking & Grading Submissions
-- Migration: 2026-02-11

-- ============================================
-- PURCHASE TRACKING: Add fields to inventory_items
-- ============================================

-- Add purchase_date (when was it bought)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ DEFAULT NOW();

-- Add purchase_location (where was it bought from)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS purchase_location TEXT;

-- Backfill purchase_date from created_at for existing items
UPDATE public.inventory_items 
SET purchase_date = created_at 
WHERE purchase_date IS NULL;

-- ============================================
-- GRADING SUBMISSIONS TABLE
-- ============================================

-- Enum for grading submission status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grading_status') THEN
        CREATE TYPE grading_status AS ENUM (
            'submitted',
            'received', 
            'grading',
            'shipped',
            'complete'
        );
    END IF;
END
$$;

-- Create grading_submissions table
CREATE TABLE IF NOT EXISTS public.grading_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Link to inventory item (card being graded)
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    
    -- Card info (denormalized for history)
    card_name TEXT NOT NULL,
    set_name TEXT,
    card_number TEXT,
    card_image_url TEXT,
    
    -- Grading details
    grading_company TEXT NOT NULL CHECK (grading_company IN ('psa', 'bgs', 'cgc', 'sgc', 'ace', 'tag')),
    submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_return_date TIMESTAMPTZ,
    tracking_number TEXT,
    
    -- Status tracking
    status grading_status NOT NULL DEFAULT 'submitted',
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Results (filled when complete)
    final_grade TEXT,
    cert_number TEXT,
    
    -- Costs
    submission_cost DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    insurance_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Service level (economy, regular, express, etc.)
    service_level TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for grading_submissions
CREATE INDEX IF NOT EXISTS idx_grading_submissions_user_id ON public.grading_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_user_status ON public.grading_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_inventory_item ON public.grading_submissions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_company ON public.grading_submissions(grading_company);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.grading_submissions ENABLE ROW LEVEL SECURITY;

-- Grading submissions policies
CREATE POLICY "Users can view own grading submissions" ON public.grading_submissions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grading submissions" ON public.grading_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grading submissions" ON public.grading_submissions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grading submissions" ON public.grading_submissions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update updated_at
-- ============================================

CREATE OR REPLACE TRIGGER update_grading_submissions_updated_at
    BEFORE UPDATE ON public.grading_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Update status_updated_at when status changes
-- ============================================

CREATE OR REPLACE FUNCTION update_grading_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_grading_status_timestamp
    BEFORE UPDATE ON public.grading_submissions
    FOR EACH ROW EXECUTE FUNCTION update_grading_status_timestamp();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grading_submissions TO authenticated;
GRANT SELECT ON public.grading_submissions TO anon;
