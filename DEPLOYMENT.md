# 🚀 Urban Mayhem Store - Production Deployment Guide

This guide walks you through deploying the Urban Mayhem Store MVP to production.

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] $TRUST token contract deployed
- [ ] WalletConnect Project ID obtained
- [ ] Custom domain ready (optional)

---

## 1️⃣ Supabase Setup

### Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - Name: `urban-mayhem-store`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
4. Wait for project to be ready (~2 minutes)

### Run Database Migration

1. Open SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/100_mvp_schema.sql`
3. Paste and click "Run"
4. Verify success: Check "Table Editor" for `items`, `purchases`, `user_inventory`

### Configure RLS Policies

Already included in migration, but verify:

```sql
-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Should see policies for items, purchases, and user_inventory.

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy process-purchase
supabase functions deploy sync-inventory

# Verify deployment
supabase functions list
```

### Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → Store securely (only for backend)

---

## 2️⃣ WalletConnect Setup

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create account and sign in
3. Click "Create New Project"
4. Name: "Urban Mayhem Store"
5. Copy `Project ID` → `VITE_WALLETCONNECT_PROJECT_ID`

---

## 3️⃣ Frontend Deployment (Vercel)

### Option A: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables (see below)
7. Click "Deploy"

### Option B: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Follow prompts to add environment variables
```

### Environment Variables (Vercel)

In Vercel project settings → Environment Variables, add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
VITE_TRUST_TOKEN_ADDRESS=0x... # Your ERC-20 token contract
```

**Important**: These must start with `VITE_` to be exposed to the client.

---

## 4️⃣ Custom Domain (Optional)

### Vercel

1. Project Settings → Domains
2. Add your domain (e.g., `store.urbanmayhem.io`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (~5 minutes)

### DNS Records

Add these to your DNS provider:

```
Type: CNAME
Name: store (or @)
Value: cname.vercel-dns.com
```

---

## 5️⃣ Testing Production

### Smoke Tests

1. **Visit store** → Items load correctly
2. **Connect wallet** → RainbowKit modal works
3. **Add to cart** → Cart updates
4. **Checkout** → Payment flow initiates
5. **Complete purchase** → Transaction succeeds
6. **Check inventory** → Item appears in Supabase

### Test Purchase Flow (Testnet)

```bash
# First deploy to testnet (e.g., Sepolia)
# 1. Get testnet $TRUST tokens
# 2. Connect wallet to testnet
# 3. Make test purchase
# 4. Verify in Supabase
# 5. Test Unity sync endpoint
```

### Unity Integration Test

```bash
# Test inventory sync
curl -X GET \
  'https://your-project.supabase.co/functions/v1/sync-inventory' \
  -H 'x-wallet-address: 0x...' \
  -H 'apikey: your-anon-key'

# Expected: JSON with items array
```

---

## 6️⃣ Monitoring Setup

### Supabase Monitoring

1. Dashboard → Database → Usage
   - Monitor query performance
   - Check connection pool

2. Edge Functions → Logs
   - Watch for errors
   - Monitor execution time

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Track:
   - Page views
   - Unique visitors
   - Geographic distribution

### Custom Metrics

Track in your app:
```typescript
// Example: Track wallet connections
const trackWalletConnect = (address: string) => {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'wallet_connected',
      wallet: address,
      timestamp: new Date().toISOString()
    })
  });
};
```

---

## 7️⃣ Security Hardening

### CORS Configuration

In Supabase Edge Functions, verify CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://store.urbanmayhem.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Rate Limiting

Consider adding Cloudflare in front of Vercel:
- DDoS protection
- Rate limiting
- WAF rules

### Environment Variables

Never commit:
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ Private keys
- ❌ API secrets

Only expose client-safe vars (prefixed with `VITE_`):
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_WALLETCONNECT_PROJECT_ID`

---

## 8️⃣ Post-Launch Monitoring

### First 24 Hours

Monitor closely:
- [ ] Error rates in Supabase logs
- [ ] Failed transactions
- [ ] 404 errors (Vercel)
- [ ] Wallet connection issues
- [ ] Purchase success rate

### Week 1 Metrics

Track:
- Daily active users
- Wallet connection rate
- Cart abandonment rate
- Purchase completion rate
- Unity sync requests
- Average transaction value

### Health Checks

Create simple uptime monitor:

```bash
# Ping store homepage
curl -f https://store.urbanmayhem.io

# Test API health
curl -f https://your-project.supabase.co/rest/v1/items?limit=1

# Test edge function
curl -X POST https://your-project.supabase.co/functions/v1/sync-inventory \
  -H 'x-wallet-address: 0x...' \
  -H 'apikey: ...'
```

Use services like:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

---

## 9️⃣ Rollback Plan

If critical issues arise:

### Quick Rollback

```bash
# Vercel: Instant rollback to previous deployment
vercel rollback

# Or via dashboard: Deployments → Previous → Promote
```

### Database Rollback

```sql
-- If migration causes issues, revert to backup
-- Always backup before major changes!

-- Disable RLS temporarily
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- Re-enable after fix
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
```

### Edge Function Rollback

```bash
# Deploy previous version
supabase functions deploy process-purchase --version previous
```

---

## 🔟 Maintenance Mode

If you need to take store offline:

### Create Maintenance Page

```typescript
// src/pages/Maintenance.tsx
export const Maintenance = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Under Maintenance</h1>
      <p>We'll be back soon! Check Discord for updates.</p>
    </div>
  </div>
);

// Update App.tsx to show maintenance mode
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE === 'true';
```

Set environment variable:
```bash
VITE_MAINTENANCE=true
```

---

## ✅ Go-Live Checklist

- [ ] Database seeded with real items
- [ ] All environment variables set
- [ ] Edge functions deployed and tested
- [ ] Testnet purchases successful
- [ ] Unity integration confirmed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring tools active
- [ ] Team notified of launch
- [ ] Support channels ready
- [ ] Social media announcement prepared
- [ ] Documentation links updated

---

## 📞 Support Contacts

If deployment issues arise:

- **Supabase**: support@supabase.io
- **Vercel**: vercel.com/support
- **WalletConnect**: support@walletconnect.com

---

## 🎉 Post-Launch

After successful deployment:

1. **Announce** on social media
2. **Monitor** first transactions closely
3. **Gather feedback** from early users
4. **Document** any issues and resolutions
5. **Iterate** based on user behavior

---

**Good luck with your launch! 🚀**
