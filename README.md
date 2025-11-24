URBAN MAYHEM INTUITION INTEGRATION PROJECT SPECIFICATION
1. PROJECT OVERVIEW
Project Name:
Urban Mayhem Trust Network
Goal:
Integrate Intuition Protocol into Urban Mayhem to create the first trust-powered mobile gaming ecosystem. This includes:
Player identity on Intuition
Trust weighted matchmaking
Trust powered item store
Trust influenced loot system
A Unity SDK for other games


This will serve as both a showcase and a production-ready foundation that qualifies for Intuition’s Builder Program grants.
2. WHY WE ARE BUILDING THIS (CORE PURPOSE)
Intuition is a decentralized knowledge graph built on claims and attestations. They want real consumer apps, not small backend utilities. By embedding Intuition into a mobile multiplayer game, we:
Prove Intuition works in real-time consumer environments
Bring a new category to the ecosystem: gaming
Create a trust system that affects gameplay and game economy
Allow other Unity games to adopt the same trust layer
This directly aligns with Intuition’s long term vision.
3. SYSTEM SUMMARY (HIGH LEVEL)
Urban Mayhem will use Intuition to power:
1. Player Reputation Identity
Each player becomes a subject on Intuition containing:
skill claims
win/lose history
behavior ratings
anti cheat proofs
social trust from other players
2. Trust Score Contract
A smart contract reads Intuition attestations and calculates a single trust score.
3. Matchmaking Engine
Players with low trust get matched together. High trust players have priority queues.
4. Trust Based Item Store
Items, skins, powerups and creators get ratings from the community. Store ranking uses trust data.
5. Trust Weighted Loot Drops
Loot probability changes based on:
player trust
community attestation of item rarity
fair play behavior
6. Unity SDK Package
A Unity tool for any developer to:
create player subjects
write claims
read trust scores
integrate trust into gameplay
4. FULL TECHNICAL ARCHITECTURE
4.1 Components
Unity Mobile Game
C sharp logic


Player data manager


Network system from your current setup


Integration with your backend API


Backend Service (Node or Go recommended)


Auth


Player wallet binding


Calls Intuition SDK


Writes claims and attestations


Reads trust scores from smart contract


Sends results to Unity client


Smart Contracts (Solidity)


TrustScoreRegistry


PlayerSubjectCreator


ItemSubjectCreator


Optional anti cheat attestation verifier


Intuition Protocol SDK layer


Write: claims, attestations, relationships


Read: subject data


Query: graph relationships


Postgres/MongoDB


Player account table


Cached trust scores for faster matchmaking


Cache attestation data


Unity SDK for external developers


C sharp wrapper around your backend endpoints


Prefabs for UI
Simple demo scene
4.2 Data Flow: Onboarding
Player logs in to Urban Mayhem


Backend creates or retrieves wallet


Backend creates Intuition subject


Unity stores subject reference
Player enters game
4.3 Data Flow: Matchmaking
Player presses “Play”


Backend fetches trust score from contract


Backend assigns queue tier
Matchmaking groups similar trust tiers
4.4 Data Flow: Attestation Writing
Players write attestations about:
other players (good teammate, toxic, fair player)
items (good skin, bad skin, overpriced, well designed)
4.5 Data Flow: Store Ranking
Player opens store


Backend queries Intuition for item claims


Contract calculates final trust for each item


Items sorted by trust



4.6 Data Flow: Loot Drops
Player wins or finishes match


Backend retrieves trust score


Loot table algorithm adjusts drop rate
Player receives loot
5. SMART CONTRACT SPECIFICATION
TrustScoreRegistry.sol
Responsibilities:
read player related claims from Intuition


aggregate trust score
expose getTrustScore(address)


PlayerSubjectFactory.sol
Responsibilities:
create player subjects
store mapping of wallet -> subjectID


ItemSubjectFactory.sol
Responsibilities:
create item subjects


attach metadata
store mapping itemID -> subjectID


6. UNITY CLIENT TASKS
Required Screens
Trust verification popup


Player reputation view


Store item reputation scores
Loot drop animation using trust score


Unity Actions
send match queue request


send attestation actions


display trust-based ranking
show other players trust score
7. BACKEND TASKS
Endpoints
POST /player/register


GET /player/trustscore


POST /attest/player


POST /attest/item


GET /store/list


POST /loot/redeem
8. UNITY SDK PACKAGE CONTENTS
C sharp scripts for:


IntuitionManager.cs


TrustScoreClient.cs


AttestationClient.cs


Prefabs:


TrustBadge


ReputationPanel


TrustBasedStore


Demo scene showing trust score affecting gameplay.

