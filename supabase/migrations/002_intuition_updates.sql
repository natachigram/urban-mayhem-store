-- ========================================
-- URBAN MAYHEM STORE - SCHEMA UPDATES
-- For Intuition Integration
-- ========================================

-- Update creators table to add wallet_address if not exists
ALTER TABLE creators 
  ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS intuition_subject_id TEXT UNIQUE;

-- Update items table to add intuition_subject_id and preview_url
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS intuition_subject_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Update attestations table to add quality, design, utility scores
ALTER TABLE attestations
  ADD COLUMN IF NOT EXISTS quality INTEGER CHECK (quality >= 1 AND quality <= 5),
  ADD COLUMN IF NOT EXISTS design INTEGER CHECK (design >= 1 AND design <= 5),
  ADD COLUMN IF NOT EXISTS utility INTEGER CHECK (utility >= 1 AND utility <= 5),
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_items_intuition_subject ON items(intuition_subject_id);
CREATE INDEX IF NOT EXISTS idx_creators_intuition_subject ON creators(intuition_subject_id);
CREATE INDEX IF NOT EXISTS idx_creators_wallet ON creators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_attestations_wallet ON attestations(wallet_address);

-- Update attestation score calculation function to include new aspects
CREATE OR REPLACE FUNCTION calculate_item_attestation_score(item_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_rating DECIMAL;
  avg_quality DECIMAL;
  avg_design DECIMAL;
  avg_utility DECIMAL;
  attestation_cnt INTEGER;
  final_score INTEGER;
BEGIN
  -- Get averages and count
  SELECT 
    AVG(rating)::DECIMAL,
    AVG(COALESCE(quality, rating))::DECIMAL,
    AVG(COALESCE(design, rating))::DECIMAL,
    AVG(COALESCE(utility, rating))::DECIMAL,
    COUNT(*)
  INTO avg_rating, avg_quality, avg_design, avg_utility, attestation_cnt
  FROM attestations
  WHERE item_id = item_uuid;
  
  -- No attestations = score of 0
  IF attestation_cnt = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate weighted score (0-100)
  -- Formula: ((avg of all aspects / 5) * 80) + (min(count, 10) * 2)
  -- This gives 80% weight to quality and 20% to popularity (capped at 10 attestations)
  final_score := ROUND(
    (((avg_rating + avg_quality + avg_design + avg_utility) / 4 / 5) * 80) +
    (LEAST(attestation_cnt, 10) * 2)
  );
  
  RETURN GREATEST(0, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql;

-- Update trigger to use new calculation
DROP TRIGGER IF EXISTS update_item_attestation_score_trigger ON attestations;

CREATE TRIGGER update_item_attestation_score_trigger
AFTER INSERT OR UPDATE OR DELETE ON attestations
FOR EACH ROW
EXECUTE FUNCTION update_item_attestation_score();

-- Add creator stats columns
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attestation_count INTEGER DEFAULT 0;

-- Function to update creator stats
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creators
    SET item_count = (
      SELECT COUNT(*) FROM items WHERE creator_id = NEW.creator_id
    )
    WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creators
    SET item_count = (
      SELECT COUNT(*) FROM items WHERE creator_id = OLD.creator_id
    )
    WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update creator item count
DROP TRIGGER IF EXISTS update_creator_item_count_trigger ON items;

CREATE TRIGGER update_creator_item_count_trigger
AFTER INSERT OR DELETE ON items
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats();

-- Function to update creator attestation count
CREATE OR REPLACE FUNCTION update_creator_attestation_count()
RETURNS TRIGGER AS $$
DECLARE
  creator_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT creator_id INTO creator_uuid FROM items WHERE id = NEW.item_id;
    IF creator_uuid IS NOT NULL THEN
      UPDATE creators
      SET attestation_count = (
        SELECT COUNT(DISTINCT a.id)
        FROM attestations a
        JOIN items i ON a.item_id = i.id
        WHERE i.creator_id = creator_uuid
      )
      WHERE id = creator_uuid;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT creator_id INTO creator_uuid FROM items WHERE id = OLD.item_id;
    IF creator_uuid IS NOT NULL THEN
      UPDATE creators
      SET attestation_count = (
        SELECT COUNT(DISTINCT a.id)
        FROM attestations a
        JOIN items i ON a.item_id = i.id
        WHERE i.creator_id = creator_uuid
      )
      WHERE id = creator_uuid;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update creator attestation count
DROP TRIGGER IF EXISTS update_creator_attestation_count_trigger ON attestations;

CREATE TRIGGER update_creator_attestation_count_trigger
AFTER INSERT OR DELETE ON attestations
FOR EACH ROW
EXECUTE FUNCTION update_creator_attestation_count();

-- Comments for documentation
COMMENT ON COLUMN creators.wallet_address IS 'Ethereum wallet address for creator authentication';
COMMENT ON COLUMN creators.intuition_subject_id IS 'Intuition Protocol subject ID for this creator';
COMMENT ON COLUMN items.intuition_subject_id IS 'Intuition Protocol subject ID for this item';
COMMENT ON COLUMN items.preview_url IS 'Optional URL to video or interactive preview';
COMMENT ON COLUMN attestations.quality IS 'Quality rating (1-5) from Intuition attestation';
COMMENT ON COLUMN attestations.design IS 'Design rating (1-5) from Intuition attestation';
COMMENT ON COLUMN attestations.utility IS 'Utility rating (1-5) from Intuition attestation';
COMMENT ON COLUMN attestations.wallet_address IS 'Wallet address of attester (for non-authenticated users)';
