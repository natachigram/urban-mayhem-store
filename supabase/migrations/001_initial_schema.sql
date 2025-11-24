-- ========================================
-- URBAN MAYHEM STORE - DATABASE SCHEMA
-- ========================================
-- Run this in your Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLES
-- ========================================

-- Creators table (extends auth.users)
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wallet_address TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  intuition_subject_id TEXT UNIQUE,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weapon', 'skin', 'bundle', 'powerup')),
  description TEXT,
  long_description TEXT,
  image_url TEXT NOT NULL,
  gallery_images TEXT[],
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  stats JSONB,
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  intuition_subject_id TEXT UNIQUE,
  attestation_score INTEGER DEFAULT 0 CHECK (attestation_score >= 0 AND attestation_score <= 100),
  attestation_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attestations table
CREATE TABLE IF NOT EXISTS attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  aspects JSONB,
  intuition_attestation_id TEXT UNIQUE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
CREATE INDEX IF NOT EXISTS idx_items_score ON items(attestation_score DESC);
CREATE INDEX IF NOT EXISTS idx_items_creator ON items(creator_id);
CREATE INDEX IF NOT EXISTS idx_attestations_item ON attestations(item_id);
CREATE INDEX IF NOT EXISTS idx_attestations_user ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item ON purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_creators_revenue ON creators(total_revenue DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Items policies
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = creator_id);

-- Attestations policies
CREATE POLICY "Attestations are viewable by everyone"
  ON attestations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create attestations"
  ON attestations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attestations"
  ON attestations FOR UPDATE
  USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Authenticated users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Creators policies
CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own creator profile"
  ON creators FOR ALL
  USING (auth.uid() = id);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update attestation score
CREATE OR REPLACE FUNCTION update_item_attestation_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items
  SET 
    attestation_score = (
      SELECT ROUND(AVG(rating) * 20)
      FROM attestations
      WHERE item_id = NEW.item_id
    ),
    attestation_count = (
      SELECT COUNT(*)
      FROM attestations
      WHERE item_id = NEW.item_id
    ),
    updated_at = now()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for attestation score update
DROP TRIGGER IF EXISTS on_attestation_created ON attestations;
CREATE TRIGGER on_attestation_created
  AFTER INSERT ON attestations
  FOR EACH ROW
  EXECUTE FUNCTION update_item_attestation_score();

-- Function to update creator revenue
CREATE OR REPLACE FUNCTION update_creator_revenue()
RETURNS TRIGGER AS $$
BEGIN
  -- Update creator revenue (70% of sale)
  UPDATE creators
  SET 
    total_revenue = total_revenue + (NEW.amount * 0.7),
    updated_at = now()
  WHERE id = (
    SELECT creator_id FROM items WHERE id = NEW.item_id
  );
  
  -- Update item purchase count
  UPDATE items
  SET 
    purchase_count = purchase_count + 1,
    updated_at = now()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for revenue update
DROP TRIGGER IF EXISTS on_purchase_created ON purchases;
CREATE TRIGGER on_purchase_created
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_revenue();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS creators_updated_at ON creators;
CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ========================================
-- SEED DATA (Optional - for testing)
-- ========================================

-- Insert test creators (requires auth users first)
-- INSERT INTO creators (id, name, wallet_address) VALUES
--   ('user-uuid-1', 'ArmsDealer', '0x1234567890abcdef'),
--   ('user-uuid-2', 'StyleCraft', '0xfedcba0987654321');

-- Insert test items
-- INSERT INTO items (name, type, description, image_url, price, rarity, creator_id, attestation_score) VALUES
--   ('Plasma Rifle X', 'weapon', 'High-powered energy weapon', 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91', 29.99, 'legendary', 'user-uuid-1', 95),
--   ('Neon Tactical Suit', 'skin', 'Glowing tactical armor', 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff', 19.99, 'epic', 'user-uuid-2', 88);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'creators', 'attestations', 'purchases');

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('items', 'attestations', 'purchases', 'creators');
