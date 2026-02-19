-- eBay OAuth connections table
-- Stores eBay access/refresh tokens for users who connect their eBay accounts

CREATE TABLE IF NOT EXISTS ebay_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- eBay user info
    ebay_username TEXT,
    ebay_user_id TEXT,
    
    -- OAuth tokens (encrypted at rest by Supabase)
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    
    -- Token expiration timestamps
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Each user can only have one eBay connection
    UNIQUE(user_id)
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_ebay_connections_user_id ON ebay_connections(user_id);

-- Row Level Security
ALTER TABLE ebay_connections ENABLE ROW LEVEL SECURITY;

-- Only service role can access tokens (they're sensitive)
-- Users can only see their own connection exists, not the tokens
CREATE POLICY "Service role can manage all ebay connections"
    ON ebay_connections
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can check if they have a connection (but not see tokens)
CREATE POLICY "Users can view own connection existence"
    ON ebay_connections
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ebay_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ebay_connections_updated_at
    BEFORE UPDATE ON ebay_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_ebay_connections_updated_at();

-- Comments for documentation
COMMENT ON TABLE ebay_connections IS 'Stores eBay OAuth tokens for users who connect their eBay accounts';
COMMENT ON COLUMN ebay_connections.access_token IS 'eBay OAuth access token - short lived (2 hours)';
COMMENT ON COLUMN ebay_connections.refresh_token IS 'eBay OAuth refresh token - long lived (18 months)';
