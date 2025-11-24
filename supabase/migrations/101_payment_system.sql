-- ========================================
-- PAYMENT SYSTEM ENHANCEMENTS
-- Adds player_id tracking and payment verification
-- ========================================

-- Add player_id index for Unity game queries
CREATE INDEX IF NOT EXISTS idx_purchases_player_id 
  ON purchases((metadata->>'player_id')) 
  WHERE metadata->>'player_id' IS NOT NULL;

-- Add function to verify payment by player_id
CREATE OR REPLACE FUNCTION verify_payment_by_player(
  p_player_id TEXT,
  p_transaction_hash TEXT DEFAULT NULL
)
RETURNS TABLE (
  purchase_id UUID,
  item_id UUID,
  item_name TEXT,
  quantity INTEGER,
  amount DECIMAL,
  transaction_hash TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_transaction_hash IS NOT NULL THEN
    -- Verify specific transaction
    RETURN QUERY
    SELECT 
      p.id,
      p.item_id,
      i.name,
      p.quantity,
      p.amount,
      p.transaction_hash,
      p.status,
      p.created_at
    FROM purchases p
    JOIN items i ON i.id = p.item_id
    WHERE p.metadata->>'player_id' = p_player_id
      AND p.transaction_hash = p_transaction_hash
      AND p.status = 'completed';
  ELSE
    -- Get all completed purchases for player
    RETURN QUERY
    SELECT 
      p.id,
      p.item_id,
      i.name,
      p.quantity,
      p.amount,
      p.transaction_hash,
      p.status,
      p.created_at
    FROM purchases p
    JOIN items i ON i.id = p.item_id
    WHERE p.metadata->>'player_id' = p_player_id
      AND p.status = 'completed'
    ORDER BY p.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get player inventory by player_id
CREATE OR REPLACE FUNCTION get_player_inventory(p_player_id TEXT)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  item_type TEXT,
  item_rarity TEXT,
  quantity INTEGER,
  is_equipped BOOLEAN,
  acquired_at TIMESTAMPTZ,
  item_stats JSONB
) AS $$
DECLARE
  v_user_wallet TEXT;
BEGIN
  -- Find user wallet from player_id
  SELECT user_wallet INTO v_user_wallet
  FROM purchases
  WHERE metadata->>'player_id' = p_player_id
  LIMIT 1;

  IF v_user_wallet IS NULL THEN
    RETURN;
  END IF;

  -- Return inventory
  RETURN QUERY
  SELECT 
    inv.item_id,
    i.name,
    i.type,
    i.rarity,
    inv.quantity,
    inv.is_equipped,
    inv.acquired_at,
    i.stats
  FROM user_inventory inv
  JOIN items i ON i.id = inv.item_id
  WHERE inv.user_wallet = v_user_wallet
  ORDER BY inv.acquired_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for player_id based queries (for Unity backend)
CREATE POLICY "Allow Unity backend to verify purchases"
  ON purchases FOR SELECT
  USING (
    auth.jwt()->>'role' = 'service_role' 
    OR metadata->>'player_id' IS NOT NULL
  );

-- Add table for payment verification logs
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_method TEXT DEFAULT 'blockchain',
  error_message TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_payment_verifications_player_id ON payment_verifications(player_id);
CREATE INDEX idx_payment_verifications_tx_hash ON payment_verifications(transaction_hash);

-- Add RLS for payment verifications
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage payment verifications"
  ON payment_verifications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add trigger to log payment verifications
CREATE OR REPLACE FUNCTION log_payment_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.transaction_hash IS NOT NULL THEN
    INSERT INTO payment_verifications (
      player_id,
      transaction_hash,
      verification_status,
      verified_at,
      metadata
    ) VALUES (
      NEW.metadata->>'player_id',
      NEW.transaction_hash,
      'verified',
      now(),
      jsonb_build_object(
        'purchase_id', NEW.id,
        'amount', NEW.amount,
        'item_id', NEW.item_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_purchase_verified
  AFTER UPDATE ON purchases
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION log_payment_verification();

COMMENT ON FUNCTION verify_payment_by_player IS 'Unity game uses this to verify player purchases';
COMMENT ON FUNCTION get_player_inventory IS 'Unity game uses this to sync player inventory';
