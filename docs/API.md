# API Documentation - Urban Mayhem Store

## 🔌 Backend Endpoints

### Base URL
```
https://[your-project-id].supabase.co/functions/v1
```

---

## 📦 Items API

### GET `/items`
Fetch all store items with optional filtering.

**Query Parameters:**
- `type` (optional): Filter by item type (weapon, skin, bundle, powerup)
- `rarity` (optional): Filter by rarity (common, rare, epic, legendary)
- `sort` (optional): Sort by (price, attestation_score, created_at)
- `limit` (optional): Number of items (default: 20)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Plasma Rifle X",
      "type": "weapon",
      "description": "High-powered energy weapon",
      "imageUrl": "https://...",
      "price": 29.99,
      "rarity": "legendary",
      "attestationScore": 95,
      "creator": {
        "id": "uuid",
        "name": "ArmsDealer",
        "walletAddress": "0x...",
        "avatar": "https://..."
      },
      "intuitionSubjectId": "0x...",
      "stats": {
        "damage": 85,
        "range": 90,
        "fireRate": 75
      },
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 42,
  "page": 1
}
```

---

### GET `/items/:id`
Fetch single item with full details.

**Response:**
```json
{
  "id": "uuid",
  "name": "Plasma Rifle X",
  "type": "weapon",
  "description": "High-powered energy weapon with plasma core technology...",
  "longDescription": "Full markdown description...",
  "imageUrl": "https://...",
  "galleryImages": ["https://...", "https://..."],
  "price": 29.99,
  "rarity": "legendary",
  "attestationScore": 95,
  "attestationCount": 342,
  "purchaseCount": 1205,
  "creator": { ... },
  "intuitionSubjectId": "0x...",
  "stats": { ... },
  "revenueGenerated": 36149.95,
  "createdAt": "2025-01-15T12:00:00Z",
  "updatedAt": "2025-01-20T08:30:00Z"
}
```

---

### POST `/items`
Create new item (creator only, requires authentication).

**Request Body:**
```json
{
  "name": "Neon Tactical Suit",
  "type": "skin",
  "description": "Glowing tactical armor",
  "longDescription": "Markdown content...",
  "imageUrl": "https://...",
  "galleryImages": ["https://..."],
  "price": 19.99,
  "rarity": "epic",
  "stats": {
    "defense": 80,
    "mobility": 70
  }
}
```

**Response:**
```json
{
  "item": { ... },
  "intuitionSubjectId": "0x1234...",
  "message": "Item created and registered on Intuition Protocol"
}
```

**Edge Function Flow:**
1. Validate user authentication
2. Create item in Supabase database
3. Call Intuition SDK to create subject
4. Store Intuition subject ID with item
5. Return item data

---

## ⭐ Attestations API

### POST `/attestations`
Submit player attestation (rating/review) for an item.

**Request Body:**
```json
{
  "itemId": "uuid",
  "rating": 5,
  "comment": "Amazing weapon, highly recommended!",
  "aspects": {
    "quality": 5,
    "value": 4,
    "performance": 5
  }
}
```

**Response:**
```json
{
  "attestation": {
    "id": "uuid",
    "itemId": "uuid",
    "userId": "uuid",
    "rating": 5,
    "comment": "...",
    "intuitionAttestationId": "0x...",
    "createdAt": "2025-01-20T10:15:00Z"
  },
  "updatedScore": 96,
  "message": "Attestation submitted successfully"
}
```

**Edge Function Flow:**
1. Validate user authentication
2. Check if user already attested this item
3. Store attestation in Supabase
4. Create attestation on Intuition Protocol
5. Update cached attestation score
6. Return result

---

### GET `/attestations/:itemId`
Fetch all attestations for an item.

**Query Parameters:**
- `limit` (optional): Number of attestations (default: 10)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "attestations": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Player123",
        "avatar": "https://..."
      },
      "rating": 5,
      "comment": "Amazing weapon!",
      "aspects": { ... },
      "helpful": 45,
      "createdAt": "2025-01-20T10:15:00Z"
    }
  ],
  "total": 342
}
```

---

## 📊 Rankings API

### GET `/rankings`
Fetch item rankings based on attestation scores and other factors.

**Query Parameters:**
- `category` (optional): Filter by category
- `period` (optional): Time period (day, week, month, all)
- `limit` (optional): Number of items (default: 10)

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "item": { ... },
      "score": 97,
      "trend": "up",
      "changeInRank": 2
    }
  ]
}
```

**Ranking Algorithm:**
```typescript
score = (
  attestationScore * 0.5 +
  rarityMultiplier * 0.2 +
  purchaseCount * 0.15 +
  recency * 0.15
)
```

---

## 💰 Revenue API

### GET `/revenue/:creatorId`
Calculate revenue split for a creator.

**Response:**
```json
{
  "creatorId": "uuid",
  "totalRevenue": 125449.85,
  "studioShare": 37634.96,
  "creatorShare": 87814.89,
  "splitRatio": {
    "studio": 30,
    "creator": 70
  },
  "topItems": [
    {
      "itemId": "uuid",
      "name": "Plasma Rifle X",
      "revenue": 36149.95,
      "sales": 1205
    }
  ],
  "period": "all_time"
}
```

---

## 🔐 Authentication

All authenticated endpoints require:

**Header:**
```
Authorization: Bearer [supabase_jwt_token]
```

For wallet-based auth:
```
X-Wallet-Address: 0x...
X-Wallet-Signature: 0x...
```

---

## 🚨 Error Responses

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": { ... }
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

## 🧪 Testing

Use these curl examples:

```bash
# Fetch all items
curl https://[project].supabase.co/functions/v1/items

# Create item
curl -X POST https://[project].supabase.co/functions/v1/items \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","type":"weapon","price":9.99}'

# Submit attestation
curl -X POST https://[project].supabase.co/functions/v1/attestations \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"uuid","rating":5}'
```
