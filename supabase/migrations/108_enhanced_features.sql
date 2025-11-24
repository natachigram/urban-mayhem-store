-- ========================================
-- ENHANCED FEATURES MIGRATION
-- Withdrawals, Comments, Rewards, Social Features
-- ========================================

-- Add withdrawal tracking and comments to attestations
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS reward_claimed BOOLEAN DEFAULT FALSE;

-- Add cooldown period column (prevent immediate re-staking after withdrawal)
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS can_restake_at TIMESTAMPTZ;

-- ========================================
-- REWARDS TABLE
-- Track claimable early attestor bonuses
-- ========================================

CREATE TABLE IF NOT EXISTS attestation_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attestation_id UUID NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL,
  reward_amount TEXT NOT NULL, -- Early attestor bonus in wei
  reward_type TEXT NOT NULL CHECK (reward_type IN ('early_attestor', 'quality_bonus', 'dispute_winner')),
  position INTEGER, -- Position in early attestor ranking (1-10)
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attestation_id, reward_type)
);

-- ========================================
-- COUNTER ATTESTATIONS TABLE
-- Track disagreements/disputes
-- ========================================

CREATE TABLE IF NOT EXISTS counter_attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_attestation_id UUID NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  counter_attestation_id UUID NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(original_attestation_id, counter_attestation_id)
);

-- ========================================
-- SOCIAL METRICS VIEW
-- Aggregated statistics for items
-- ========================================

CREATE OR REPLACE VIEW item_social_metrics AS
SELECT 
  a.subject_atom_id as atom_id,
  at.entity_id as item_id,
  COUNT(DISTINCT a.id) as total_attestations,
  COUNT(DISTINCT a.creator_wallet) as unique_raters,
  SUM(CAST(a.stake_amount AS NUMERIC)) as total_staked,
  COUNT(DISTINCT CASE WHEN pred.entity_id IN ('is_great', 'is_high_quality', 'is_fair_price') THEN a.id END) as positive_count,
  COUNT(DISTINCT CASE WHEN pred.entity_id IN ('is_bad', 'is_overpriced') THEN a.id END) as negative_count,
  COUNT(DISTINCT CASE WHEN a.comment IS NOT NULL AND LENGTH(a.comment) > 0 THEN a.id END) as comment_count,
  MAX(a.created_at) as last_attestation_at
FROM attestations a
JOIN atoms at ON a.subject_atom_id = at.atom_id
JOIN atoms pred ON a.predicate_atom_id = pred.atom_id
WHERE a.status = 'active'
AND at.entity_type = 'item'
GROUP BY a.subject_atom_id, at.entity_id;

-- ========================================
-- TOP RATERS LEADERBOARD VIEW
-- Most trusted attestors
-- ========================================

CREATE OR REPLACE VIEW top_raters AS
SELECT 
  a.creator_wallet,
  COUNT(DISTINCT a.id) as total_attestations,
  SUM(CAST(a.stake_amount AS NUMERIC)) as total_staked,
  COUNT(DISTINCT a.subject_atom_id) as items_rated,
  AVG(ts.score) as avg_item_score,
  MAX(a.created_at) as last_active
