# URBAN MAYHEM - UNITY INTEGRATION SPECIFICATION
## Battle Royale Trust System Architecture

**Date:** November 25, 2025  
**Status:** PRE-DEVELOPMENT PLANNING  
**Game Type:** Real-time Battle Royale (4-player rooms, last man standing)

---

## 📋 GAME MECHANICS (CONFIRMED)

### Current Flow
```
Player Login (Username) 
    ↓
Lobby Screen
    ↓
Create/Join Room (4 players max)
    ↓
Waiting Room (until 4 players)
    ↓
Match Start (Clock runs)
    ↓
Battle Royale (Real-time, autonomous)
    ↓
Last Man Standing Wins
    ↓
Match End → Backend Receives: { username, kills, deaths }
```

### Player Identity
- **Primary Key:** Username (unique, cannot be shared)
- **No Wallet Yet:** Players don't connect wallets to play
- **Unity Sends:** Username, ability data, profile

### Match Data (Post-Game)
- **Kills:** Number of eliminations
- **Deaths:** Number of times eliminated
- **Winner:** Last player standing
- **Sent To:** Backend (already exists?)

---

## 🎯 WHAT WE'RE BUILDING

### The Trust Layer
Transform Urban Mayhem into a **self-regulating reputation economy** where:
1. Player behavior affects matchmaking
2. Trust scores influence loot drops
3. Cross-game reputation (future)
4. Intuition Protocol provides decentralized proof

---

## 🏗️ PROPOSED ARCHITECTURE

### Phase 1: Foundation (Week 1)
**Backend APIs that Unity will call**

#### 1. Player Registration
**Endpoint:** `POST /unity/player-register`

**When Called:** First time player opens game

**Unity Sends:**
```json
{
  "username": "player_123",
  "device_id": "abc-def-123",  // For duplicate account detection
  "platform": "iOS",           // iOS/Android
  "game_version": "1.0.0"
}
```

**Backend Does:**
- Creates player record in database
- Generates custodial wallet (hidden from player initially)
- Creates Intuition player atom
- Initializes trust score = 50 (neutral)
- Returns player profile

**Backend Returns:**
```json
{
  "username": "player_123",
  "player_id": "uuid-here",
  "trust_score": 50,
  "trust_tier": "MEDIUM",
  "matches_played": 0,
  "wallet_address": "0xABC...",  // Custodial wallet
  "is_new_player": true
}
```

**Why:** Every player becomes an Intuition subject automatically. No web3 friction.

---

#### 2. Match Result Submission
**Endpoint:** `POST /unity/match-result`

**When Called:** Immediately after match ends

**Unity Sends:**
```json
{
  "match_id": "match_uuid_123",
  "room_id": "room_456",
  "duration_seconds": 180,
  "players": [
    {
      "username": "player_123",
      "kills": 3,
      "deaths": 1,
      "placement": 1,        // 1 = winner, 4 = first eliminated
      "damage_dealt": 1500,
      "damage_taken": 800,
      "abilities_used": 12
    },
    {
      "username": "player_456",
      "kills": 2,
      "deaths": 1,
      "placement": 2,
      "damage_dealt": 1200,
      "damage_taken": 1500,
      "abilities_used": 8
    },
    // ... 2 more players
  ]
}
```

**Backend Does:**
- Stores match results
- Calculates performance metrics
- Updates player statistics
- Triggers loot calculation
- Returns rewards for each player

**Backend Returns:**
```json
{
  "match_recorded": true,
  "players": [
    {
      "username": "player_123",
      "loot_dropped": true,
      "loot": {
        "item_id": "legendary_sword",
        "name": "Void Blade",
        "rarity": "legendary"
      },
      "trust_score_change": +2,
      "new_trust_score": 52
    },
    // ... other players
  ]
}
```

**Why:** Single API call handles match recording, loot drops, and trust updates.

---

#### 3. Player Profile Query
**Endpoint:** `GET /unity/player-profile?username={username}`

**When Called:** 
- Lobby screen (show player stats)
- Room creation (show room host stats)
- Match loading screen (show opponent stats)

**Backend Returns:**
```json
{
  "username": "player_123",
  "trust_score": 52,
  "trust_tier": "MEDIUM",
  "matches_played": 15,
  "wins": 3,
  "total_kills": 42,
  "total_deaths": 12,
  "kd_ratio": 3.5,
  "win_rate": 20.0,
  "recent_behavior": "positive",  // positive, neutral, negative
  "badges": ["Veteran", "Sharpshooter"],
  "created_at": "2025-11-01T12:00:00Z"
}
```

