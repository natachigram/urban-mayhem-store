/**
 * usePayment Hook
 * React hook for handling blockchain payments with Supabase integration
 */

import { useState, useCallback } from 'react';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';
import {
  processPayment,
  verifyPaymentByPlayerId,
  getPlayerInventory,
  getTrustBalance,
  type PaymentRequest,
  type PaymentResponse,
} from '@/services/payment';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';

export const usePayment = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  /**
   * Refetch data after successful payment
   */
  const refreshData = useCallback(() => {
    // Trigger a custom event that Header can listen to
    window.dispatchEvent(new Event('balanceUpdate'));
  }, []);

  /**
   * Process a payment for an item purchase
   */
  const pay = async (
    itemId: string,
    playerId: string,
    amount: number,
    quantity: number = 1
  ): Promise<PaymentResponse> => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to make a purchase',
        variant: 'destructive',
      });
      return {
        success: false,
        message: 'Wallet not connected',
        error: 'NO_WALLET',
      };
    }

    setIsProcessing(true);

    try {
      const request: PaymentRequest = {
        itemId,
        playerId,
        userWallet: address as Address,
        amount,
        quantity,
      };

      const response = await processPayment(request);

      if (response.success) {
        const txHash = response.transactionHash;
        const explorerUrl = txHash
          ? `https://testnet.explorer.intuition.systems/tx/${txHash}`
          : '';

        toast({
          title: '✅ Payment Successful!',
          description: `Player ID: ${playerId} | Amount: ${amount} $TRUST${
            txHash ? ` | TX: ${txHash.slice(0, 10)}...` : ''
          }`,
          duration: 8000,
        });

        // Log to console for easy access to explorer link
        if (explorerUrl) {
          console.log('🔗 View transaction:', explorerUrl);
        }

        // Trigger balance refresh in Header
        refreshData();

        // The payment.ts service already updates status to 'completed'
        // after blockchain verification. The database trigger will now
        // automatically populate user_inventory when status changes.
        // Refresh again after a short delay to ensure trigger has completed
        setTimeout(() => {
          refreshData();
        }, 1500);
      } else {
        toast({
          title: '❌ Payment Failed',
          description: `${response.message}${
            response.error ? ` (${response.error})` : ''
          }`,
          variant: 'destructive',
          duration: 10000,
        });
      }

      return response;
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });

      return {
        success: false,
        message: error.message || 'Payment failed',
        error: 'PAYMENT_ERROR',
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Verify payment status by player ID
   */
  const verifyPayment = async (playerId: string, transactionHash?: string) => {
    try {
      const result = await verifyPaymentByPlayerId(playerId, transactionHash);
      return result;
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
   * Get player's inventory
   */
  const getInventory = async (playerId: string) => {
    try {
      const result = await getPlayerInventory(playerId);
      return result;
    } catch (error) {
      console.error('Get inventory error:', error);
      return {
        success: false,
        inventory: [],
        message: 'Failed to get inventory',
      };
    }
  };

  /**
   * Check wallet balance
   */
  const checkBalance = async () => {
    if (!address) return 0;

    try {
      const bal = await getTrustBalance(address as Address);
      setBalance(bal);
      return bal;
    } catch (error) {
      console.error('Balance check error:', error);
      return 0;
    }
  };

  return {
    pay,
    verifyPayment,
    getInventory,
    checkBalance,
    balance,
    isProcessing,
    walletAddress: address,
  };
};