FROM attestations a
JOIN trust_scores ts ON a.subject_atom_id = ts.atom_id
WHERE a.status = 'active'
GROUP BY a.creator_wallet
HAVING COUNT(DISTINCT a.id) >= 3 -- Minimum 3 attestations to appear
ORDER BY total_attestations DESC, total_staked DESC
LIMIT 100;

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_attestations_comment ON attestations(comment) WHERE comment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attestations_status_active ON attestations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_attestation_rewards_user ON attestation_rewards(user_wallet, claimed);
CREATE INDEX IF NOT EXISTS idx_attestation_rewards_unclaimed ON attestation_rewards(claimed) WHERE claimed = FALSE;
CREATE INDEX IF NOT EXISTS idx_counter_attestations_original ON counter_attestations(original_attestation_id);

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE attestation_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE counter_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards are viewable by everyone"
  ON attestation_rewards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rewards"
  ON attestation_rewards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own rewards"
  ON attestation_rewards FOR UPDATE
  USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
  WITH CHECK (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

CREATE POLICY "Counter attestations viewable by everyone"
  ON counter_attestations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create counter attestations"
  ON counter_attestations FOR INSERT
  WITH CHECK (true);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Calculate and distribute early attestor rewards
CREATE OR REPLACE FUNCTION calculate_early_rewards(target_attestation_id UUID)
RETURNS void AS $$
DECLARE
  target_subject_atom TEXT;
  attestation_position INTEGER;
  stake_amount NUMERIC;
  creator TEXT;
  reward_amount NUMERIC;
  bonus_multiplier NUMERIC;
BEGIN
  -- Get attestation details
  SELECT subject_atom_id, CAST(a.stake_amount AS NUMERIC), creator_wallet
  INTO target_subject_atom, stake_amount, creator
  FROM attestations a
  WHERE id = target_attestation_id;

  -- Find position among all attestations for this item
  SELECT position INTO attestation_position FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as position
    FROM attestations
    WHERE subject_atom_id = target_subject_atom
    AND status = 'active'
  ) ranked
  WHERE id = target_attestation_id;

  -- Award bonus if in first 10 positions
  IF attestation_position <= 10 THEN
    -- Bonus decreases: 10% for #1, 9% for #2, ... 1% for #10
    bonus_multiplier := (11 - attestation_position) / 100.0;
    reward_amount := stake_amount * bonus_multiplier;

    -- Insert reward record
    INSERT INTO attestation_rewards (attestation_id, user_wallet, reward_amount, reward_type, position)
    VALUES (target_attestation_id, creator, reward_amount::TEXT, 'early_attestor', attestation_position)
    ON CONFLICT (attestation_id, reward_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate rewards on new attestation
CREATE OR REPLACE FUNCTION trigger_calculate_early_rewards()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_early_rewards(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_attestation_rewards ON attestations;
CREATE TRIGGER on_new_attestation_rewards
  AFTER INSERT ON attestations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_early_rewards();

-- Function to withdraw attestation stake
CREATE OR REPLACE FUNCTION withdraw_attestation(attestation_id UUID, withdrawer_wallet TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  attestation_creator TEXT;
  current_status TEXT;
BEGIN
  -- Verify ownership
  SELECT creator_wallet, status INTO attestation_creator, current_status
  FROM attestations
  WHERE id = attestation_id;

  IF attestation_creator IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Attestation not found'::TEXT;
    RETURN;
  END IF;

  IF attestation_creator != withdrawer_wallet THEN
    RETURN QUERY SELECT FALSE, 'Not authorized'::TEXT;
    RETURN;
  END IF;

  IF current_status != 'active' THEN
    RETURN QUERY SELECT FALSE, 'Attestation already withdrawn'::TEXT;
    RETURN;
  END IF;

  -- Update attestation status
  UPDATE attestations
  SET 
    status = 'withdrawn',
    withdrawn_at = now(),
    can_restake_at = now() + INTERVAL '24 hours' -- 24-hour cooldown
  WHERE id = attestation_id;

  -- Update trust scores
  PERFORM update_trust_score((SELECT subject_atom_id FROM attestations WHERE id = attestation_id));

  RETURN QUERY SELECT TRUE, 'Stake withdrawn successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to claim rewards
CREATE OR REPLACE FUNCTION claim_reward(reward_id UUID, claimer_wallet TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, amount TEXT) AS $$
DECLARE
  reward_owner TEXT;
  reward_amt TEXT;
  already_claimed BOOLEAN;
BEGIN
  -- Get reward details
  SELECT user_wallet, reward_amount, claimed 
  INTO reward_owner, reward_amt, already_claimed
  FROM attestation_rewards
  WHERE id = reward_id;

  IF reward_owner IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reward not found'::TEXT, '0'::TEXT;
    RETURN;
  END IF;

  IF reward_owner != claimer_wallet THEN
    RETURN QUERY SELECT FALSE, 'Not authorized'::TEXT, '0'::TEXT;
    RETURN;
  END IF;

  IF already_claimed THEN
    RETURN QUERY SELECT FALSE, 'Reward already claimed'::TEXT, '0'::TEXT;
    RETURN;
  END IF;

  -- Mark as claimed (actual blockchain transfer would happen in application layer)
  UPDATE attestation_rewards
  SET 
    claimed = TRUE,
    claimed_at = now()
  WHERE id = reward_id;

  RETURN QUERY SELECT TRUE, 'Reward marked for claim'::TEXT, reward_amt;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  'Migration 108 completed' as status,
  COUNT(*) as new_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attestation_rewards', 'counter_attestations');