**Why:** Unity can display player reputation without blockchain calls.

---

#### 4. Player Attestation (Post-Match Rating)
**Endpoint:** `POST /unity/attest-player`

**When Called:** Optional post-match screen (mobile-friendly)

**Unity Sends:**
```json
{
  "attester_username": "player_123",
  "target_username": "player_456",
  "match_id": "match_uuid_123",
  "attestation_type": "positive",  // positive, negative
  "reason": "good_sport",          // good_sport, skilled, toxic, afk, cheating
  "comment": ""                    // Optional, max 100 chars
}
```

**Backend Does:**
- Validates both players were in same match
- Prevents duplicate attestations (one per player per match)
- Creates Intuition attestation triple
- Updates target's trust score
- Records in database

**Backend Returns:**
```json
{
  "success": true,
  "target_trust_score_change": +5,
  "target_new_trust_score": 78,
  "message": "Your feedback helps improve matchmaking!"
}
```

**Why:** Mobile-friendly = single tap (thumbs up/down). Optional, not forced.

---

#### 5. Matchmaking Queue (Future)
**Endpoint:** `POST /unity/match-queue`

**When Called:** Player clicks "Find Match"

**Unity Sends:**
```json
{
  "username": "player_123",
  "mode": "ranked",  // ranked, casual
  "region": "US-WEST"
}
```

**Backend Returns:**
```json
{
  "queue_id": "queue_123",
  "trust_tier": "MEDIUM",
  "estimated_wait_seconds": 30,
  "can_match_with_tiers": ["HIGH", "MEDIUM"],
  "queue_position": 5
}
```

**Why:** Trust-based matchmaking. High-trust players get priority.

---

## 🎮 UNITY CLIENT CHANGES NEEDED

### Minimal Integration (MVP)

#### 1. **Startup: Register Player**
```csharp
// GameManager.cs - OnApplicationStart()
async void Start() {
    string username = PlayerPrefs.GetString("username");
    var profile = await IntuitionAPI.RegisterPlayer(username, SystemInfo.deviceUniqueIdentifier);
    
    PlayerData.trustScore = profile.trust_score;
    PlayerData.trustTier = profile.trust_tier;
    PlayerData.playerId = profile.player_id;
}
```

#### 2. **Post-Match: Send Results**
```csharp
// MatchManager.cs - OnMatchEnd()
void OnMatchEnd() {
    MatchResult result = new MatchResult {
        match_id = currentMatchId,
        room_id = currentRoomId,
        duration_seconds = matchTimer,
        players = GetAllPlayerStats()
    };
    
    var response = await IntuitionAPI.SubmitMatchResult(result);
    
    // Show loot screen if player got drops
    if (response.loot_dropped) {
        ShowLootScreen(response.loot);
    }
}
```

#### 3. **Lobby: Show Player Stats (Optional)**
```csharp
// LobbyUI.cs - OnPlayerJoinRoom()
async void OnPlayerJoin(string username) {
    var profile = await IntuitionAPI.GetPlayerProfile(username);
    
    // Show trust badge next to username
    playerCard.SetTrustBadge(profile.trust_tier);
    playerCard.SetStats(profile.matches_played, profile.win_rate);
}
```

#### 4. **Post-Match: Rate Players (Optional)**
```csharp
// PostMatchUI.cs - Show feedback screen
void ShowFeedbackScreen() {
    foreach (var player in matchPlayers) {
        // Simple thumbs up/down UI
        Button thumbsUp = CreateThumbsUpButton(player.username);
        Button thumbsDown = CreateThumbsDownButton(player.username);
        
        thumbsUp.onClick.AddListener(() => {
            IntuitionAPI.AttestPlayer(myUsername, player.username, matchId, "positive", "good_sport");
        });
    }
}
```

---

## 🗄️ DATABASE SCHEMA ADDITIONS

### New Table: `players`
```sql
CREATE TABLE players (
  player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE,           -- Custodial wallet
  device_id TEXT,                       -- For duplicate detection
  platform TEXT,                        -- iOS/Android
  
  -- Stats
  trust_score INTEGER DEFAULT 50,
  trust_tier TEXT DEFAULT 'MEDIUM',
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  
  -- Intuition
  intuition_subject_id TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  last_played_at TIMESTAMPTZ,
  
  -- Indices
  CONSTRAINT valid_trust_score CHECK (trust_score >= 0 AND trust_score <= 100)
);

CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_trust_score ON players(trust_score DESC);
CREATE INDEX idx_players_wallet ON players(wallet_address);
```

