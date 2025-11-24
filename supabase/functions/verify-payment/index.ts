// ========================================
// VERIFY PAYMENT EDGE FUNCTION
// For Unity game to verify purchases by player_id
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-player-id',
};

interface VerifyRequest {
  player_id: string;
  transaction_hash?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { player_id, transaction_hash }: VerifyRequest = await req.json();

    if (!player_id) {
      throw new Error('player_id is required');
    }

    // Use database function to verify payment
    const { data, error } = await supabase.rpc('verify_payment_by_player', {
      p_player_id: player_id,
      p_transaction_hash: transaction_hash || null,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: data && data.length > 0,
        purchases: data || [],
        message:
          data && data.length > 0
            ? `Found ${data.length} purchase(s)`
            : 'No purchases found',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        purchases: [],
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
