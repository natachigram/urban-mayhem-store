# Intuition Attestation System - Setup Guide

## 🚀 Quick Start

### 1. Initialize Item Atoms

Before users can rate items, you need to create Intuition atoms for all store items:

```bash
# Set your private key (wallet with $TRUST for gas)
export INIT_WALLET_PRIVATE_KEY="0xYourPrivateKey"

# Run the initialization script
npm run init-atoms
```

This will:
- Create atoms for all UMP packages (pkg_1, pkg_2, etc.)
- Create atoms for all skins (skin_1, skin_2, etc.)
- Create predicate atoms (is great, is bad, is overpriced, etc.)
- Cache everything in Supabase for fast lookups

### 2. Test the Attestation Flow

1. **Connect Wallet** → Intuition Testnet (Chain ID 13579)
2. **Browse Store** → You'll see trust score badges on items
3. **View Item** → Click any item to see detailed trust score
4. **Rate Item** → Click "Rate" button, select rating, stake $TRUST
5. **See Results** → Trust score updates automatically

---

## 📦 What's Been Integrated

### Components Updated:
- ✅ `ItemCard.tsx` - Now shows `TrustScoreBadge` (compact)
- ✅ `SkinDetailModal.tsx` - Shows full trust score + Rate button
- ✅ New `TrustScoreBadge.tsx` - Displays community ratings
- ✅ New `RateItemModal.tsx` - UI for creating attestations

### Features Added:
- ✅ Real-time trust scores (0-100%)
- ✅ Positive/negative stake display
- ✅ Attestation count
- ✅ 5 rating types:
  - 👍 **is great** - Positive endorsement
  - ⭐ **is high quality** - Quality rating
  - 💲 **is fair price** - Value endorsement
  - ⚠️ **is overpriced** - Price criticism
  - 👎 **is bad** - Negative rating

---

## 🎯 How to Use Attestations

### For Players:

```typescript
// 1. View item → See trust score badge
<TrustScoreBadge itemId="skin_3" variant="compact" />

// 2. Click "Rate" button → Opens modal
<RateItemModal 
  itemId="skin_3" 
  itemName="Neon Tactical Suit"
  open={true}
/>

// 3. Select rating + stake amount
// 4. Confirm transaction
// 5. Trust score updates automatically
```

### For Developers:

```typescript
import { useAttestation } from '@/hooks/useAttestation';

function MyComponent() {
  const { attestItem, getTrustScore } = useAttestation();
  
  // Create attestation
  const result = await attestItem({
    itemId: 'skin_3',
    predicate: 'IS_GREAT',
    stakeAmount: BigInt(0.05 * 10 ** 18) // 0.05 $TRUST
  });
  
  // Fetch trust score
  const score = await getTrustScore('skin_3');
  console.log(score); 
  // { score: 85, positiveStake: 5n, negativeStake: 1n, attestationCount: 6 }
}
```

---

## 🗄️ Database Structure

### `atoms` table
Caches Intuition atoms for fast lookups:
```sql
SELECT * FROM atoms WHERE entity_type = 'item' AND entity_id = 'pkg_1';
```

### `attestations` table
Stores all attestations (triples):
```sql
SELECT * FROM attestations WHERE subject_atom_id = '0x123...';
```

### `trust_scores` table
Pre-computed scores (updated via trigger):
```sql
SELECT * FROM trust_scores WHERE atom_id = '0x123...';
```

---

## 🔧 Troubleshooting

### Atoms not showing up?
```bash
# Check if atoms were created
psql $DATABASE_URL -c "SELECT entity_id, atom_id FROM atoms WHERE entity_type = 'item';"

# Re-run initialization
npm run init-atoms
```

### Trust scores not updating?
- Check database trigger is active
- Verify attestations are being created
- Look for errors in Supabase logs

### Rate button not working?
- Ensure wallet is connected
- Check you have $TRUST for gas + stake
- Verify you're on Intuition Testnet (13579)

---

## 📊 Monitoring

Check attestation activity:
```sql
-- Most rated items
SELECT 
  a.entity_id,
  a.metadata->>'name' as name,
  ts.score,
  ts.attestation_count
FROM atoms a
JOIN trust_scores ts ON a.atom_id = ts.atom_id
WHERE a.entity_type = 'item'
ORDER BY ts.attestation_count DESC;

-- Recent attestations
SELECT 
  att.created_at,
  subj.metadata->>'name' as item,
  pred.entity_id as rating,
  att.stake_amount,
  att.creator_wallet
FROM attestations att
JOIN atoms subj ON att.subject_atom_id = subj.atom_id
JOIN atoms pred ON att.predicate_atom_id = pred.atom_id
ORDER BY att.created_at DESC
LIMIT 10;
```

---

## 🚧 Next Steps

1. **Player Atoms** - Create atoms when players make first purchase
2. **Store Sorting** - Sort items by trust score
3. **Trending Items** - Show most-attested items
4. **Attestation History** - Per-user attestation tracking
5. **Rewards** - Distribute fees to early attestors

---

## 🔗 Resources

- [Intuition SDK Docs](https://www.docs.intuition.systems/docs/developer-tools/sdks/overview)
- [Primitives Guide](https://www.docs.intuition.systems/docs/primitives/overview)
- [Full Integration Docs](./INTUITION_INTEGRATION.md)
