# Intuition Protocol Integration Guide

## 🧠 Overview

The Intuition Protocol enables decentralized attestations and reputation systems. In Urban Mayhem, we use it to:
- Register items and creators as "subjects"
- Allow players to attest (rate/verify) items
- Calculate reputation scores based on attestations
- Ensure transparent and tamper-proof ratings

---

## 📚 Key Concepts

### Subjects
Entities that can be attested to:
- **Item Subjects**: Each store item (weapon, skin, etc.)
- **Creator Subjects**: Each content creator

### Attestations
Claims or ratings about subjects:
- Player ratings for items
- Creator reputation scores
- Quality verification

### Triples
Relationships between subjects:
```
Subject → Predicate → Object
Item    → rated_as   → 5_stars
Creator → created    → Item
```

---

## 🔧 SDK Integration

### Installation
```bash
npm install @intuitionprotocol/sdk
```

### Initialize Client (Edge Function)

```typescript
// supabase/functions/_shared/intuition-client.ts
import { IntuitionClient } from '@intuitionprotocol/sdk';

export const getIntuitionClient = () => {
  const privateKey = Deno.env.get('INTUITION_PRIVATE_KEY');
  const rpcUrl = Deno.env.get('INTUITION_RPC_URL') || 'https://mainnet.intuition.systems';
  
  return new IntuitionClient({
    privateKey,
    rpcUrl,
    chainId: 1, // Mainnet
  });
};
```

**Required Secrets (in Supabase):**
- `INTUITION_PRIVATE_KEY`: Your wallet private key
- `INTUITION_RPC_URL`: RPC endpoint (optional)

---

## 🛠️ Edge Function Examples

### 1. Create Item Subject

