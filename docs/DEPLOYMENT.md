# Deployment Guide - Urban Mayhem Store

## 🚀 Quick Start Deployment

### Prerequisites
- Lovable account with project access
- Access to enable Lovable Cloud (for backend)
- Wallet with testnet/mainnet funds (for Intuition Protocol)
- API keys (stored as secrets, not in code)

---

## 📝 Step-by-Step Deployment

### 1. Frontend Deployment (Current State)

The frontend is already deployed automatically via Lovable:

✅ Store page with item cards
✅ Leaderboard page
✅ Servers page
✅ Responsive design system
✅ Dark gaming theme

**To update frontend:**
1. Make changes in Lovable
2. Click "Publish" in top-right
3. Click "Update" in publish dialog
4. Changes go live immediately

---

### 2. Enable Lovable Cloud (Backend)

**Required for:**
- Database (items, creators, attestations)
- Authentication (user accounts, wallets)
- Edge functions (Intuition SDK integration)
- File storage (images, assets)

**Steps:**
1. In Lovable, navigate to project
2. Tell the AI assistant: "Enable Lovable Cloud"
3. Wait for backend provisioning (~2 minutes)
4. Database and auth are now ready

---

### 3. Database Setup

Once Cloud is enabled, run these migrations:

```sql
-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weapon', 'skin', 'bundle', 'powerup')),
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  gallery_images TEXT[],
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  stats JSONB,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  intuition_subject_id TEXT UNIQUE,
  attestation_score INTEGER DEFAULT 0 CHECK (attestation_score >= 0 AND attestation_score <= 100),
  attestation_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create creators table
CREATE TABLE creators (
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

-- Create attestations table
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_score ON items(attestation_score DESC);
CREATE INDEX idx_items_creator ON items(creator_id);
CREATE INDEX idx_attestations_item ON attestations(item_id);
CREATE INDEX idx_attestations_user ON attestations(user_id);
CREATE INDEX idx_purchases_item ON purchases(item_id);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);

-- RLS Policies

-- Items: Public read, authenticated create/update (own items only)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Users can create items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = creator_id);

-- Attestations: Public read, authenticated create (one per user per item)
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attestations are viewable by everyone"
  ON attestations FOR SELECT
  USING (true);

CREATE POLICY "Users can create attestations"
  ON attestations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attestations"
  ON attestations FOR UPDATE
  USING (auth.uid() = user_id);

-- Purchases: Users can view own purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Creators: Public read, users can manage own profile
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own creator profile"
  ON creators FOR ALL
  USING (auth.uid() = id);

-- Functions for automatic updates

-- Update item attestation score on new attestation
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_attestation_created
  AFTER INSERT ON attestations
  FOR EACH ROW
  EXECUTE FUNCTION update_item_attestation_score();

-- Update creator revenue on purchase
CREATE OR REPLACE FUNCTION update_creator_revenue()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creators
  SET 
    total_revenue = total_revenue + (NEW.amount * 0.7),
    updated_at = now()
  WHERE id = (
    SELECT creator_id FROM items WHERE id = NEW.item_id
  );
  
  UPDATE items
  SET 
    purchase_count = purchase_count + 1,
    updated_at = now()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_purchase_created
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_revenue();
```

---

### 4. Add Secrets

Store API keys securely in Lovable Cloud:

**Required secrets:**
- `INTUITION_PRIVATE_KEY`: Your wallet private key for Intuition SDK
- `INTUITION_RPC_URL`: (Optional) Custom RPC endpoint

**How to add:**
1. Tell AI: "Add secrets for INTUITION_PRIVATE_KEY and INTUITION_RPC_URL"
2. Fill in values in the secure form
3. Never commit these to code!

---

### 5. Deploy Edge Functions

The AI will create these functions in `supabase/functions/`:

**Functions to create:**
1. `create-item` - Create item + Intuition subject
2. `attest-item` - Submit player attestation
3. `get-rankings` - Calculate item rankings
4. `revenue-split` - Calculate creator revenue
5. `query-subjects` - Query Intuition subjects

**Deployment:**
Edge functions deploy automatically when you make changes via Lovable.

---

### 6. Seed Initial Data

Add some test items:

```sql
-- Insert test creators
INSERT INTO creators (id, name, wallet_address) VALUES
  (gen_random_uuid(), 'ArmsDealer', '0x1234...'),
  (gen_random_uuid(), 'StyleCraft', '0x5678...');

-- Insert test items
INSERT INTO items (name, type, description, image_url, price, rarity, creator_id, attestation_score) VALUES
  ('Plasma Rifle X', 'weapon', 'High-powered energy weapon', 'https://...', 29.99, 'legendary', 
   (SELECT id FROM creators WHERE name = 'ArmsDealer'), 95),
  ('Neon Tactical Suit', 'skin', 'Glowing tactical armor', 'https://...', 19.99, 'epic',
   (SELECT id FROM creators WHERE name = 'StyleCraft'), 88);
```

---

### 7. Frontend Configuration

Update frontend to use real backend:

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

The environment variables are automatically injected by Lovable Cloud.

---

### 8. Test End-to-End

1. **Create account** - Sign up via wallet
2. **Browse store** - View items
3. **Rate item** - Submit attestation
4. **Check score** - Verify score updates
5. **View leaderboard** - Check rankings

---

## 🔄 CI/CD Pipeline

**Lovable handles this automatically:**

1. Code changes → Committed to GitHub
2. Backend changes → Deployed immediately
3. Frontend changes → Require "Update" button click
4. Database migrations → Run via SQL editor

---

## 🐛 Debugging

**View logs:**
1. Go to Cloud tab in Lovable
2. Navigate to Edge Functions → Logs
3. Filter by function name
4. Check for errors

**Common issues:**
- Missing secrets → Add via secrets management
- RLS policy errors → Check database policies
- Intuition SDK errors → Verify RPC connection
- CORS errors → Check edge function headers

---

## 📊 Monitoring

**Check metrics:**
1. Cloud tab → Analytics
2. View request counts, errors, latency
3. Monitor edge function performance

---

## 🚀 Going to Production

### Checklist:
- [ ] Test all features end-to-end
- [ ] Verify RLS policies are secure
- [ ] Add rate limiting to edge functions
- [ ] Set up custom domain
- [ ] Enable mainnet Intuition Protocol
- [ ] Test wallet connections
- [ ] Optimize image loading
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up backups
- [ ] Load test edge functions

### Performance Optimization:
- Enable Supabase caching
- Use CDN for images
- Implement pagination
- Add loading states
- Optimize queries with indexes

---

## 💡 Tips

1. **Start with testnet** - Test Intuition integration on testnet first
2. **Monitor costs** - Check Lovable Cloud usage regularly
3. **Cache aggressively** - Reduce RPC calls to Intuition
4. **Use real-time** - Subscribe to database changes for live updates
5. **Version control** - Always commit before major changes

---

## 📚 Resources

- [Lovable Docs](https://docs.lovable.dev)
- [Lovable Cloud Guide](https://docs.lovable.dev/features/cloud)
- [Supabase Docs](https://supabase.com/docs)
- [Intuition Protocol](https://docs.intuition.systems)
