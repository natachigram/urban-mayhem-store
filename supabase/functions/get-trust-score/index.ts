// ========================================
// GET TRUST SCORE - Edge Function
// Returns computed trust score for an entity
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const atomId = url.searchParams.get('atom_id');
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');

    let targetAtomId = atomId;

    // If entity_type and entity_id provided, lookup atom
    if (!targetAtomId && entityType && entityId) {
      const { data: atom } = await supabase
        .from('atoms')
        .select('atom_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (atom) {
        targetAtomId = atom.atom_id;
      }
    }

    if (!targetAtomId) {
      throw new Error('atom_id or (entity_type + entity_id) required');
    }

    // Get trust score
    const { data: trustScore, error: scoreError } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('atom_id', targetAtomId)
      .single();

    // Get recent attestations
    const { data: attestations } = await supabase
      .from('attestations')
      .select(
        `
        *,
        predicate:atoms!predicate_atom_id(entity_id, metadata)
      `
      )
      .eq('subject_atom_id', targetAtomId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        atom_id: targetAtomId,
        trust_score: trustScore || {
          score: 0,
          positive_stake: '0',
          negative_stake: '0',
          total_stake: '0',
          attestation_count: 0,
        },
        recent_attestations: attestations || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Trust score error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
