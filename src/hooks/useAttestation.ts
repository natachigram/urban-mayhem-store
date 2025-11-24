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

// Store items data (UMP packages + skins)
const STORE_ITEMS = [
  // UMP Packages
  {
    id: 'pkg_1',
    name: 'Starter Pack',
    description: '500 UMP - Perfect for beginners',
    image_url: 'https://placehold.co/400x400/0a0a0a/05FF9D?text=500+UMP',
    type: 'ump' as const,
  },
  {
    id: 'pkg_2',
    name: 'Pro Pack',
    description: '1,200 UMP - Best value for active players',
    image_url: 'https://placehold.co/400x400/0a0a0a/05FF9D?text=1200+UMP',
    type: 'ump' as const,
  },
  {
    id: 'pkg_3',
    name: 'Elite Pack',
    description: '2,500 UMP - For serious competitors',
    image_url: 'https://placehold.co/400x400/0a0a0a/05FF9D?text=2500+UMP',
    type: 'ump' as const,
  },
  {
    id: 'pkg_4',
    name: 'Warlord Pack',
    description: '6,000 UMP - Maximum firepower',
    image_url: 'https://placehold.co/400x400/0a0a0a/05FF9D?text=6000+UMP',
    type: 'ump' as const,
  },
  // Skins
  {
    id: 'skin_1',
    name: 'Neon Spectre',
    description: 'Elite stealth suit with active camouflage capabilities',
    image_url: 'https://placehold.co/400x500/0a0a0a/05FF9D?text=Neon+Spectre',
    type: 'skin' as const,
  },
  {
    id: 'skin_2',
    name: 'Cyber Punk',
    description: 'Street-ready combat gear with integrated neural link',
    image_url: 'https://placehold.co/400x500/0a0a0a/3BA4FF?text=Cyber+Punk',
    type: 'skin' as const,
  },
  {
    id: 'skin_3',
    name: 'Urban Ranger',
    description: 'Standard issue urban camouflage for city operations',
    image_url: 'https://placehold.co/400x500/0a0a0a/989898?text=Urban+Ranger',
    type: 'skin' as const,
  },
  {
    id: 'skin_4',
    name: 'Void Walker',
    description: 'Experimental suit utilizing void energy for movement',
    image_url: 'https://placehold.co/400x500/0a0a0a/FFD700?text=Void+Walker',
    type: 'skin' as const,
  },
  {
    id: 'skin_5',
    name: 'Toxic Hazard',
    description: 'Hazmat combat suit designed for toxic environments',
    image_url: 'https://placehold.co/400x500/0a0a0a/FFA500?text=Toxic+Hazard',
    type: 'skin' as const,
  },
  {
    id: 'skin_6',
    name: 'Night Owl',
    description: 'Specialized gear for night operations',
    image_url: 'https://placehold.co/400x500/0a0a0a/989898?text=Night+Owl',
    type: 'skin' as const,
  },
];

const getStoreItemData = (itemId: string) => {
  return STORE_ITEMS.find((item) => item.id === itemId);
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
      itemId: string; // e.g., 'pkg_1', 'skin_3'
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

        // 1. Get item atom
        let itemAtom = await getCachedAtom('item', params.itemId);

        // Auto-create atom if not found
        if (!itemAtom) {
          toast({
            title: 'Initializing Item...',
            description: 'Creating attestation infrastructure for this item',
          });

          // Get item data from store catalog
          const itemData = getStoreItemData(params.itemId);

          if (!itemData) {
            throw new Error('Item not found in store catalog');
          }

          // Create item atom
          const { createItemAtom } = await import('@/services/intuition');
          await createItemAtom(clients, {
            id: itemData.id,
            name: itemData.name,
            description: itemData.description,
            imageUrl: itemData.image_url,
            type: itemData.type,
          });

          // Fetch newly created atom
          itemAtom = await getCachedAtom('item', params.itemId);
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
