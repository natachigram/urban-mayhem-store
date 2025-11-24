// ========================================
// CREATE ATTESTATION - Edge Function
// Allows users to attest about items/players
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface AttestationRequest {
  subject_atom_id: string; // The item/player being attested about
  predicate: string; // 'is great', 'is bad', etc.
  stake_amount: string; // Amount in wei (bigint as string)
  creator_wallet: string;
  transaction_hash: string; // Blockchain tx hash
  triple_id: string; // Intuition triple ID
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      subject_atom_id,
      predicate,
      stake_amount,
      creator_wallet,
      transaction_hash,
      triple_id,
    }: AttestationRequest = await req.json();

    // Validate input
    if (
      !subject_atom_id ||
      !predicate ||
      !stake_amount ||
      !creator_wallet ||
      !triple_id
    ) {
      throw new Error('Missing required fields');
    }

    // Get or verify predicate atom exists
    const { data: predicateAtom, error: predError } = await supabase
      .from('atoms')
      .select('atom_id')
      .eq('entity_type', 'predicate')
      .eq('entity_id', predicate)
      .single();

    if (predError || !predicateAtom) {
      throw new Error('Predicate atom not found. Create it first.');
    }

    // Create attestation record
    const { data: attestation, error: attestError } = await supabase
      .from('attestations')
      .insert({
        triple_id,
        subject_atom_id,
        predicate_atom_id: predicateAtom.atom_id,
        object_atom_id: subject_atom_id, // Self-reference for simple attestations
        stake_amount,
        creator_wallet,
        transaction_hash,
        status: 'active',
      })
      .select()
      .single();

    if (attestError) {
      throw attestError;
    }

    // Trust score will be updated automatically via trigger

    return new Response(
      JSON.stringify({
        success: true,
        attestation,
        message: 'Attestation created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Attestation error:', error);
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
