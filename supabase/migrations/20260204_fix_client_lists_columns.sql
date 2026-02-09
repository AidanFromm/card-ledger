-- CardLedger Client Lists Column Fix
-- Created: 2026-02-04
-- Fixes column name mismatch between initial schema and frontend

-- ============================================
-- RENAME COLUMNS IF THEY EXIST WITH OLD NAMES
-- ============================================

-- Rename 'name' to 'list_name' if the old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_lists'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.client_lists RENAME COLUMN name TO list_name;
    RAISE NOTICE 'Renamed column: name -> list_name';
  ELSE
    RAISE NOTICE 'Column list_name already exists or name does not exist';
  END IF;
END $$;

-- Rename 'description' to 'notes' if the old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_lists'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.client_lists RENAME COLUMN description TO notes;
    RAISE NOTICE 'Renamed column: description -> notes';
  ELSE
    RAISE NOTICE 'Column notes already exists or description does not exist';
  END IF;
END $$;

-- ============================================
-- DROP COLUMNS THAT DON'T EXIST IN FRONTEND
-- ============================================

-- Drop 'is_public' if it exists (frontend doesn't use it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_lists'
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.client_lists DROP COLUMN is_public;
    RAISE NOTICE 'Dropped column: is_public';
  END IF;
END $$;

-- Drop 'item_ids' if it exists (frontend uses client_list_items table instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_lists'
    AND column_name = 'item_ids'
  ) THEN
    ALTER TABLE public.client_lists DROP COLUMN item_ids;
    RAISE NOTICE 'Dropped column: item_ids';
  END IF;
END $$;

-- ============================================
-- ENSURE client_list_items TABLE EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.client_lists(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_image_url TEXT,
  grading_company TEXT NOT NULL DEFAULT 'raw',
  grade TEXT,
  market_price NUMERIC,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ENSURE RLS AND POLICIES FOR client_list_items
-- ============================================

ALTER TABLE public.client_list_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own list items" ON public.client_list_items;
DROP POLICY IF EXISTS "Users can create their own list items" ON public.client_list_items;
DROP POLICY IF EXISTS "Users can update their own list items" ON public.client_list_items;
DROP POLICY IF EXISTS "Users can delete their own list items" ON public.client_list_items;
DROP POLICY IF EXISTS "Public can view list items via share token" ON public.client_list_items;

-- Recreate policies
CREATE POLICY "Users can view their own list items"
  ON public.client_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own list items"
  ON public.client_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own list items"
  ON public.client_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own list items"
  ON public.client_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view list items via share token"
  ON public.client_list_items FOR SELECT
  USING (true);

-- ============================================
-- CREATE INDEXES IF NOT EXISTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_list_items_list_id ON public.client_list_items(list_id);
