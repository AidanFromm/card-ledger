-- CardLedger Production Database Schema
-- Created: 2026-02-02
-- This schema is optimized for scale with proper indexes, RLS, and constraints

-- ============================================
-- ENUMS
-- ============================================

-- Grading companies enum
CREATE TYPE grading_company AS ENUM ('raw', 'psa', 'bgs', 'cgc', 'sgc', 'ace', 'tag');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'personal', 'business')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================
-- INVENTORY_ITEMS TABLE (main table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Card identification
  name TEXT NOT NULL,
  set_name TEXT,
  card_number TEXT,
  category TEXT DEFAULT 'raw' CHECK (category IN ('raw', 'graded', 'sealed')),

  -- Grading info
  grading_company grading_company DEFAULT 'raw',
  grade TEXT,
  cert_number TEXT,

  -- Quantity & pricing
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  market_price DECIMAL(12,2) CHECK (market_price >= 0),
  lowest_listed DECIMAL(12,2) CHECK (lowest_listed >= 0),

  -- Media & notes
  image_url TEXT,
  notes TEXT,

  -- Sale tracking (when sold)
  sale_price DECIMAL(12,2) CHECK (sale_price >= 0),
  sale_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for inventory_items (optimized for common queries)
CREATE INDEX idx_inventory_user_id ON public.inventory_items(user_id);
CREATE INDEX idx_inventory_user_created ON public.inventory_items(user_id, created_at DESC);
CREATE INDEX idx_inventory_user_category ON public.inventory_items(user_id, category);
CREATE INDEX idx_inventory_user_grading ON public.inventory_items(user_id, grading_company);
CREATE INDEX idx_inventory_name ON public.inventory_items(name);
CREATE INDEX idx_inventory_set_name ON public.inventory_items(set_name);

-- ============================================
-- PURCHASE_ENTRIES TABLE (FIFO tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS public.purchase_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to inventory item
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,

  -- Item details (denormalized for historical accuracy)
  item_name TEXT NOT NULL,
  set_name TEXT,

  -- Purchase details
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  remaining_quantity INTEGER NOT NULL DEFAULT 1 CHECK (remaining_quantity >= 0),
  purchase_price DECIMAL(12,2) NOT NULL CHECK (purchase_price >= 0),
  purchase_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Source tracking
  source TEXT, -- e.g., 'eBay', 'TCGPlayer', 'Local', etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for purchase_entries (optimized for FIFO queries)
CREATE INDEX idx_purchase_user_id ON public.purchase_entries(user_id);
CREATE INDEX idx_purchase_user_date ON public.purchase_entries(user_id, purchase_date ASC);
CREATE INDEX idx_purchase_inventory_item ON public.purchase_entries(inventory_item_id);
CREATE INDEX idx_purchase_remaining ON public.purchase_entries(user_id, remaining_quantity) WHERE remaining_quantity > 0;

-- ============================================
-- SALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to original inventory item
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,

  -- Item details (denormalized for historical accuracy)
  item_name TEXT NOT NULL,
  set_name TEXT,
  card_number TEXT,
  grading_company grading_company,
  grade TEXT,
  card_image_url TEXT,

  -- Sale details
  quantity_sold INTEGER NOT NULL DEFAULT 1 CHECK (quantity_sold > 0),
  purchase_price DECIMAL(12,2) NOT NULL CHECK (purchase_price >= 0),
  sale_price DECIMAL(12,2) NOT NULL CHECK (sale_price >= 0),
  profit DECIMAL(12,2), -- Computed: sale_price - purchase_price

  -- Sale metadata
  sale_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  platform TEXT, -- e.g., 'eBay', 'TCGPlayer', 'Facebook', 'Local'
  notes TEXT, -- Used for client/tag grouping

  -- Bulk sale grouping
  sale_group_id UUID, -- Links multiple items in a bulk sale

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for sales
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_user_date ON public.sales(user_id, sale_date DESC);
CREATE INDEX idx_sales_inventory_item ON public.sales(inventory_item_id);
CREATE INDEX idx_sales_group ON public.sales(sale_group_id) WHERE sale_group_id IS NOT NULL;
CREATE INDEX idx_sales_notes ON public.sales(user_id, notes); -- For client filtering

-- ============================================
-- WATCHLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identification
  product_name TEXT NOT NULL,
  set_name TEXT,
  card_number TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'raw',

  -- Price tracking
  current_price DECIMAL(12,2),
  previous_price DECIMAL(12,2),
  price_change_percent DECIMAL(5,2),
  price_updated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate entries
  UNIQUE(user_id, product_name, set_name)
);

-- Indexes for watchlist
CREATE INDEX idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_user_created ON public.watchlist(user_id, created_at DESC);

-- ============================================
-- CLIENT_LISTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- List details
  name TEXT NOT NULL,
  description TEXT,

  -- Sharing
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false,

  -- Items (stored as JSONB array of inventory item IDs)
  item_ids UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for client_lists
CREATE INDEX idx_client_lists_user_id ON public.client_lists(user_id);
CREATE INDEX idx_client_lists_share_token ON public.client_lists(share_token);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_lists ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Inventory items policies
CREATE POLICY "Users can view own inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- Purchase entries policies
CREATE POLICY "Users can view own purchases" ON public.purchase_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchase_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON public.purchase_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON public.purchase_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Sales policies
CREATE POLICY "Users can view own sales" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON public.sales
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON public.sales
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY "Users can view own watchlist" ON public.watchlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON public.watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON public.watchlist
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Client lists policies
CREATE POLICY "Users can view own lists" ON public.client_lists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lists" ON public.client_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.client_lists
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.client_lists
  FOR DELETE USING (auth.uid() = user_id);
-- Public lists can be viewed by anyone with share token
CREATE POLICY "Anyone can view public lists" ON public.client_lists
  FOR SELECT USING (is_public = true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_entries_updated_at
  BEFORE UPDATE ON public.purchase_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_updated_at
  BEFORE UPDATE ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_lists_updated_at
  BEFORE UPDATE ON public.client_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to enforce watchlist limit (25 items per user)
CREATE OR REPLACE FUNCTION check_watchlist_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.watchlist WHERE user_id = NEW.user_id) >= 25 THEN
    RAISE EXCEPTION 'Watchlist limit reached (25 items maximum)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_watchlist_limit
  BEFORE INSERT ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION check_watchlist_limit();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
