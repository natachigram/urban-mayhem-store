// ========================================
// GET PLAYER INVENTORY EDGE FUNCTION
// For Unity game to sync player items
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-player-id',
};

interface InventoryRequest {
  player_id: string;
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

    const { player_id }: InventoryRequest = await req.json();

    if (!player_id) {
      throw new Error('player_id is required');
    }

    // Use database function to get inventory
    const { data, error } = await supabase.rpc('get_player_inventory', {
      p_player_id: player_id,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        inventory: data || [],
        count: data?.length || 0,
        message: `Found ${data?.length || 0} item(s)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Inventory error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        inventory: [],
        count: 0,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
