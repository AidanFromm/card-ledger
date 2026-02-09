-- Add performance indexes for Card Ledger scalability
-- These indexes dramatically speed up queries as inventory grows

-- Inventory items indexes (most critical - users query this constantly)
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_card_number ON public.inventory_items(card_number);
CREATE INDEX IF NOT EXISTS idx_inventory_set_name ON public.inventory_items(set_name);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON public.inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_grading ON public.inventory_items(grading_company, grade);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON public.inventory_items(created_at DESC);

-- Products table indexes (for fast search)
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_set_name ON public.products(set_name);
CREATE INDEX IF NOT EXISTS idx_products_card_number ON public.products(card_number);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_rarity ON public.products(rarity);

-- Sales indexes (for analytics and client tracking)
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON public.sales(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_sale_group ON public.sales(sale_group_id);

-- Purchase entries indexes (for cost tracking)
CREATE INDEX IF NOT EXISTS idx_purchase_user_id ON public.purchase_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_inventory_id ON public.purchase_entries(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_date ON public.purchase_entries(purchase_date DESC);

-- Client lists indexes (for shareable lists)
CREATE INDEX IF NOT EXISTS idx_client_lists_user_id ON public.client_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_client_lists_share_token ON public.client_lists(share_token);