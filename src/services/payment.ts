/**
 * Payment Service
 * Handles blockchain payments and Supabase transaction recording
 */

import { type Address, type Hash } from 'viem';
import {
  getWalletClient,
  publicClient,
  STORE_WALLET,
  ERC20_ABI,
  toTokenUnits,
  verifyTransaction,
  checkNetwork,
  switchToIntuitionNetwork,
} from '@/lib/blockchain';
import { supabase } from './supabase';

export interface PaymentRequest {
  itemId: string;
  playerId: string; // Unique player identifier
  userWallet: Address;
  amount: number; // Amount in $TRUST tokens
  quantity: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionHash?: Hash;
  purchaseId?: string;
  error?: string;
  message: string;
}

/**
 * Process a payment transaction
 * 1. Verify network
 * 2. Send tokens to store wallet
 * 3. Record transaction in Supabase
 * 4. Verify on-chain
 */
export const processPayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    // Step 1: Verify network
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToIntuitionNetwork();
      if (!switched) {
        return {
          success: false,
          message: 'Please switch to Intuition Testnet',
          error: 'WRONG_NETWORK',
        };
      }
    }

    // Step 2: Get wallet client
    const walletClient = await getWalletClient();
    const [account] = await walletClient.getAddresses();

    if (account.toLowerCase() !== request.userWallet.toLowerCase()) {
      return {
        success: false,
        message: 'Wallet address mismatch',
        error: 'WALLET_MISMATCH',
      };
    }

    // Step 3: Use provided amount (skip database lookup for now since using mock data)
    const totalAmount = request.amount;

    // For production: Add item validation here
    // const { data: item, error: itemError } = await supabase
    //   .from('items')
    //   .select('*')
    //   .eq('id', request.itemId)
    //   .eq('is_active', true)
    //   .single();

    // Step 5: Create pending purchase record
    // Use generic placeholder UUIDs for mock items
    const placeholderItemId = request.itemId.startsWith('skin_')
      ? '00000000-0000-0000-0000-000000000002' // Skins placeholder
      : '00000000-0000-0000-0000-000000000001'; // UMP packages placeholder

    const { data: pendingPurchase, error: pendingError } = await supabase
      .from('purchases')
      .insert({
        item_id: placeholderItemId,
        user_wallet: request.userWallet,
        amount: totalAmount,
        quantity: request.quantity,
        status: 'pending',
        metadata: {
          item_identifier: request.itemId, // Actual item ID (skin_3, pkg_1, etc)
          player_id: request.playerId,
          initiated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (pendingError) {
      return {
        success: false,
        message: 'Failed to create purchase record',
        error: 'DATABASE_ERROR',
      };
    }

    // Step 6: Send payment on-chain
    // Note: Replace with your actual $TRUST token contract address
    const TRUST_TOKEN_ADDRESS = import.meta.env
      .VITE_TRUST_TOKEN_ADDRESS as Address;

    if (!TRUST_TOKEN_ADDRESS) {
      // Fallback: Send native ETH if no token configured
      const hash = await walletClient.sendTransaction({
        account,
        to: STORE_WALLET,
        value: toTokenUnits(totalAmount, 18),
      });

      // Step 7: Wait for confirmation
      const isVerified = await verifyTransaction(hash);

      if (!isVerified) {
        // Update purchase to failed
        await supabase
          .from('purchases')
          .update({ status: 'failed' })
          .eq('id', pendingPurchase.id);

        return {
          success: false,
          message: 'Transaction failed on-chain',
          error: 'TX_FAILED',
        };
      }

      // Step 8: Update purchase to completed
      const { data: completedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({
          transaction_hash: hash,
          status: 'completed',
          metadata: {
            ...pendingPurchase.metadata,
            completed_at: new Date().toISOString(),
            payment_method: 'native_eth',
          },
        })
        .eq('id', pendingPurchase.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          '❌ Failed to update purchase to completed:',
          updateError
        );
        // Still return success since blockchain tx succeeded
        // The purchase record exists but status update failed
      } else {
        console.log('✅ Purchase updated to completed:', completedPurchase);
      }

      return {
        success: true,
        transactionHash: hash,
        purchaseId: pendingPurchase.id,
        message: 'Payment successful!',
      };
    } else {
      // Use ERC20 token transfer
      const tokenAmount = toTokenUnits(totalAmount, 18);

      const hash = await walletClient.writeContract({
        address: TRUST_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [STORE_WALLET, tokenAmount],
        account,
      });

      // Step 7: Wait for confirmation
      const isVerified = await verifyTransaction(hash);

      if (!isVerified) {
        await supabase
          .from('purchases')
          .update({ status: 'failed' })
          .eq('id', pendingPurchase.id);

        return {
          success: false,
          message: 'Transaction failed on-chain',
          error: 'TX_FAILED',
        };
      }

      // Step 8: Update purchase to completed
      const { data: completedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({
          transaction_hash: hash,
          status: 'completed',
          metadata: {
            ...pendingPurchase.metadata,
            completed_at: new Date().toISOString(),
            payment_method: 'trust_token',
          },
        })
        .eq('id', pendingPurchase.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          '❌ Failed to update purchase to completed:',
          updateError
        );
        // Still return success since blockchain tx succeeded
      } else {
        console.log('✅ Purchase updated to completed:', completedPurchase);
      }

      return {
        success: true,
        transactionHash: hash,
        purchaseId: pendingPurchase.id,
        message: 'Payment successful!',
      };
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);

    return {
      success: false,
      message: error.message || 'Payment failed',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
};

/**
 * Verify payment status by player ID
 * Used by Unity game to confirm purchases
 */
export const verifyPaymentByPlayerId = async (
  playerId: string,
  transactionHash?: string
): Promise<{
  verified: boolean;
  purchases: any[];
  message: string;
}> => {
  try {
    let query = supabase
      .from('purchases')
      .select('*, items(*)')
      .eq('metadata->>player_id', playerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (transactionHash) {
      query = query.eq('transaction_hash', transactionHash);
    }

    const { data: purchases, error } = await query;

    if (error) {
      return {
        verified: false,
        purchases: [],
        message: 'Failed to verify payment',
      };
    }

    return {
      verified: purchases.length > 0,
      purchases: purchases || [],
      message: purchases.length > 0 ? 'Payment verified' : 'No payments found',
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      verified: false,
      purchases: [],
      message: 'Verification failed',
    };
  }
};

/**
 * Get player inventory by player ID
 * Used by Unity to sync owned items
 */
export const getPlayerInventory = async (playerId: string) => {
  try {
    // Find user wallet by player_id
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('user_wallet')
      .eq('metadata->>player_id', playerId)
      .limit(1);

    if (purchaseError || !purchases || purchases.length === 0) {
      return {
        success: false,
        inventory: [],
        message: 'Player not found',
      };
    }

    const userWallet = purchases[0].user_wallet;

    // Get inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('user_inventory')
      .select('*, items(*)')
      .eq('user_wallet', userWallet);

    if (inventoryError) {
      return {
        success: false,
        inventory: [],
        message: 'Failed to fetch inventory',
      };
    }

    return {
      success: true,
      inventory: inventory || [],
      message: 'Inventory retrieved successfully',
    };
  } catch (error) {
    console.error('Get inventory error:', error);
    return {
      success: false,
      inventory: [],
      message: 'Failed to retrieve inventory',
    };
  }
};

/**
 * Get $TRUST token balance for a wallet
 */
export const getTrustBalance = async (
  walletAddress: Address
): Promise<number> => {
  try {
    const TRUST_TOKEN_ADDRESS = import.meta.env
      .VITE_TRUST_TOKEN_ADDRESS as Address;

    if (!TRUST_TOKEN_ADDRESS) {
      // Fallback to native balance
      const balance = await publicClient.getBalance({ address: walletAddress });
      return Number(balance) / 10 ** 18;
    }

    const balance = (await publicClient.readContract({
      address: TRUST_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    })) as bigint;

    return Number(balance) / 10 ** 18;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
};
