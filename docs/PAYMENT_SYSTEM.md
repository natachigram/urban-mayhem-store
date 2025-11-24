# 💰 Urban Mayhem Payment System Documentation

## Overview

Complete payment system integrating **Intuition Testnet**, **$TRUST tokens**, and **Supabase** for Urban Mayhem Store.

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │
│  (User clicks   │
│   "Buy")        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  usePayment()   │
│  Hook           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ processPayment()│
│  Service        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Blockchain│Supabase  │
│ Intuition│ Database │
│ Testnet  │          │
└─────────┘ └──────────┘
```

---

## 📋 Setup Requirements

### 1. Environment Variables

Create a `.env` file:

```bash
# Supabase (Get from https://supabase.com/dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Blockchain (Intuition Testnet)
VITE_CHAIN_ID=13579
VITE_RPC_URL=https://testnet.rpc.intuition.systems/http
VITE_STORE_WALLET=0x871e1b7C346EdE7DB53CDeaEE3e86341Cf5ddDd5

# Payment Token (Optional)
VITE_TRUST_TOKEN_ADDRESS=0x... # Your $TRUST ERC20 contract
```

### 2. Database Setup

Run the migrations in Supabase:

```bash
# In your Supabase SQL Editor, run:
supabase/migrations/100_mvp_schema.sql
supabase/migrations/101_payment_system.sql
```

### 3. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy process-purchase
supabase functions deploy verify-payment
supabase functions deploy get-player-inventory
```

---

## 🔄 Payment Flow

### Frontend (React)

```typescript
import { usePayment } from '@/hooks/usePayment';

function BuyButton({ itemId, price }: { itemId: string; price: number }) {
  const { pay, isProcessing } = usePayment();
  const playerId = 'player_12345'; // From your auth system

  const handlePurchase = async () => {
    const result = await pay(
      itemId,
      playerId,
      price,
      1 // quantity
    );

    if (result.success) {
      console.log('Purchase successful!', result.transactionHash);
    }
  };

  return (
    <button onClick={handlePurchase} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : `Buy for ${price} TRUST`}
    </button>
  );
}
```

### Backend Flow

1. **User clicks "Buy"**
2. **Frontend validates:**
   - Wallet connected
   - Correct network (Intuition Testnet)
   - Item available
   - Sufficient balance

3. **Create pending purchase in Supabase:**
```sql
INSERT INTO purchases (item_id, user_wallet, amount, status, metadata)
VALUES ('...', '0x...', 29.99, 'pending', '{"player_id": "player_12345"}')
```

4. **Send blockchain transaction:**
```typescript
// Native ETH or $TRUST token transfer to store wallet
const hash = await walletClient.sendTransaction({
  to: STORE_WALLET,
  value: toTokenUnits(amount),
});
```

5. **Wait for confirmation:**
```typescript
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

6. **Update purchase status:**
```sql
UPDATE purchases 
SET status = 'completed', transaction_hash = '0x...'
WHERE id = '...'
```

7. **Database triggers automatically:**
   - Increment item `purchase_count`
   - Decrease `stock_quantity`
   - Add to `user_inventory`
   - Log verification in `payment_verifications`

---

## 🎮 Unity Integration

### Verify Purchase (from Unity)

```csharp
// C# Example for Unity
public async Task<bool> VerifyPurchase(string playerId, string txHash)
{
    string url = "https://your-project.supabase.co/functions/v1/verify-payment";
    
    var requestData = new {
        player_id = playerId,
        transaction_hash = txHash
    };
    
    var response = await PostJsonAsync(url, requestData);
    
    if (response.success && response.verified)
    {
        Debug.Log($"Purchase verified: {response.purchases.Count} items");
        return true;
    }
    
    return false;
}
```

### Get Player Inventory (from Unity)

```csharp
public async Task<List<InventoryItem>> GetPlayerInventory(string playerId)
{
    string url = "https://your-project.supabase.co/functions/v1/get-player-inventory";
    
    var requestData = new { player_id = playerId };
    
    var response = await PostJsonAsync(url, requestData);
    
    if (response.success)
    {
        return ParseInventory(response.inventory);
    }
    
    return new List<InventoryItem>();
}
```

---

## 📊 Database Schema

### `purchases` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `item_id` | UUID | References `items.id` |
| `user_wallet` | TEXT | Buyer's wallet address |
| `amount` | DECIMAL | Total price paid |
| `quantity` | INTEGER | Number of items |
| `transaction_hash` | TEXT | Blockchain tx hash (unique) |
| `status` | TEXT | `pending`, `completed`, `failed` |
| `metadata` | JSONB | Includes `player_id` |
| `created_at` | TIMESTAMPTZ | Purchase time |

### `user_inventory` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_wallet` | TEXT | Owner's wallet |
| `item_id` | UUID | References `items.id` |
| `quantity` | INTEGER | Stack size |
| `is_equipped` | BOOLEAN | Active in game |
| `metadata` | JSONB | Game-specific data |

