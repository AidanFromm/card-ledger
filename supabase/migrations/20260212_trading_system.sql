-- Trading System Migration
-- Trade listings and matching between CardLedger users

-- Trade Listings Table
-- Users can list inventory items for trade and specify what they're looking for
CREATE TABLE IF NOT EXISTS trade_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('have', 'want')),
  card_name TEXT NOT NULL,
  set_name TEXT,
  card_image_url TEXT,
  looking_for TEXT, -- Free text description of what they want in return
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trade Matches Table
-- Records potential and confirmed trades between users
CREATE TABLE IF NOT EXISTS trade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_a_listing_id UUID REFERENCES trade_listings(id) ON DELETE SET NULL,
  user_b_listing_id UUID REFERENCES trade_listings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'accepted', 'declined', 'completed', 'cancelled')),
  match_score INTEGER DEFAULT 0, -- Number of overlapping cards
  proposed_by UUID REFERENCES auth.users(id),
  proposed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trade Messages Table
-- In-app messaging for trade negotiation
CREATE TABLE IF NOT EXISTS trade_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_match_id UUID NOT NULL REFERENCES trade_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trade Offer Items Table
-- Cards included in a trade proposal
CREATE TABLE IF NOT EXISTS trade_offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_match_id UUID NOT NULL REFERENCES trade_matches(id) ON DELETE CASCADE,
  offered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES trade_listings(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  card_name TEXT NOT NULL,
  set_name TEXT,
  card_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_listings_user_id ON trade_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_listings_active ON trade_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trade_listings_type ON trade_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_trade_listings_inventory_item ON trade_listings(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_trade_matches_user_a ON trade_matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_b ON trade_matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_status ON trade_matches(status);

CREATE INDEX IF NOT EXISTS idx_trade_messages_match ON trade_messages(trade_match_id);
CREATE INDEX IF NOT EXISTS idx_trade_messages_sender ON trade_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_messages_unread ON trade_messages(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_trade_offer_items_match ON trade_offer_items(trade_match_id);
CREATE INDEX IF NOT EXISTS idx_trade_offer_items_user ON trade_offer_items(offered_by);

-- RLS Policies
ALTER TABLE trade_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offer_items ENABLE ROW LEVEL SECURITY;

-- Trade Listings: Users can manage their own, read all active listings
CREATE POLICY "Users can view all active trade listings"
  ON trade_listings FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can insert their own trade listings"
  ON trade_listings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trade listings"
  ON trade_listings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own trade listings"
  ON trade_listings FOR DELETE
  USING (user_id = auth.uid());

-- Trade Matches: Users can only see matches they're part of
CREATE POLICY "Users can view their own trade matches"
  ON trade_matches FOR SELECT
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Users can insert trade matches they're part of"
  ON trade_matches FOR INSERT
  WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Users can update trade matches they're part of"
  ON trade_matches FOR UPDATE
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- Trade Messages: Users can see messages for matches they're part of
CREATE POLICY "Users can view messages in their trades"
  ON trade_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trade_matches m
      WHERE m.id = trade_match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their trades"
  ON trade_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM trade_matches m
      WHERE m.id = trade_match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON trade_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trade_matches m
      WHERE m.id = trade_match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
  );

-- Trade Offer Items: Users can see items in their trades
CREATE POLICY "Users can view offer items in their trades"
  ON trade_offer_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trade_matches m
      WHERE m.id = trade_match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can add offer items to their trades"
  ON trade_offer_items FOR INSERT
  WITH CHECK (
    offered_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM trade_matches m
      WHERE m.id = trade_match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can remove their own offer items"
  ON trade_offer_items FOR DELETE
  USING (offered_by = auth.uid());

-- Function to find potential trade matches for a user
CREATE OR REPLACE FUNCTION find_trade_matches(p_user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  match_score INTEGER,
  they_have_ids UUID[],
  you_have_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_wants AS (
    -- Cards the user wants (from wishlist)
    SELECT LOWER(card_name) as card_name_lower, card_name, set_name
    FROM wishlist
    WHERE user_id = p_user_id
  ),
  user_has AS (
    -- Cards the user has listed for trade
    SELECT id, LOWER(card_name) as card_name_lower, card_name, set_name, user_id
    FROM trade_listings
    WHERE user_id = p_user_id
    AND listing_type = 'have'
    AND is_active = true
  ),
  other_has AS (
    -- Cards other users have listed for trade
    SELECT id, LOWER(card_name) as card_name_lower, card_name, set_name, user_id
    FROM trade_listings
    WHERE user_id != p_user_id
    AND listing_type = 'have'
    AND is_active = true
  ),
  other_wants AS (
    -- Cards other users want (from their wishlists)
    SELECT LOWER(card_name) as card_name_lower, user_id
    FROM wishlist
    WHERE user_id != p_user_id
  ),
  -- Find matches: other users who have what you want
  they_have_what_you_want AS (
    SELECT oh.user_id as other_user_id, oh.id as listing_id
    FROM other_has oh
    JOIN user_wants uw ON oh.card_name_lower = LOWER(uw.card_name)
  ),
  -- Find matches: other users who want what you have
  they_want_what_you_have AS (
    SELECT ow.user_id as other_user_id, uh.id as listing_id
    FROM other_wants ow
    JOIN user_has uh ON ow.card_name_lower = uh.card_name_lower
  ),
  -- Combine: users who both have what you want AND want what you have
  mutual_matches AS (
    SELECT 
      thwyw.other_user_id,
      array_agg(DISTINCT thwyw.listing_id) as they_have_ids,
      (
        SELECT array_agg(DISTINCT twwyh.listing_id)
        FROM they_want_what_you_have twwyh
        WHERE twwyh.other_user_id = thwyw.other_user_id
      ) as you_have_ids,
      COUNT(DISTINCT thwyw.listing_id)::INTEGER + 
      COALESCE((
        SELECT COUNT(DISTINCT twwyh.listing_id)::INTEGER
        FROM they_want_what_you_have twwyh
        WHERE twwyh.other_user_id = thwyw.other_user_id
      ), 0) as match_score
    FROM they_have_what_you_want thwyw
    WHERE EXISTS (
      SELECT 1 FROM they_want_what_you_have twwyh
      WHERE twwyh.other_user_id = thwyw.other_user_id
    )
    GROUP BY thwyw.other_user_id
  )
  SELECT 
    mm.other_user_id,
    mm.match_score,
    mm.they_have_ids,
    mm.you_have_ids
  FROM mutual_matches mm
  ORDER BY mm.match_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_trade_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trade_listings_updated_at
  BEFORE UPDATE ON trade_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_updated_at();

CREATE TRIGGER trade_matches_updated_at
  BEFORE UPDATE ON trade_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_updated_at();
