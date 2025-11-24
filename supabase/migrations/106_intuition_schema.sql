-- ========================================
-- INTUITION PROTOCOL INTEGRATION SCHEMA
-- Atoms, Attestations (Triples), and Trust Scores
-- ========================================

-- Atoms table (cached Intuition atoms)
CREATE TABLE atoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atom_id TEXT NOT NULL UNIQUE, -- Intuition atom ID (termId from SDK)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('item', 'player', 'predicate')),
  entity_id TEXT NOT NULL, -- item_id, wallet address, or predicate text
  atom_uri TEXT NOT NULL, -- IPFS URI from Intuition
  atom_data TEXT NOT NULL, -- Hex data from Intuition
  creator_wallet TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id) -- One atom per entity
);

-- Attestations table (cached Intuition triples/claims)
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triple_id TEXT NOT NULL UNIQUE, -- Intuition triple ID
  subject_atom_id TEXT NOT NULL REFERENCES atoms(atom_id) ON DELETE CASCADE,
  predicate_atom_id TEXT NOT NULL REFERENCES atoms(atom_id) ON DELETE CASCADE,
  object_atom_id TEXT NOT NULL REFERENCES atoms(atom_id) ON DELETE CASCADE,
  stake_amount TEXT NOT NULL, -- Amount staked (bigint as string)
  creator_wallet TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'disputed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trust scores cache (computed from attestations)
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atom_id TEXT NOT NULL REFERENCES atoms(atom_id) ON DELETE CASCADE,
  score DECIMAL(5, 2) DEFAULT 0, -- 0-100 percentage
  positive_stake TEXT DEFAULT '0',
  negative_stake TEXT DEFAULT '0',
  total_stake TEXT DEFAULT '0',
  attestation_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(atom_id)
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_atoms_entity ON atoms(entity_type, entity_id);
CREATE INDEX idx_atoms_creator ON atoms(creator_wallet);

CREATE INDEX idx_attestations_subject ON attestations(subject_atom_id);
CREATE INDEX idx_attestations_creator ON attestations(creator_wallet);
CREATE INDEX idx_attestations_status ON attestations(status) WHERE status = 'active';
CREATE INDEX idx_attestations_created ON attestations(created_at DESC);

CREATE INDEX idx_trust_scores_atom ON trust_scores(atom_id);
CREATE INDEX idx_trust_scores_score ON trust_scores(score DESC);

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE atoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

-- Atoms: Public read, authenticated write
CREATE POLICY "Atoms are viewable by everyone"
  ON atoms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create atoms"
  ON atoms FOR INSERT
  WITH CHECK (true);

-- Attestations: Public read, authenticated write
CREATE POLICY "Attestations are viewable by everyone"
  ON attestations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create attestations"
  ON attestations FOR INSERT
  WITH CHECK (true);

-- Trust scores: Public read, system write
CREATE POLICY "Trust scores are viewable by everyone"
  ON trust_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update trust scores"
  ON trust_scores FOR ALL
  USING (true);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to update trust score when attestations change
CREATE OR REPLACE FUNCTION update_trust_score(target_atom_id TEXT)
RETURNS void AS $$
DECLARE
  pos_stake NUMERIC := 0;
  neg_stake NUMERIC := 0;
  total_stake NUMERIC := 0;
  attest_count INTEGER := 0;
  trust_score NUMERIC := 0;
BEGIN
  -- Calculate stakes from attestations
  SELECT 
    COALESCE(SUM(CASE 
      WHEN a_pred.entity_id IN ('is great', 'is high quality', 'is fair price') 
      THEN CAST(a.stake_amount AS NUMERIC)
      ELSE 0 
    END), 0),
    COALESCE(SUM(CASE 
      WHEN a_pred.entity_id IN ('is bad', 'is overpriced') 
      THEN CAST(a.stake_amount AS NUMERIC)
      ELSE 0 
    END), 0),
    COUNT(*)
  INTO pos_stake, neg_stake, attest_count
  FROM attestations a
  JOIN atoms a_pred ON a.predicate_atom_id = a_pred.atom_id
  WHERE a.subject_atom_id = target_atom_id
  AND a.status = 'active';

  total_stake := pos_stake + neg_stake;
  
  IF total_stake > 0 THEN
    trust_score := (pos_stake / total_stake) * 100;
  ELSE
    trust_score := 0;
  END IF;

  -- Upsert trust score
  INSERT INTO trust_scores (atom_id, score, positive_stake, negative_stake, total_stake, attestation_count, last_calculated_at)
  VALUES (target_atom_id, trust_score, pos_stake::TEXT, neg_stake::TEXT, total_stake::TEXT, attest_count, now())
  ON CONFLICT (atom_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    positive_stake = EXCLUDED.positive_stake,
    negative_stake = EXCLUDED.negative_stake,
    total_stake = EXCLUDED.total_stake,
    attestation_count = EXCLUDED.attestation_count,
    last_calculated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trust score when attestation is created
CREATE OR REPLACE FUNCTION trigger_update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_trust_score(NEW.subject_atom_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_attestation_created
  AFTER INSERT ON attestations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score();

CREATE TRIGGER on_attestation_updated
  AFTER UPDATE OF status ON attestations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score();

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('atoms', 'attestations', 'trust_scores')
ORDER BY table_name;
