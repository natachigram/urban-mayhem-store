/**
 * useAttestation Hook
 * React hook for creating attestations and managing trust scores
 */

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { intuitionTestnet } from '@/lib/blockchain';
import {
  createAttestation,
  getOrCreatePredicateAtom,
  getCachedAtom,
  calculateTrustScore,
  PREDICATES,
  type IntuitionClients,
} from '@/services/intuition';
import { useToast } from './use-toast';

/**
 * Fetch item data from Supabase by UUID or identifier
 */
const getStoreItemData = async (itemId: string) => {
  try {
    const { supabase } = await import('@/services/supabase');

    // Try by identifier first (for atom matching)
    let { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('identifier', itemId)
      .single();

    // Fallback to UUID if identifier not found
    if (error || !data) {
      ({ data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single());
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return null;
  }
};

export const useAttestation = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Create an attestation about an item
   */
  const attestItem = useCallback(
    async (params: {
      itemId: string; // UUID or identifier (e.g., 'pkg_1', 'skin_3')
      predicate: keyof typeof PREDICATES;
      stakeAmount: bigint; // Amount in wei
      comment?: string; // Optional review text
    }) => {
      if (!isConnected || !address || !walletClient || !publicClient) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to create attestations',
          variant: 'destructive',
        });
        return { success: false };
      }

      setIsProcessing(true);

      try {
        const clients: IntuitionClients = {
          walletClient,
          publicClient,
          chainId: intuitionTestnet.id,
        };

        // Get item data to find identifier
        const itemData = await getStoreItemData(params.itemId);
        if (!itemData) {
          throw new Error('Item not found in store catalog');
        }

        // Use identifier for atom matching (falls back to id if no identifier)
        const atomEntityId = itemData.identifier || itemData.id;

        // 1. Get item atom
        let itemAtom = await getCachedAtom('item', atomEntityId);

        // Auto-create atom if not found
        if (!itemAtom) {
          toast({
            title: 'Initializing Item...',
            description: 'Creating attestation infrastructure for this item',
          });

          // Create item atom using identifier or id
          const { createItemAtom } = await import('@/services/intuition');
          await createItemAtom(clients, {
            id: atomEntityId, // Use identifier for consistency
            name: itemData.name,
            description: itemData.description,
            imageUrl: itemData.image_url,
            type: itemData.type,
          });

          // Fetch newly created atom
          itemAtom = await getCachedAtom('item', atomEntityId);
          if (!itemAtom) {
            throw new Error('Failed to initialize item atom');
          }
        }

        // 2. Get or create predicate atom
        const predicateText = PREDICATES[params.predicate];
        console.log('Getting predicate atom for:', predicateText);

        const predicateAtom = await getOrCreatePredicateAtom(
          clients,
          predicateText
        );

        console.log('Predicate atom result:', predicateAtom);

        // Validate predicate atom
        if (
          !predicateAtom ||
          !predicateAtom.state ||
          !predicateAtom.state.termId
        ) {
          throw new Error(
            `Invalid predicate atom structure: ${JSON.stringify(predicateAtom)}`
          );
        }

        // 3. Create attestation triple on Intuition
        console.log('Creating attestation with IDs:', {
          subject: itemAtom.atom_id,
          predicate: predicateAtom.state.termId,
          object: itemAtom.atom_id,
        });

        const result = await createAttestation(clients, {
          subjectAtomId: itemAtom.atom_id,
          predicateAtomId: predicateAtom.state.termId,
          objectAtomId: itemAtom.atom_id, // Self-reference for simple claims
          stakeAmount: params.stakeAmount,
          comment: params.comment, // Pass comment to service
        });

        toast({
          title: '✅ Attestation Created!',
          description: `You staked ${
            Number(params.stakeAmount) / 10 ** 18
          } $TRUST on "${predicateText}"`,
          duration: 6000,
        });

        // Recalculate trust score
        const trustScore = await calculateTrustScore(itemAtom.atom_id);

        // Get the triple ID from first event
        const tripleId =
          result.state[0]?.args?.termId || result.transactionHash;

        return {
          success: true,
          tripleId: tripleId as string,
          transactionHash: result.transactionHash,
          trustScore,
        };
      } catch (error: any) {
        console.error('Attestation error:', error);
        toast({
          title: '❌ Attestation Failed',
          description: error.message || 'Failed to create attestation',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [isConnected, address, walletClient, publicClient, toast]
  );

  /**
   * Get trust score for an item
   */
  const getTrustScore = useCallback(async (itemId: string) => {
    try {
      const itemAtom = await getCachedAtom('item', itemId);
      if (!itemAtom) {
        return {
          score: 0,
          totalStake: 0n,
          positiveStake: 0n,
          negativeStake: 0n,
          attestationCount: 0,
        };
      }

      const trustScore = await calculateTrustScore(itemAtom.atom_id);
      return trustScore;
    } catch (error) {
      console.error('Failed to get trust score:', error);
      return {
        score: 0,
        totalStake: 0n,
        positiveStake: 0n,
        negativeStake: 0n,
        attestationCount: 0,
      };
    }
  }, []);

  /**
   * Withdraw stake from an attestation
   */
  const withdrawAttestation = useCallback(
    async (attestationId: string) => {
      if (!isConnected || !address) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to withdraw',
          variant: 'destructive',
        });
        return { success: false };
      }

      setIsProcessing(true);

      try {
        const { supabase } = await import('@/services/supabase');

        // Call database function to withdraw
        const { data, error } = await supabase.rpc('withdraw_attestation', {
          attestation_id: attestationId,
          withdrawer_wallet: address.toLowerCase(),
        });

        if (error) throw error;

        if (data && data.length > 0 && data[0].success) {
          toast({
            title: '✅ Stake Withdrawn',
            description:
              'Your stake has been withdrawn. 24h cooldown before re-staking.',
            duration: 5000,
          });
          return { success: true };
        } else {
          throw new Error(data?.[0]?.message || 'Withdrawal failed');
        }
      } catch (error: any) {
        console.error('Withdrawal error:', error);
        toast({
          title: '❌ Withdrawal Failed',
          description: error.message || 'Failed to withdraw stake',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [isConnected, address, toast]
  );

  /**
   * Create counter-attestation (disagree with existing rating)
   */
  const createCounterAttestation = useCallback(
    async (params: {
      originalAttestationId: string;
      itemId: string;
      counterPredicate: keyof typeof PREDICATES;
      stakeAmount: bigint;
      disputeReason?: string;
      comment?: string;
    }) => {
      if (!isConnected || !address || !walletClient || !publicClient) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet',
          variant: 'destructive',
        });
        return { success: false };
      }

      setIsProcessing(true);

      try {
        // First create the counter-attestation
        const attestResult = await attestItem({
          itemId: params.itemId,
          predicate: params.counterPredicate,
          stakeAmount: params.stakeAmount,
          comment: params.comment,
        });

        if (!attestResult.success) {
          throw new Error('Failed to create counter-attestation');
        }

        // Link as counter-attestation in database
        const { supabase } = await import('@/services/supabase');
        const { data: newAttest } = await supabase
          .from('attestations')
          .select('id')
          .eq('triple_id', attestResult.tripleId)
          .single();

        if (newAttest) {
          await supabase.from('counter_attestations').insert({
            original_attestation_id: params.originalAttestationId,
            counter_attestation_id: newAttest.id,
            dispute_reason: params.disputeReason,
          });
        }

        toast({
          title: '✅ Counter-Attestation Created',
          description: 'Your opposing view has been recorded',
          duration: 5000,
        });

        return { success: true };
      } catch (error: any) {
        console.error('Counter-attestation error:', error);
        toast({
          title: '❌ Failed',
          description: error.message || 'Failed to create counter-attestation',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [isConnected, address, walletClient, publicClient, toast, attestItem]
  );

  return {
    attestItem,
    getTrustScore,
    withdrawAttestation,
    createCounterAttestation,
    isProcessing,
    isConnected,
  };
};
