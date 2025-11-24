// ========================================
// URBAN MAYHEM STORE - PROCESS PURCHASE
// Edge Function for handling item purchases
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  item_id: string;
  user_wallet: string;
  quantity: number;
  transaction_hash: string;
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
      item_id,
      user_wallet,
      quantity,
      transaction_hash,
    }: PurchaseRequest = await req.json();

    // Validate input
    if (!item_id || !user_wallet || !quantity || !transaction_hash) {
      throw new Error('Missing required fields');
    }

    // 1. Verify item exists and is available
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', item_id)
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      throw new Error('Item not found or unavailable');
    }

    // Check stock if limited
    if (item.stock_quantity >= 0 && item.stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // 2. Verify transaction hash is unique (prevent double-spend)
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('transaction_hash', transaction_hash)
      .single();

    if (existingPurchase) {
      throw new Error('Transaction already processed');
    }

    // 3. Calculate total amount
    const amount = item.price * quantity;

    // 4. Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        item_id,
        user_wallet,
        amount,
        quantity,
        transaction_hash,
        status: 'completed',
      })
      .select()
      .single();

    if (purchaseError) {
      throw purchaseError;
    }

    // The database trigger will automatically:
    // - Update item purchase_count
    // - Decrease stock_quantity
    // - Add to user_inventory

    // 5. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        purchase,
        message: 'Purchase completed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Purchase error:', error);
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