### New Table: `matches`
```sql
CREATE TABLE matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT,
  duration_seconds INTEGER,
  winner_username TEXT,
  mode TEXT DEFAULT 'casual',           -- casual, ranked
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Table: `match_participants`
```sql
CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(match_id),
  player_id UUID REFERENCES players(player_id),
  username TEXT,
  
  -- Performance
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  placement INTEGER,                    -- 1-4 (1 = winner)
  damage_dealt INTEGER DEFAULT 0,
  damage_taken INTEGER DEFAULT 0,
  abilities_used INTEGER DEFAULT 0,
  
  -- Rewards
  loot_dropped BOOLEAN DEFAULT false,
  loot_item_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_player ON match_participants(player_id);
```

### New Table: `player_attestations`
```sql
CREATE TABLE player_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attester_username TEXT NOT NULL,
  target_username TEXT NOT NULL,
  match_id UUID REFERENCES matches(match_id),
  
  attestation_type TEXT NOT NULL,       -- positive, negative
  reason TEXT,                          -- good_sport, skilled, toxic, afk, cheating
  comment TEXT,
  
  intuition_triple_id TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate attestations per match
  UNIQUE(attester_username, target_username, match_id)
);

CREATE INDEX idx_player_attestations_target ON player_attestations(target_username);
CREATE INDEX idx_player_attestations_type ON player_attestations(attestation_type);
```

### New View: `player_reputation_summary`
```sql
CREATE VIEW player_reputation_summary AS
SELECT 
  p.username,
  p.trust_score,
  p.trust_tier,
  COUNT(pa.id) FILTER (WHERE pa.attestation_type = 'positive') as positive_attestations,
  COUNT(pa.id) FILTER (WHERE pa.attestation_type = 'negative') as negative_attestations,
  p.matches_played,
  p.wins,
  ROUND((p.wins::DECIMAL / NULLIF(p.matches_played, 0)) * 100, 1) as win_rate_percent,
  ROUND(p.total_kills::DECIMAL / NULLIF(p.total_deaths, 0), 2) as kd_ratio
FROM players p
LEFT JOIN player_attestations pa ON pa.target_username = p.username
GROUP BY p.username, p.trust_score, p.trust_tier, p.matches_played, p.wins, p.total_kills, p.total_deaths;
```

---

## 🧮 TRUST SCORE ALGORITHM

### Calculation Formula
```typescript
trustScore = baseScore + behaviorModifier + performanceModifier + longevityBonus

Where:
  baseScore = 50 (starting point)
  
  behaviorModifier = 
    (positiveAttestations * 5) - (negativeAttestations * 10)
    
  performanceModifier = 
    (wins * 2) + (kd_ratio * 1) - (toxicReports * 15)
    
  longevityBonus = 
    min(matchesPlayed * 0.1, 10)  // Max +10 for veteran players
    
  finalScore = clamp(trustScore, 0, 100)
```

### Trust Tiers
```
HIGH (80-100):   ⭐ Priority matchmaking, +15% loot bonus
MEDIUM (50-79):  ✓  Normal matchmaking, +5% loot bonus
LOW (20-49):     ⚠️  Slower matchmaking, -5% loot penalty
TOXIC (0-19):    🚫 Isolated queue, -15% loot penalty, review flagged
```

### Tier Effects
| Tier | Queue Priority | Loot Modifier | Match With |
|------|---------------|---------------|------------|
| HIGH | Instant | +15% | HIGH, MEDIUM |
| MEDIUM | Normal (30s) | +5% | HIGH, MEDIUM, LOW |
| LOW | Slow (60s+) | -5% | MEDIUM, LOW |
| TOXIC | Very Slow (5min+) | -15% | TOXIC only |

---

## 🎁 LOOT SYSTEM DESIGN

### Base Drop Rates (Per Match)
```
Victory:  25% base rate
Top 2:    15% base rate  
Top 3:    10% base rate
4th Place: 5% base rate
```

### Trust Score Modifiers
```typescript
function calculateLootDropRate(placement: number, trustScore: number): number {
  const baseRate = {
    1: 25,  // Winner
    2: 15,
    3: 10,
    4: 5
  }[placement] || 5;
  
  // Trust bonus: -15% to +15%
  const trustBonus = (trustScore - 50) * 0.3;
  
  // Performance bonus: good KD ratio
  const kdBonus = kdRatio > 2 ? 5 : 0;
  
  const finalRate = baseRate + trustBonus + kdBonus;
  
  return Math.max(1, Math.min(50, finalRate)); // Clamp 1-50%
}
```

### Loot Tiers
```
Common:     60% of drops
Rare:       25% of drops
Epic:       12% of drops
Legendary:   3% of drops
```

### Example Calculation
```
Player A (Winner, Trust: 85, KD: 3.5):
  Base: 25%
  Trust Bonus: +10.5%
  KD Bonus: +5%
  Final: 40.5% chance to get loot
  
