-- Quick deployment script for atoms table
CREATE TABLE IF NOT EXISTS atoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atom_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('item', 'player', 'predicate')),
  entity_id TEXT NOT NULL,
  atom_uri TEXT NOT NULL,
  atom_data TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_atoms_entity ON atoms(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_atoms_creator ON atoms(creator_wallet);

ALTER TABLE atoms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atoms are viewable by everyone" ON atoms;
CREATE POLICY "Atoms are viewable by everyone" ON atoms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create atoms" ON atoms;
CREATE POLICY "Anyone can create atoms" ON atoms FOR INSERT WITH CHECK (true);