```typescript
// supabase/functions/create-item/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { getIntuitionClient } from '../_shared/intuition-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    // Parse request body
    const { name, type, description, imageUrl, price, rarity, stats } = await req.json();

    // Validate input
    if (!name || !type || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create item in Supabase
    const { data: item, error: dbError } = await supabase
      .from('items')
      .insert({
        name,
        type,
        description,
        image_url: imageUrl,
        price,
        rarity,
        stats,
        creator_id: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Create subject on Intuition Protocol
    const intuitionClient = getIntuitionClient();
    
    const subjectData = {
      name: item.name,
      description: item.description,
      metadata: {
        type: item.type,
        rarity: item.rarity,
        price: item.price,
        imageUrl: item.image_url,
        gameId: 'urban-mayhem',
      },
    };

    const subjectTx = await intuitionClient.createSubject(subjectData);
    const receipt = await subjectTx.wait();
    const subjectId = receipt.events.find(e => e.event === 'SubjectCreated')?.args.subjectId;

    // 3. Store Intuition subject ID
    await supabase
      .from('items')
      .update({ intuition_subject_id: subjectId })
      .eq('id', item.id);

    // 4. Create creator subject if needed
    const { data: creator } = await supabase
      .from('creators')
      .select('intuition_subject_id')
      .eq('id', user.id)
      .single();

    if (!creator?.intuition_subject_id) {
      const creatorSubjectTx = await intuitionClient.createSubject({
        name: user.user_metadata?.name || 'Anonymous Creator',
        description: `Game creator on Urban Mayhem`,
        metadata: {
          userId: user.id,
          type: 'creator',
        },
      });
      const creatorReceipt = await creatorSubjectTx.wait();
      const creatorSubjectId = creatorReceipt.events.find(e => e.event === 'SubjectCreated')?.args.subjectId;

      await supabase
        .from('creators')
        .update({ intuition_subject_id: creatorSubjectId })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({
        item: { ...item, intuition_subject_id: subjectId },
        message: 'Item created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating item:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### 2. Submit Attestation

```typescript
// supabase/functions/attest-item/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { getIntuitionClient } from '../_shared/intuition-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { itemId, rating, comment, aspects } = await req.json();

    // Validate input
    if (!itemId || !rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already attested
    const { data: existing } = await supabase
      .from('attestations')
      .select('id')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'You have already rated this item' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get item's Intuition subject ID
    const { data: item } = await supabase
      .from('items')
      .select('intuition_subject_id')
      .eq('id', itemId)
      .single();

    if (!item?.intuition_subject_id) {
      throw new Error('Item not registered on Intuition Protocol');
    }

    // 1. Store attestation in Supabase
    const { data: attestation, error: dbError } = await supabase
      .from('attestations')
      .insert({
        item_id: itemId,
        user_id: user.id,
        rating,
        comment,
        aspects,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Create attestation on Intuition Protocol
    const intuitionClient = getIntuitionClient();
    
    const attestationTx = await intuitionClient.createAttestation({
      subjectId: item.intuition_subject_id,
      predicate: 'rated_as',
      object: `${rating}_stars`,
      metadata: {
        comment,
        aspects,
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    });

    const receipt = await attestationTx.wait();
    const attestationId = receipt.events.find(e => e.event === 'AttestationCreated')?.args.attestationId;

    // 3. Update attestation with Intuition ID
    await supabase
      .from('attestations')
      .update({ intuition_attestation_id: attestationId })
      .eq('id', attestation.id);

    // 4. Recalculate item's attestation score
    const { data: allAttestations } = await supabase
      .from('attestations')
      .select('rating')
      .eq('item_id', itemId);

    const avgRating = allAttestations
      ? allAttestations.reduce((sum, a) => sum + a.rating, 0) / allAttestations.length
      : rating;

    const attestationScore = Math.round((avgRating / 5) * 100);

    await supabase
      .from('items')
      .update({ attestation_score: attestationScore })
      .eq('id', itemId);

    return new Response(
      JSON.stringify({
        attestation: { ...attestation, intuition_attestation_id: attestationId },
        updatedScore: attestationScore,
        message: 'Attestation submitted successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting attestation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### 3. Query Subjects

```typescript
// supabase/functions/query-subjects/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getIntuitionClient } from '../_shared/intuition-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get('subjectId');

    if (!subjectId) {
      return new Response(
        JSON.stringify({ error: 'Missing subjectId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const intuitionClient = getIntuitionClient();
    
    // Get subject details
    const subject = await intuitionClient.getSubject(subjectId);
    
    // Get all attestations for this subject
    const attestations = await intuitionClient.getAttestations({
      subjectId,
      limit: 100,
    });

    // Calculate reputation score
    const positiveAttestations = attestations.filter(a => 
      a.predicate === 'rated_as' && parseInt(a.object) >= 4
    ).length;

    const reputationScore = attestations.length > 0
      ? (positiveAttestations / attestations.length) * 100
      : 0;

    return new Response(
      JSON.stringify({
        subject,
        attestations: attestations.length,
        reputationScore: Math.round(reputationScore),
        details: attestations.slice(0, 10), // Recent attestations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error querying subject:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 📊 Database Schema

```sql
-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  rarity TEXT NOT NULL,
  stats JSONB,
  creator_id UUID REFERENCES auth.users(id),
  intuition_subject_id TEXT UNIQUE,
  attestation_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Creators table
CREATE TABLE creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  wallet_address TEXT UNIQUE,
  intuition_subject_id TEXT UNIQUE,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attestations table
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  aspects JSONB,
  intuition_attestation_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_score ON items(attestation_score DESC);
CREATE INDEX idx_attestations_item ON attestations(item_id);
```

---

## 🎯 Frontend Integration

```typescript
// src/hooks/useAttestItem.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

export const useAttestItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      rating, 
      comment 
    }: { 
      itemId: string; 
      rating: number; 
      comment?: string; 
    }) => {
      const { data, error } = await supabase.functions.invoke('attest-item', {
        body: { itemId, rating, comment },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Rating submitted! New score: ${data.updatedScore}`);
      queryClient.invalidateQueries({ queryKey: ['item', data.attestation.item_id] });
      queryClient.invalidateQueries({ queryKey: ['attestations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit rating: ${error.message}`);
    },
  });
};
```

---

## 🔒 Security Best Practices

1. **Never expose private keys in frontend code**
2. **Use Supabase RLS policies** for data access control
3. **Validate all inputs** in edge functions
4. **Rate limit attestation submissions** to prevent spam
5. **Verify wallet signatures** for creator actions
6. **Cache Intuition queries** to reduce RPC calls

---

## 🧪 Testing

Test on Intuition testnet first:
```typescript
const client = new IntuitionClient({
  privateKey: testnetPrivateKey,
  rpcUrl: 'https://testnet.intuition.systems',
  chainId: 5, // Goerli testnet
});
```

---

## 📚 Resources

- [Intuition Protocol Docs](https://docs.intuition.systems)
- [Intuition SDK GitHub](https://github.com/intuition-protocol/sdk)
- [Example Implementations](https://github.com/intuition-protocol/examples)
