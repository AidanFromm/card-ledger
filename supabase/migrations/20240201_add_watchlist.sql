-- Watchlist table for tracking cards users want to buy
-- Limited to 25 items per user to keep them focused

CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    set_name TEXT NOT NULL,
    card_number TEXT,
    image_url TEXT,
    category TEXT DEFAULT 'raw',
    current_price DECIMAL(10, 2),
    previous_price DECIMAL(10, 2),
    price_change_percent DECIMAL(5, 2),
    price_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate entries for same card per user
    UNIQUE(user_id, product_name, set_name, card_number)
);

-- Enable Row Level Security
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own watchlist items"
    ON public.watchlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items"
    ON public.watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items"
    ON public.watchlist FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items"
    ON public.watchlist FOR DELETE
    USING (auth.uid() = user_id);

-- Function to enforce 25 item limit per user
CREATE OR REPLACE FUNCTION check_watchlist_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.watchlist WHERE user_id = NEW.user_id) >= 25 THEN
        RAISE EXCEPTION 'Watchlist limit reached. Maximum 25 items allowed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit before insert
CREATE TRIGGER enforce_watchlist_limit
    BEFORE INSERT ON public.watchlist
    FOR EACH ROW
    EXECUTE FUNCTION check_watchlist_limit();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON public.watchlist(user_id, created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watchlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watchlist_updated_at
    BEFORE UPDATE ON public.watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_watchlist_updated_at();

-- Grant permissions
GRANT ALL ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
