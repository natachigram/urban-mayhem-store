# Urban Mayhem Store - Architecture & Integration Guide

## 📁 Project Structure

```
urban-mayhem-store/
├── src/
│   ├── components/
│   │   ├── ui/               # Shadcn UI components
│   │   ├── Header.tsx         # Main navigation header
│   │   └── store/
│   │       ├── ItemCard.tsx   # Store item display card
│   │       ├── StoreTabs.tsx  # Category tabs (Featured, Bundles, etc.)
│   │       └── HeroSection.tsx # Hero banner
│   ├── pages/
│   │   ├── Store.tsx          # Main store page
│   │   ├── Leaderboard.tsx    # Creator leaderboard
│   │   └── Servers.tsx        # Game servers list
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks (to be added)
│   │   ├── useIntuition.ts    # Intuition SDK integration
│   │   ├── useItems.ts        # Item fetching logic
│   │   └── useAttestations.ts # Attestation queries
│   ├── services/              # API services (to be added)
│   │   ├── supabase.ts        # Supabase client setup
│   │   └── intuition.ts       # Intuition protocol wrapper
│   └── types/                 # TypeScript types
│       ├── item.ts            # Item, Creator types
│       └── attestation.ts     # Attestation types
├── supabase/                  # Backend (when enabled)
│   ├── functions/             # Edge functions
│   │   ├── create-item/       # Create item + Intuition subject
│   │   ├── attest-item/       # Submit attestation
│   │   ├── get-rankings/      # Calculate rankings
│   │   └── revenue-split/     # Revenue calculation
│   └── migrations/            # Database migrations
└── docs/                      # Documentation
    ├── API.md                 # API endpoints
    ├── INTUITION.md           # Intuition integration
    └── DEPLOYMENT.md          # Deployment guide
```

## 🎨 Design System

**Theme**: Dark cyberpunk gaming aesthetic
- **Primary Color**: Electric Purple (hsl(262 83% 58%))
- **Accent**: Bright Purple (hsl(270 95% 65%))
- **Background**: Deep Space Black (hsl(222 47% 5%))
- **Typography**: Bold, modern, gaming-focused

**Key Features**:
- Gradient backgrounds for hero sections
- Glow effects on interactive elements
- Rarity-based color coding (common, rare, epic, legendary)
- Smooth transitions and hover states

## 🔧 Current Implementation

### Frontend (Completed)
✅ Store page with item cards and tabs
✅ Item card component with attestation scores
✅ Leaderboard for top creators
✅ Servers list page
✅ Responsive header with wallet connect
✅ Dark theme design system
✅ Rarity badge system

### Backend (To Implement)
🔲 Supabase database schema
🔲 Edge functions for Intuition integration
🔲 Attestation submission endpoints
🔲 Revenue split calculation
🔲 Item ranking algorithm

## 📊 Data Flow

```
User Action → Frontend → Edge Function → Supabase Database
                              ↓
                         Intuition Protocol
                              ↓
                    (Create Subject/Attestation)
                              ↓
                         Cache Result
                              ↓
                    Update UI Optimistically
```

## 🚀 Next Steps

1. **Enable Lovable Cloud** for backend functionality
2. **Implement database schema** for items, creators, attestations
3. **Create edge functions** for Intuition SDK integration
4. **Add authentication** for user attestations
5. **Implement item detail page** with attestation UI
6. **Add revenue dashboard** for creators

## 🔐 Security Considerations

- API keys stored in Supabase secrets (not in code)
- Wallet authentication required for purchases
- Attestation validation on backend
- Rate limiting on edge functions
- RLS policies for data access

## 📈 Scalability Plan

- Use Supabase for horizontal scaling
- Cache attestation scores for performance
- Optimize image delivery via CDN
- Implement pagination for large datasets
- Use real-time subscriptions for live updates
