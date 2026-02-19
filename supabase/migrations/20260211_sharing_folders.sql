-- ==========================================
-- COLLECTION FOLDERS SYSTEM
-- ==========================================

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  icon TEXT DEFAULT 'folder', -- Lucide icon name
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create folder_items junction table (cards can be in multiple folders)
CREATE TABLE IF NOT EXISTS public.folder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(folder_id, inventory_item_id)
);

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on folder_items
ALTER TABLE public.folder_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for folder_items (through folder ownership)
CREATE POLICY "Users can view items in their folders"
  ON public.folder_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_items.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their folders"
  ON public.folder_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_items.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their folders"
  ON public.folder_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_items.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

-- ==========================================
-- COLLECTION SHARING SYSTEM
-- ==========================================

-- Create shared_collections table
CREATE TABLE IF NOT EXISTS public.shared_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Collection',
  description TEXT,
  
  -- Share type: 'collection' (all items), 'folder', or 'selection' (specific items)
  share_type TEXT NOT NULL DEFAULT 'collection' CHECK (share_type IN ('collection', 'folder', 'selection')),
  
  -- If sharing a folder, reference it
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  
  -- Display options
  show_values BOOLEAN DEFAULT true,
  show_purchase_prices BOOLEAN DEFAULT false,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- NULL means never expires
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for items in a 'selection' type share
CREATE TABLE IF NOT EXISTS public.shared_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_collection_id UUID NOT NULL REFERENCES public.shared_collections(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shared_collection_id, inventory_item_id)
);

-- Enable RLS on shared_collections
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_collections (owner can manage, anyone can view by token)
CREATE POLICY "Users can view their own shared collections"
  ON public.shared_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active shared collections by token"
  ON public.shared_collections FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert their own shared collections"
  ON public.shared_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared collections"
  ON public.shared_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared collections"
  ON public.shared_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on shared_collection_items
ALTER TABLE public.shared_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_collection_items
CREATE POLICY "Users can view items in their shared collections"
  ON public.shared_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collections 
      WHERE shared_collections.id = shared_collection_items.shared_collection_id 
      AND shared_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view items in active shared collections"
  ON public.shared_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collections 
      WHERE shared_collections.id = shared_collection_items.shared_collection_id 
      AND shared_collections.is_active = true
    )
  );

CREATE POLICY "Users can add items to their shared collections"
  ON public.shared_collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_collections 
      WHERE shared_collections.id = shared_collection_items.shared_collection_id 
      AND shared_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their shared collections"
  ON public.shared_collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collections 
      WHERE shared_collections.id = shared_collection_items.shared_collection_id 
      AND shared_collections.user_id = auth.uid()
    )
  );

-- Allow public read of inventory items that are shared
CREATE POLICY "Anyone can view shared inventory items"
  ON public.inventory_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collection_items sci
      JOIN public.shared_collections sc ON sc.id = sci.shared_collection_id
      WHERE sci.inventory_item_id = inventory_items.id
      AND sc.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shared_collections sc
      JOIN public.folder_items fi ON fi.inventory_item_id = inventory_items.id
      JOIN public.folders f ON f.id = fi.folder_id AND f.id = sc.folder_id
      WHERE sc.is_active = true AND sc.share_type = 'folder'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shared_collections sc
      WHERE sc.user_id = inventory_items.user_id 
      AND sc.share_type = 'collection'
      AND sc.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_items_folder_id ON public.folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_items_inventory_item_id ON public.folder_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_shared_collections_user_id ON public.shared_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_collections_share_token ON public.shared_collections(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_collections_folder_id ON public.shared_collections(folder_id);
CREATE INDEX IF NOT EXISTS idx_shared_collection_items_shared_collection_id ON public.shared_collection_items(shared_collection_id);
CREATE INDEX IF NOT EXISTS idx_shared_collection_items_inventory_item_id ON public.shared_collection_items(inventory_item_id);

-- Updated_at trigger for folders
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for shared_collections  
CREATE TRIGGER update_shared_collections_updated_at
  BEFORE UPDATE ON public.shared_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_collections
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE share_token = token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default folders for a user
CREATE OR REPLACE FUNCTION create_default_folders_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.folders (user_id, name, color, icon, is_default, position)
  VALUES
    (p_user_id, 'Collection', '#6366f1', 'box', true, 0),
    (p_user_id, 'For Sale', '#22c55e', 'tag', true, 1),
    (p_user_id, 'Personal Collection', '#f59e0b', 'heart', true, 2),
    (p_user_id, 'Grading', '#8b5cf6', 'award', true, 3)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