Player B (4th place, Trust: 30, KD: 0.8):
  Base: 5%
  Trust Penalty: -6%
  KD Bonus: 0%
  Final: 1% chance to get loot (minimum)
```

---

## 📱 MOBILE UX CONSIDERATIONS

### Post-Match Attestation UI
**Problem:** Can't have long surveys on mobile

**Solution:** Single-tap feedback
```
┌─────────────────────────────────┐
│     Match Complete!             │
│                                 │
│  How were your teammates?       │
│                                 │
│  player_456    👍  👎           │
│  player_789    👍  👎           │
│  player_012    👍  👎           │
│                                 │
│  [Skip] [Submit]                │
└─────────────────────────────────┘
```

**Optional:** Tap thumbs down opens quick-select:
```
Why? (Optional)
○ Toxic behavior
○ AFK / Left match  
○ Suspected cheating
○ Poor teamwork
```

### Trust Badge Display
**In Lobby:**
```
player_123  ⭐ (85)
player_456  ✓  (62)
player_789  ⚠️  (35)
```

**Small, non-intrusive**

---

## 🔐 ANTI-CHEAT INTEGRATION

### Detection Methods

#### 1. **Server-Side Validation**
```typescript
// Backend validates match results
function validateMatchResults(match: MatchResult): boolean {
  // Impossible KD ratios
  if (kills > 10 && deaths === 0) return false;
  
  // Damage too high
  if (damage_dealt > 5000) return false;
  
  // Match duration invalid
  if (duration < 60) return false;
  
  return true;
}
```

**If validation fails:** 
- Flag match for review
- Don't give loot
- Don't update trust score
- Log incident

#### 2. **Statistical Analysis**
```sql
-- Flag players with suspicious patterns
SELECT username, AVG(kills), AVG(damage_dealt)
FROM match_participants
GROUP BY username
HAVING AVG(kills) > 8 AND AVG(damage_dealt) > 3000;
```

#### 3. **Community Reports**
- Negative attestations with "cheating" reason
- If player gets 3+ "cheating" reports in 24 hours:
  - Automatic trust score → 0 (TOXIC tier)
  - Flag account for manual review
  - Temp ban from ranked mode

#### 4. **Trust Score as Anti-Cheat**
- Cheaters get reported → Low trust score
- Low trust = Bad matchmaking + No loot
- Self-reinforcing: Cheaters quit or reform

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: MVP (Week 1) ✅
**Goal:** Basic integration working

- [ ] Create database tables
- [ ] Build 3 core endpoints:
  - `POST /unity/player-register`
  - `POST /unity/match-result`
  - `GET /unity/player-profile`
- [ ] Unity integration (minimal):
  - Register player on startup
  - Send match results on game end
- [ ] Basic trust score calculation
- [ ] Basic loot drops (no trust modifier yet)

**Success Metric:** Match data flows from Unity → Backend → Database

---

### Phase 2: Trust System (Week 2)
**Goal:** Reputation affects rewards

- [ ] Player attestation endpoint
- [ ] Trust score algorithm implementation
- [ ] Loot drop rate modifiers based on trust
- [ ] Unity UI: Show trust badges in lobby
- [ ] Unity UI: Post-match feedback (thumbs up/down)

**Success Metric:** High-trust players get better loot drops

---

### Phase 3: Matchmaking (Week 3)
**Goal:** Trust affects who you play with

- [ ] Matchmaking queue endpoint
- [ ] Trust tier logic
- [ ] Queue priority system
- [ ] Unity integration: Trust-based room creation
- [ ] Leaderboard UI (web + Unity)

**Success Metric:** Toxic players isolated in separate matches

---

### Phase 4: Polish (Week 4)
**Goal:** Production-ready

- [ ] Anti-cheat validation
- [ ] Statistical anomaly detection
- [ ] Admin dashboard (manual review)
- [ ] Unity SDK documentation
- [ ] C# wrapper library
- [ ] Demo video for Intuition grant

**Success Metric:** Shippable product for grant application

---

## 📊 DATA I NEED FROM YOU

### Immediate Questions:

1. **Backend Endpoint (Current)**
   - Where does Unity currently send match results?
   - What's the format of the current payload?
   - Is there authentication? (API key, JWT?)

2. **Player Data**
   - How is `username` created? (random, player chooses, auto-generated?)
   - Can usernames change?
   - Do you store any player data now?

3. **Match Recording**
   - Do you currently save match history?
   - Where? (Firebase, your own server, nowhere?)
   - Can I see the current data structure?

4. **Wallet Strategy**
   - Should we create custodial wallets automatically?
   - Or require players to connect their own wallets?
   - When should wallet connection happen? (onboarding, first purchase, optional?)

5. **Loot Items**
   - Do loot items exist already?
   - Are they in the `items` table?
   - How does Unity know what loot to give? (item_id lookup?)

6. **Unity Networking**
   - What backend are you using? (Photon, Unity Gaming Services, custom?)
   - REST API or WebSocket?
   - Can Unity make async HTTP calls during match? (or only at start/end?)

7. **Mobile Performance**
   - Any latency concerns?
   - Should we cache data locally in Unity?
   - Offline play support needed?

8. **Testing**
   - Can you build a test version of Unity?
   - Do you have a dev server?
   - How do I test Unity → Backend flow?

---

## 🎯 DELIVERABLES

### For You (Unity Dev)
1. ✅ API Endpoint Documentation (this spec)
2. ✅ C# Integration Examples (pseudocode above)
3. ⏳ Full SDK (after Phase 1 works)

### For Me (Backend Dev)
1. Unity sends correct payload format
2. Test credentials for Unity API
3. Sample match data (5-10 matches)
4. Feedback on UX flow

### For Intuition Grant
1. Working demo video
2. Documentation showing Intuition integration
3. Metrics: X players, Y attestations, Z trust scores calculated
4. Proof of cross-game potential (architecture supports any Unity game)

---

## ❓ DECISIONS NEEDED BEFORE CODING

### Critical Decisions:

**1. Wallet Strategy**
- Option A: Auto-create custodial wallets (easier, no web3 friction)
- Option B: Require wallet connection (more decentralized, harder UX)
- **Recommendation:** Option A for MVP, add Option B later

**2. Attestation Trigger**
- Option A: Forced post-match screen (more data, intrusive)
- Option B: Optional button (less data, better UX)
- Option C: Auto-attest based on performance (no user input needed)
- **Recommendation:** Option B for mobile (single tap)

**3. Trust Score Visibility**
- Option A: Always visible (transparency, potential toxicity)
- Option B: Hidden until post-match (less pressure)
- Option C: Only show tier, not number (badges only)
- **Recommendation:** Option C (show ⭐/✓/⚠️ badges, not raw numbers)

**4. Anti-Cheat Severity**
- Option A: Instant ban on 3 reports (harsh, fast)
- Option B: Trust score penalty only (softer, slower)
- Option C: Manual review required (slow, accurate)
- **Recommendation:** Option B with Option C for repeated offenders

---

## 🎬 NEXT STEPS

**What I'll do once you answer questions:**

1. Create database migration (`110_unity_backend.sql`)
2. Build 3 MVP endpoints (player-register, match-result, player-profile)
3. Write Unity C# integration guide with exact code
4. Set up test environment
5. Deploy to Supabase staging
6. Test with curl
7. Hand off to you for Unity testing

**What you'll do:**

1. Answer the "Data I Need" questions above
2. Show me current Unity → Backend flow (if exists)
3. Integrate 3 API calls into Unity
4. Test with 5-10 matches
5. Give feedback on UX/performance

**Timeline:**
- Day 1-2: Backend development (me)
- Day 3-4: Unity integration (you)
- Day 5: Testing + iteration
- Week 2: Phase 2 features

---

## 📞 WHAT I NEED FROM YOU NOW

**Please provide:**

1. ✅ Answers to "Data I Need" section (8 questions)
2. ✅ Current Unity backend endpoint (if exists)
3. ✅ Sample match result payload (what Unity sends now)
4. ✅ Username generation method
5. ✅ Decision on 4 critical decisions above
6. ✅ Access to test Unity build (or video of match flow)

**Once I have these, I can start building immediately.**

---

**Ready to build the future of gaming reputation? Answer the questions above and I'll start coding.** 🚀
