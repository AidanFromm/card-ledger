-- Price Alerts table for tracking user price notifications
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL, -- Can be inventory_item_id or product_id
  card_name TEXT NOT NULL,
  set_name TEXT,
  card_image_url TEXT,
  current_price NUMERIC(10, 2),
  target_price NUMERIC(10, 2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_card_id ON public.price_alerts(card_id);

-- RLS policies
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own alerts
CREATE POLICY "Users can view own alerts" ON public.price_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert own alerts" ON public.price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts" ON public.price_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts" ON public.price_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_price_alerts_updated_at
  BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_price_alerts_updated_at();
