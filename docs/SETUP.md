# 🚀 Payment System Setup Guide

## Quick Start (5 Minutes)

### Step 1: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

Required variables:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_TRUST_TOKEN_ADDRESS=0x... # Optional: ERC20 token address
```

### Step 2: Setup Supabase Database

1. Go to https://supabase.com/dashboard
2. Create a new project (or use existing)
3. Navigate to **SQL Editor**
4. Run migrations in order:

```sql
-- Run this first
-- File: supabase/migrations/100_mvp_schema.sql
-- Copy and paste the entire file content

-- Then run this
-- File: supabase/migrations/101_payment_system.sql
-- Copy and paste the entire file content
```

### Step 3: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy process-purchase
supabase functions deploy verify-payment  
supabase functions deploy get-player-inventory
```

### Step 4: Test the System

```bash
# Start dev server
npm run dev

# Open http://localhost:5173
# Connect wallet
# Try making a purchase!
```

---

## 📝 Detailed Configuration

### Getting Supabase Credentials

1. **Project URL & Keys:**
   - Dashboard → Settings → API
   - Copy `URL` to `VITE_SUPABASE_URL`
   - Copy `anon public` to `VITE_SUPABASE_ANON_KEY`
   - Copy `service_role` to `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep secret!**

2. **Project Reference:**
   - Dashboard → Settings → General
   - Copy `Reference ID` for CLI linking

### Setting Up Payment Token

**Option A: Use Native ETH (Testnet)**
- Leave `VITE_TRUST_TOKEN_ADDRESS` empty
- Payments will use native testnet ETH

**Option B: Use Custom $TRUST Token**
1. Deploy ERC20 token contract to Intuition Testnet
2. Set `VITE_TRUST_TOKEN_ADDRESS` to contract address
3. Ensure users have token balance

---

## 🧪 Testing Checklist

### Frontend Tests

- [ ] Wallet connects to Intuition Testnet
- [ ] Balance displays correctly
- [ ] Buy button triggers payment modal
- [ ] Transaction sent to blockchain
- [ ] Confirmation toast appears
- [ ] Purchase recorded in Supabase
- [ ] Inventory updated automatically

### Backend Tests

```bash
# Test verify-payment endpoint
curl -X POST https://your-project.supabase.co/functions/v1/verify-payment \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"player_id": "test_player_123"}'

# Test get-inventory endpoint
curl -X POST https://your-project.supabase.co/functions/v1/get-player-inventory \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"player_id": "test_player_123"}'
```

### Unity Tests

1. Implement `UrbanMayhemAPI.cs` in Unity
2. Call `VerifyPurchase("test_player_123")`
3. Verify response contains purchases
4. Call `GetInventory("test_player_123")`
5. Verify items appear in response

---

## 🔧 Troubleshooting

### "Wallet not connecting"

```bash
# Check network in wallet
- Switch to Intuition Testnet
- Chain ID: 13579
- RPC: https://testnet.rpc.intuition.systems/http
```

### "Transaction fails"

- Check wallet has funds
- Verify contract address (if using token)
- Check gas settings
- Look at browser console for errors

### "Purchase not appearing in database"

```sql
-- Check purchases table
SELECT * FROM purchases 
WHERE user_wallet = '0xYourWallet' 
ORDER BY created_at DESC;

-- Check if transaction hash recorded
SELECT * FROM purchases 
WHERE transaction_hash = '0xYourTxHash';
```

### "Edge function errors"

```bash
# View function logs
supabase functions logs verify-payment

# Test locally
supabase functions serve verify-payment
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file**
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Protect Service Role Key**
   - Only use in backend/edge functions
   - Never expose to frontend
   - Rotate if compromised

3. **Validate All Inputs**
   - Check item prices match
   - Verify transaction on-chain
   - Prevent duplicate purchases

4. **Monitor Transactions**
   ```sql
   -- Check for suspicious activity
   SELECT user_wallet, COUNT(*) as purchase_count
   FROM purchases
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY user_wallet
   HAVING COUNT(*) > 10;
   ```

---

## 📊 Database Queries

### Get Total Revenue

```sql
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as total_sales
FROM purchases 
WHERE status = 'completed';
```

### Top Customers

```sql
SELECT 
  user_wallet,
  metadata->>'player_id' as player_id,
  COUNT(*) as purchases,
  SUM(amount) as total_spent
FROM purchases
WHERE status = 'completed'
GROUP BY user_wallet, metadata->>'player_id'
ORDER BY total_spent DESC
LIMIT 10;
```

### Popular Items

```sql
SELECT 
  i.name,
  i.type,
  COUNT(p.id) as times_purchased,
  SUM(p.amount) as revenue
FROM purchases p
JOIN items i ON i.id = p.item_id
WHERE p.status = 'completed'
GROUP BY i.id, i.name, i.type
ORDER BY times_purchased DESC;
```

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Migrations fail | Check syntax, run one at a time |
| Functions won't deploy | Verify `supabase link` successful |
| RPC errors | Check `.env` file configuration |
| Unity can't connect | Verify API URL and key |

### Getting Help

1. Check `docs/PAYMENT_SYSTEM.md` for full documentation
2. Review `docs/PAYMENT_INTEGRATION_EXAMPLE.md` for code examples
3. Check Supabase logs for backend errors
4. Review browser console for frontend errors

---

## ✅ Production Deployment

### Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed and tested
- [ ] Payment flow tested end-to-end
- [ ] Unity integration working
- [ ] Error handling implemented
- [ ] Logging and monitoring configured
- [ ] Security audit completed
- [ ] Backup strategy in place

### Launch Steps

1. Update `.env` with production credentials
2. Deploy frontend: `npm run build`
3. Verify edge functions are live
4. Monitor first transactions closely
5. Set up alerting for failures

---

## 🎯 Next Steps

After setup is complete:

1. **Customize UI:** Update buy buttons and payment modals
2. **Add Features:** Implement wishlist, cart, bundles
3. **Unity SDK:** Complete C# integration
4. **Analytics:** Track conversion rates
5. **Optimization:** Improve transaction speed
6. **Security:** Regular audits and updates

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Viem Documentation](https://viem.sh)
- [Intuition Protocol](https://intuition.systems)
- [RainbowKit Docs](https://rainbowkit.com)
