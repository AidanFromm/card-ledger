-- CardLedger Client Lists Sharing Enhancements
-- Created: 2026-02-04
-- Feature: QR codes, expiration, view tracking

-- ============================================
-- ADD NEW COLUMNS TO CLIENT_LISTS
-- ============================================

-- Expiration date for share links (default 30 days from creation)
ALTER TABLE public.client_lists
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- View tracking
ALTER TABLE public.client_lists
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

ALTER TABLE public.client_lists
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- ============================================
-- INDEX FOR EXPIRATION QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_lists_expires_at
ON public.client_lists(expires_at)
WHERE expires_at IS NOT NULL;

-- ============================================
-- FUNCTION TO INCREMENT VIEW COUNT
-- ============================================

-- Increment view count when a list is viewed via share token
CREATE OR REPLACE FUNCTION increment_list_view_count(p_share_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.client_lists
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE share_token = p_share_token
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO CHECK IF LIST IS EXPIRED
-- ============================================

CREATE OR REPLACE FUNCTION is_list_expired(p_share_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  list_expires_at TIMESTAMPTZ;
BEGIN
  SELECT expires_at INTO list_expires_at
  FROM public.client_lists
  WHERE share_token = p_share_token;

  IF list_expires_at IS NULL THEN
    RETURN FALSE; -- No expiration set
  END IF;

  RETURN list_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE EXISTING LISTS
-- ============================================

-- Set expires_at for existing lists that don't have one
UPDATE public.client_lists
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Initialize view_count for existing lists
UPDATE public.client_lists
SET view_count = 0
WHERE view_count IS NULL;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION increment_list_view_count(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_list_expired(TEXT) TO anon, authenticated;
