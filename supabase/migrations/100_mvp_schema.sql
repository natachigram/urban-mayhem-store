-- ========================================
-- URBAN MAYHEM STORE - MVP SCHEMA
-- Production-ready simplified version
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DROP OLD TABLES (clean slate)
-- ========================================

DROP TABLE IF EXISTS attestations CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;

-- ========================================
-- CORE TABLES
-- ========================================

-- Items table (store catalog)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weapon', 'skin', 'bundle', 'powerup')),
  description TEXT,
  long_description TEXT,
  image_url TEXT NOT NULL,
  gallery_images TEXT[],
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  stats JSONB DEFAULT '{}',
  -- Simple inventory tracking
  stock_quantity INTEGER DEFAULT -1, -- -1 means unlimited
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  purchase_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Flexible field for future attributes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table (transaction history)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL, -- Wallet address as primary identifier
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional auth integration
  amount DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  transaction_hash TEXT UNIQUE, -- Blockchain tx hash for $TRUST payment
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User inventory (owned items for game sync)
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL, -- Primary key for Unity sync
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  is_equipped BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- Game-specific data (level, upgrades, etc.)
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_wallet, item_id) -- One entry per item per user
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_items_type ON items(type) WHERE is_active = true;
CREATE INDEX idx_items_rarity ON items(rarity) WHERE is_active = true;
CREATE INDEX idx_items_featured ON items(is_featured) WHERE is_active = true AND is_featured = true;
CREATE INDEX idx_items_price ON items(price) WHERE is_active = true;

CREATE INDEX idx_purchases_user_wallet ON purchases(user_wallet);
CREATE INDEX idx_purchases_item ON purchases(item_id);
CREATE INDEX idx_purchases_tx_hash ON purchases(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_purchases_created ON purchases(created_at DESC);

CREATE INDEX idx_inventory_user_wallet ON user_inventory(user_wallet);
CREATE INDEX idx_inventory_item ON user_inventory(item_id);
CREATE INDEX idx_inventory_equipped ON user_inventory(user_wallet, is_equipped) WHERE is_equipped = true;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Items: Public read, admin write only
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage items"
  ON items FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Purchases: Users can view own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (
    user_wallet = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR auth.uid() = user_id
  );

CREATE POLICY "Service role can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Inventory: Users can view own inventory
CREATE POLICY "Users can view own inventory"
  ON user_inventory FOR SELECT
  USING (
    user_wallet = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR auth.uid() = user_id
  );

CREATE POLICY "Service role can manage inventory"
  ON user_inventory FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update item purchase count and add to inventory
CREATE OR REPLACE FUNCTION handle_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment item purchase count
  UPDATE items
  SET 
    purchase_count = purchase_count + NEW.quantity,
    stock_quantity = CASE 
      WHEN stock_quantity > 0 THEN stock_quantity - NEW.quantity
      ELSE stock_quantity
    END,
    updated_at = now()
  WHERE id = NEW.item_id;
  
  -- Add to user inventory (or update quantity if exists)
  INSERT INTO user_inventory (user_wallet, user_id, item_id, purchase_id, quantity)
  VALUES (NEW.user_wallet, NEW.user_id, NEW.item_id, NEW.id, NEW.quantity)
  ON CONFLICT (user_wallet, item_id)
  DO UPDATE SET
    quantity = user_inventory.quantity + NEW.quantity,
    metadata = jsonb_set(
      user_inventory.metadata,
      '{last_purchase_at}',
      to_jsonb(now())
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_purchase_completed
  AFTER INSERT ON purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION handle_purchase();

-- ========================================
-- SEED DATA (Sample items for testing)
-- ========================================

INSERT INTO items (name, type, description, long_description, image_url, price, rarity, is_featured, stats) VALUES
  (
    'Plasma Rifle X-99',
    'weapon',
    'Devastating energy weapon with rapid-fire capability',
    'The Plasma Rifle X-99 is the pinnacle of Urban Mayhem weaponry. Fires superheated plasma bolts at incredible speeds, melting through armor and shields. Perfect for aggressive players who want to dominate close to medium-range combat.',
    'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800',
    29.99,
    'legendary',
    true,
    '{"damage": 85, "fireRate": 750, "accuracy": 88, "range": "medium"}'
  ),
  (
    'Neon Tactical Suit',
    'skin',
    'Glowing tactical armor with reactive neon patterns',
    'Stand out in the urban battlefield with this stunning neon tactical suit. Features reactive lighting that responds to your movements and combat actions. Not just style - includes minor stat boosts to movement speed.',
    'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800',
    19.99,
    'epic',
    true,
    '{"movementSpeed": 5, "visibility": "high"}'
  ),
  (
    'Starter Pack',
    'bundle',
    'Essential items for new Urban Mayhem players',
    'Everything you need to hit the ground running. Includes basic weapon, standard armor skin, 3 health packs, and 5 shield boosters. Best value for beginners.',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    9.99,
    'common',
    true,
    '{"contents": ["Basic Rifle", "Standard Armor", "3x Health Pack", "5x Shield Booster"]}'
  ),
  (
    'Cyber Katana',
    'weapon',
    'High-frequency blade for close combat specialists',
    'A masterpiece of deadly elegance. The Cyber Katana uses high-frequency oscillation to cut through anything. Requires skill to wield effectively but rewards with devastating one-hit eliminations.',
    'https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800',
    24.99,
    'legendary',
    false,
    '{"damage": 95, "range": "melee", "attackSpeed": 2.5, "critChance": 35}'
  ),
  (
    'Shield Regenerator',
    'powerup',
    'Rapidly restores shield capacity',
    'Emergency shield restoration device. Instantly restores 50% shield and provides enhanced regeneration for 10 seconds. Essential for aggressive playstyles.',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800',
    4.99,
    'rare',
    false,
    '{"effect": "shield_regen", "duration": 10, "amount": 50}'
  ),
  (
    'Urban Ghost Skin',
    'skin',
    'Stealth-focused camouflage suit',
    'Blend into the urban environment with adaptive camouflage technology. Reduces visibility to enemies and muffles footstep sounds. Perfect for stealth players.',
    'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=800',
    14.99,
    'rare',
    false,
    '{"stealth": 40, "soundReduction": 60}'
  ),
  (
    'Velocity Booster',
    'powerup',
    'Temporary speed enhancement',
    'Inject pure adrenaline into your system. Increases movement and reload speed by 35% for 15 seconds. Turn the tide of battle with superior mobility.',
    'https://images.unsplash.com/photo-1551431009-a802eeec77b1?w=800',
    3.99,
    'common',
    false,
    '{"effect": "speed_boost", "duration": 15, "speedIncrease": 35}'
  ),
  (
    'Heavy Assault Pack',
    'bundle',
    'Complete loadout for aggressive players',
    'Dominate the battlefield with overwhelming firepower. Includes Plasma Rifle X-99, Heavy Armor Skin, 10 Frag Grenades, and 5 Shield Regenerators.',
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
    49.99,
    'epic',
    false,
    '{"contents": ["Plasma Rifle X-99", "Heavy Armor Skin", "10x Frag Grenades", "5x Shield Regenerators"]}'
  );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'purchases', 'user_inventory')
ORDER BY table_name;

-- Check sample data
SELECT 
  id,
  name,
  type,
  price,
  rarity,
  is_featured,
  purchase_count
FROM items
ORDER BY is_featured DESC, price DESC;