### `payment_verifications` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `player_id` | TEXT | Player identifier |
| `transaction_hash` | TEXT | Blockchain tx hash |
| `verification_status` | TEXT | `verified`, `failed` |
| `verified_at` | TIMESTAMPTZ | Verification time |

---

## 🔐 Security Features

1. **Transaction Uniqueness:** `transaction_hash` is unique - prevents double-spending
2. **On-chain Verification:** All payments verified on Intuition Testnet
3. **Player ID Mapping:** Player ID stored in purchase metadata for Unity sync
4. **Row Level Security (RLS):** Supabase policies restrict data access
5. **Service Role:** Backend functions use elevated permissions securely

---

## 🧪 Testing

### Test Payment Flow

1. **Connect wallet** to Intuition Testnet
2. **Get testnet ETH** from faucet (if needed)
3. **Browse store** and click "Buy"
4. **Confirm transaction** in MetaMask
5. **Wait for confirmation** (~3-5 seconds)
6. **Verify purchase** appears in database

### Test Unity Verification

```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify-payment \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"player_id": "player_12345"}'
```

Expected response:
```json
{
  "success": true,
  "verified": true,
  "purchases": [
    {
      "purchase_id": "...",
      "item_name": "Plasma Rifle X-99",
      "quantity": 1,
      "amount": "29.99",
      "transaction_hash": "0x...",
      "status": "completed"
    }
  ]
}
```

---

## 🚨 Error Handling

| Error Code | Description | Solution |
|------------|-------------|----------|
| `NO_WALLET` | Wallet not connected | User must connect wallet |
| `WRONG_NETWORK` | Not on Intuition Testnet | Switch network in wallet |
| `INSUFFICIENT_FUNDS` | Low balance | Add funds to wallet |
| `ITEM_NOT_FOUND` | Invalid item ID | Verify item exists |
| `OUT_OF_STOCK` | Item unavailable | Wait for restock |
| `TX_FAILED` | Transaction reverted | Check gas, retry |
| `AMOUNT_MISMATCH` | Price changed | Refresh page |

---

## 📈 Monitoring

### Key Queries

**Total Revenue:**
```sql
SELECT SUM(amount) as total_revenue
FROM purchases
WHERE status = 'completed';
```

**Player Purchase History:**
```sql
SELECT * FROM verify_payment_by_player('player_12345', NULL);
```

**Top Selling Items:**
```sql
SELECT name, purchase_count, price
FROM items
ORDER BY purchase_count DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Payment stuck in "pending"

Check blockchain explorer for transaction status. If failed, manually update:

```sql
UPDATE purchases 
SET status = 'failed'
WHERE id = '...' AND status = 'pending';
```

### Player ID not found

Ensure player_id is stored in purchase metadata:

```typescript
metadata: {
  player_id: playerId,
  // ... other data
}
```

---

## 📞 Support

- **Blockchain Issues:** Check Intuition Testnet status
- **Database Issues:** Review Supabase logs
- **Edge Functions:** Check function logs in Supabase dashboard

---

## 🎯 Next Steps

1. ✅ Configure `.env` file with your credentials
2. ✅ Run database migrations
3. ✅ Deploy edge functions
4. ✅ Test payment flow on testnet
5. ✅ Integrate with Unity game
6. ✅ Monitor transactions in production
