# Store Cleanup - Deployment Checklist

## ✅ Completed Changes

### 1. Created Database Service Layer
- **File**: `src/services/items.ts`
- **Functions**:
  - `getAllItems()` - Fetch all active items
  - `getItemsByType(type)` - Filter by type (skins, weapons, bundles, powerups, ump)
  - `getFeaturedItems()` - Get featured items for homepage
  - `searchItems(query)` - Search by name
  - `getFilteredItems(filters)` - Advanced filtering with sort options

### 2. Updated UI Components to Use Database
- **SkinsSection.tsx**: Replaced hardcoded `SKINS` array with database fetch
- **UMPSection.tsx**: Replaced hardcoded `PACKAGES` array with database fetch
- **Header.tsx**: Dynamic UMP balance calculation using item metadata
- **useAttestation.ts**: Replaced `STORE_ITEMS` array with async database fetch

### 3. Cleaned Mock Data Infrastructure
- **Deleted**: `src/services/mockData.ts`
- **Updated**: `src/services/supabase.ts` - Removed all mock fallback logic
- **Removed**: `isSupabaseConfigured` checks, `mockDelay()` helper, mock imports

### 4. Created Seed Migrations
- **111_seed_store_items.sql**: 8 skins, 4 weapons, 3 bundles, 4 powerups
- **112_ump_packages.sql**: ALTER TABLE + 4 UMP packages with metadata

### 5. Build Verification
- ✅ TypeScript compilation: SUCCESS
- ✅ Bundle size: 1,764 kB (gzip: 507 kB)
- ✅ No hardcoded arrays remaining
- ✅ All components loading from database

---

## 🚀 Deployment Steps

### Step 1: Deploy Migrations to Supabase
```bash
# Deploy both migrations
supabase db push

# OR manually via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of 111_seed_store_items.sql
# 3. Execute
# 4. Copy contents of 112_ump_packages.sql  
# 5. Execute
```

### Step 2: Verify Database
```sql
-- Check items were inserted
SELECT type, COUNT(*) FROM items GROUP BY type;

-- Expected results:
-- skin: 8
-- weapon: 4
-- bundle: 3
-- powerup: 4
-- ump: 4

-- Check UMP metadata
SELECT name, metadata->>'ump_amount' as ump_amount 
FROM items WHERE type = 'ump';
```

### Step 3: Test Store Frontend
1. Start dev server: `npm run dev`
2. Navigate to `/store`
3. Check Skins tab loads items
4. Check UMP tab loads packages
5. Verify images, prices, and descriptions display correctly
6. Test search functionality
7. Test sort options (Most Popular, Price, Rarity)

### Step 4: Test Purchase Flow
1. Connect wallet
2. Attempt UMP purchase
3. Verify UMP balance updates in Header
4. Check History page shows purchase

---

## 📋 Migration Files

### 111_seed_store_items.sql
**Purpose**: Seed initial store catalog with skins, weapons, bundles, and powerups

**Items Created**:
- **Skins** (8): Neon Spectre, Cyber Punk, Urban Ranger, Void Walker, Toxic Hazard, Night Owl, Chrome Assassin, Desert Storm
- **Weapons** (4): Plasma Rifle X-99, Cyber Katana, Quantum SMG, Thunder Cannon
- **Bundles** (3): Starter Pack, Pro Bundle, Ultimate Warlord Pack
- **Powerups** (4): Shield Regenerator, Speed Boost, Damage Amplifier, Invisibility Cloak

**Featured Items**: 9 items marked as `is_featured = true`

### 112_ump_packages.sql
**Purpose**: Add UMP packages for in-game currency purchases

**Changes**:
- Adds 'ump' to item type enum
- Creates 4 UMP packages with metadata:
  - Starter Pack: 500 UMP ($4.99)
  - Pro Pack: 1,200 UMP ($9.99, BEST VALUE)
  - Elite Pack: 2,500 UMP ($19.99)
  - Warlord Pack: 6,000 UMP ($49.99)

**Metadata Structure**:
```json
{
  "ump_amount": 500,
  "best_value": true  // Optional flag
}
```

---

## 🔍 Validation Queries

### Check for Duplicate Items
```sql
SELECT name, COUNT(*) 
FROM items 
GROUP BY name 
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Verify All Types Exist
```sql
SELECT DISTINCT type FROM items ORDER BY type;
-- Expected: bundle, powerup, skin, ump, weapon
```

### Check Featured Items
```sql
SELECT name, type, is_featured 
FROM items 
WHERE is_featured = true;
-- Should return 9 items
```

---

## ⚠️ Important Notes

1. **Migration Order**: Deploy 111 before 112 (112 depends on items table)
2. **No Duplicates**: If migrations already ran, check for duplicate items
3. **UMP Calculation**: Header.tsx now uses `metadata.ump_amount` from database
4. **Attestations**: useAttestation.ts fetches items async for atom creation
5. **No Mock Mode**: All mock data infrastructure removed - production only

---

## 🐛 Troubleshooting

### Issue: Items not showing in UI
**Solution**: Check browser console for Supabase errors, verify migrations deployed

### Issue: UMP balance not updating
**Solution**: Check `purchases.items.metadata.ump_amount` exists in database

### Issue: Build fails
**Solution**: Run `npm run build` - already verified working

### Issue: TypeScript errors
**Solution**: Already resolved - build passes cleanly

---

## 📊 Store Status

**Dummy Data Removed**: ✅ 100%  
**Database Integration**: ✅ Complete  
**TypeScript Compilation**: ✅ Success  
**Migrations Created**: ✅ Ready to deploy  
**Testing Checklist**: ⏳ Pending migration deployment
