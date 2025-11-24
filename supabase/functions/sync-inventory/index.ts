// ========================================
// URBAN MAYHEM STORE - INVENTORY SYNC
// Edge Function for Unity game inventory sync
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-wallet-address',
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

    // Get wallet address from header (sent by Unity client)
    const walletAddress = req.headers.get('x-wallet-address');

    if (!walletAddress) {
      throw new Error('Wallet address required');
    }

    // Fetch user inventory with item details
    const { data: inventory, error } = await supabase
      .from('user_inventory')
      .select(
        `
        id,
        item_id,
        quantity,
        is_equipped,
        metadata,
        acquired_at,
        item:items (
          id,
          name,
          type,
          image_url,
          rarity,
          stats,
          metadata
        )
      `
      )
      .eq('user_wallet', walletAddress)
      .order('acquired_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Return inventory in Unity-friendly format
    return new Response(
      JSON.stringify({
        success: true,
        wallet: walletAddress,
        items: inventory,
        last_sync: new Date().toISOString(),
        count: inventory.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Inventory sync error:', error);
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
