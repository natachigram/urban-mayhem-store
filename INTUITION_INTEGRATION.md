# Urban Mayhem Store - Intuition Protocol Integration

## 🎯 Project Status: Phase 1 Complete ✅

This is the **Urban Mayhem Trust Network** - the first trust-powered mobile gaming ecosystem built on Intuition Protocol.

---

## ✅ COMPLETED FEATURES

### **Phase 1: Core Store & Payments**
- ✅ React + Vite + TypeScript frontend
- ✅ Wallet connection (RainbowKit + Wagmi)
- ✅ Native $TRUST payment system on Intuition Testnet
- ✅ Player ID integration (for Unity game sync)
- ✅ Purchase history by wallet address
- ✅ Real-time balance updates (UMP + $TRUST)
- ✅ Admin dashboard (sales analytics)
- ✅ Supabase database with RLS policies

### **Phase 1: Intuition Protocol Integration** ⭐ NEW
- ✅ Intuition SDK installed (`@0xintuition/sdk` + `@0xintuition/protocol`)
- ✅ **Atoms system**: Items and players as Intuition subjects
- ✅ **Triples system**: Community attestations (claims)
- ✅ **Signals system**: $TRUST staking on claims
- ✅ Database schema: `atoms`, `attestations`, `trust_scores` tables
- ✅ Edge Functions: `create-attestation`, `get-trust-score`
- ✅ Service layer: `src/services/intuition.ts`
- ✅ React hook: `useAttestation` for attestation creation
- ✅ UI Components: `TrustScoreBadge`, `RateItemModal`
- ✅ Automatic trust score calculation via database triggers

---

## 🔥 INTUITION FEATURES EXPLAINED

### **What is Intuition Protocol?**
Intuition is a decentralized knowledge graph built on **Atoms**, **Triples**, and **Signals**:

1. **Atoms** = Universal identifiers (items, players, concepts)
2. **Triples** = Relationships/claims (Subject-Predicate-Object)
3. **Signals** = Trust weight through $TRUST staking

### **How It Works in Urban Mayhem:**

#### **1. Item Atoms**
Every store item (UMP package, skin) becomes an **Atom** on Intuition:
```typescript
// Example: "Neon Tactical Suit" skin
Atom ID: 0x123...
Entity Type: item
Entity ID: skin_3
Metadata: { name, description, image, price }
```

#### **2. Community Attestations (Triples)**
Players can create **attestations** about items by staking $TRUST:
```
[Neon Tactical Suit] — [is great] — [Neon Tactical Suit]
Stake: 0.05 $TRUST
```

Available predicates:
- ✅ `is great` - Positive endorsement
- ✅ `is high quality` - Quality attestation
- ✅ `is fair price` - Value endorsement
- ⚠️ `is overpriced` - Price criticism
- ❌ `is bad` - Negative rating

#### **3. Trust Scores**
Trust scores are calculated automatically:
```
Trust Score = (Positive Stake / Total Stake) * 100
```

Example:
- Positive stake: 5 $TRUST (from "is great" attestations)
- Negative stake: 1 $TRUST (from "is bad" attestations)
- Trust Score: (5 / 6) * 100 = **83% Trust**

---

## 🛠️ TECHNICAL ARCHITECTURE

### **Frontend** (`src/`)
```
components/
  ├── store/
  │   ├── TrustScoreBadge.tsx    # Display community ratings
  │   ├── RateItemModal.tsx      # Attestation creation UI
  │   ├── ItemCard.tsx
  │   └── SkinDetailModal.tsx
  
hooks/
  ├── useAttestation.ts          # Attestation creation logic
  ├── usePayment.ts              # Payment processing
  └── useCart.ts
  
services/
  ├── intuition.ts               # Intuition SDK integration
  ├── payment.ts                 # Blockchain payments
  └── supabase.ts
```

### **Backend** (`supabase/`)
```
migrations/
  ├── 106_intuition_schema.sql   # Atoms, attestations, trust_scores tables
  
functions/
  ├── create-attestation/        # Process attestations
  ├── get-trust-score/           # Fetch computed trust scores
  ├── process-purchase/
  └── get-player-inventory/
```

### **Database Schema**
```sql
atoms
├── atom_id (Intuition atom ID)
├── entity_type (item | player | predicate)
├── entity_id (item_id, wallet, or text)
├── atom_uri (IPFS URI)
└── metadata (JSON)

attestations
├── triple_id (Intuition triple ID)
├── subject_atom_id (what is being attested)
├── predicate_atom_id (the claim type)
├── object_atom_id (context)
├── stake_amount (bigint as string)
└── creator_wallet

trust_scores
├── atom_id
├── score (0-100 percentage)
├── positive_stake
├── negative_stake
└── attestation_count
```

---

## 🚀 USAGE GUIDE

### **For Players:**

1. **Connect Wallet** → Intuition Testnet (Chain ID: 13579)
2. **Browse Store** → See trust scores on items
3. **Purchase Items** → Pay with $TRUST
4. **Rate Items** → Click "Rate" button, stake $TRUST on your opinion

### **For Developers:**

#### **Creating an Attestation:**
```typescript
import { useAttestation } from '@/hooks/useAttestation';

const { attestItem } = useAttestation();

await attestItem({
  itemId: 'skin_3',
  predicate: 'IS_GREAT',
  stakeAmount: BigInt(0.05 * 10 ** 18) // 0.05 $TRUST
});
```

#### **Fetching Trust Score:**
```typescript
import { calculateTrustScore } from '@/services/intuition';

const score = await calculateTrustScore(atomId);
// Returns: { score, positiveStake, negativeStake, attestationCount }
```

#### **Creating Item Atom:**
```typescript
import { createItemAtom } from '@/services/intuition';

const atom = await createItemAtom(clients, {
  id: 'skin_3',
  name: 'Neon Tactical Suit',
  description: 'Glowing tactical armor',
  imageUrl: 'https://...',
  type: 'skin'
});
```

---

## 📋 PENDING FEATURES (Next Phases)

### **Phase 2: Player Trust System**
- ❌ Create player atoms on first purchase
- ❌ Player-to-player attestations ("good teammate", "toxic", etc.)
- ❌ Display player trust scores in matchmaking
- ❌ Trust-weighted matchmaking queues

### **Phase 3: Smart Contracts**
- ❌ `TrustScoreRegistry.sol` - Aggregate trust scores on-chain
- ❌ `PlayerSubjectFactory.sol` - Player atom creation
- ❌ `ItemSubjectFactory.sol` - Item atom creation

### **Phase 4: Advanced Features**
- ❌ Trust-influenced loot drops
- ❌ Anti-cheat attestations
- ❌ Skill rating claims
- ❌ Store ranking by trust score

### **Phase 5: Unity SDK**
- ❌ C# scripts (`IntuitionManager.cs`, `TrustScoreClient.cs`)
- ❌ Prefabs for Unity UI
- ❌ Demo scene

---

## 🌐 DEPLOYMENT

### **Networks**
- **Intuition Testnet**: Chain ID 13579
- **RPC**: https://testnet.rpc.intuition.systems/http
- **Explorer**: https://testnet.explorer.intuition.systems/

### **Store Wallet**
```
0x871e1b7C346EdE7DB53CDeaEE3e86341Cf5ddDd5
```

### **Environment Variables**
```bash
# Supabase
VITE_SUPABASE_URL=https://kxltwbzkldztokoxakef.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Blockchain
VITE_CHAIN_ID=13579
VITE_RPC_URL=https://testnet.rpc.intuition.systems/http
VITE_STORE_WALLET=0x871e1b7C346EdE7DB53CDeaEE3e86341Cf5ddDd5

# Token (native $TRUST - leave empty)
VITE_TRUST_TOKEN_ADDRESS=
```

---

## 📚 RESOURCES

- [Intuition Docs](https://www.docs.intuition.systems/)
- [Intuition SDK](https://www.docs.intuition.systems/docs/developer-tools/sdks/overview)
- [Intuition Primitives](https://www.docs.intuition.systems/docs/primitives/overview)
- [Supabase Docs](https://supabase.com/docs)
- [Wagmi Docs](https://wagmi.sh/)

---

## 🏆 BUILDER PROGRAM ALIGNMENT

This project aligns with Intuition's Builder Program goals:

✅ **Real consumer application** (not backend utility)  
✅ **Gaming category** (new to Intuition ecosystem)  
✅ **Live attestation system** (real-time trust signals)  
✅ **Economic incentives** (staking + rewards)  
✅ **Reusable infrastructure** (Unity SDK for other games)  

---

## 🤝 CONTRIBUTING

This is an open-source project building the trust layer for Web3 gaming. Contributions welcome!

**Priority Areas:**
1. Player attestation UI
2. Trust-weighted matchmaking
3. Smart contract integration
4. Unity SDK development

---

## 📄 LICENSE

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Intuition Protocol ecosystem**
