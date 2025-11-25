/**
 * Intuition Protocol Integration Service
 * Handles atoms, triples (claims/attestations), and trust score calculations
 */

import {
  createAtomFromThing,
  createAtomFromString,
  createAtomFromEthereumAccount,
  createTripleStatement,
  getAtomDetails,
  getTripleDetails,
} from '@0xintuition/sdk';
import { getMultiVaultAddressFromChainId } from '@0xintuition/protocol';
import { type Address, type PublicClient, type WalletClient } from 'viem';
import { supabase } from './supabase';

// Common predicates for attestations
export const PREDICATES = {
  IS_GREAT: 'is great',
  IS_BAD: 'is bad',
  IS_OVERPRICED: 'is overpriced',
  IS_FAIR_PRICE: 'is fair price',
  IS_HIGH_QUALITY: 'is high quality',
  IS_TOXIC: 'is toxic',
  IS_TRUSTWORTHY: 'is trustworthy',
  IS_SKILLED: 'is skilled',
  HAS_GOOD_SPORTSMANSHIP: 'has good sportsmanship',
} as const;

export interface IntuitionClients {
  walletClient: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

/**
 * Get the MultiVault contract address for the current chain
 */
export const getMultiVaultAddress = (chainId: number): Address => {
  try {
    const address = getMultiVaultAddressFromChainId(chainId);
    if (!address) {
      console.error(`No MultiVault address found for chainId ${chainId}`);
      // Fallback to Intuition Testnet contract address
      if (chainId === 13579) {
        return '0xd51e5a3Cc9a1B8d84c3763e04cD48F14bb95DE68' as Address;
      }
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return address;
  } catch (error) {
    console.error('Error getting MultiVault address:', error);
    // Fallback to Intuition Testnet contract address
    if (chainId === 13579) {
      return '0xd51e5a3Cc9a1B8d84c3763e04cD48F14bb95DE68' as Address;
    }
    throw error;
  }
};

/**
 * Create an atom for a store item (UMP package or skin)
 */
export const createItemAtom = async (
  clients: IntuitionClients,
  item: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    type: 'ump' | 'skin';
  }
) => {
  const address = getMultiVaultAddress(clients.chainId);

  try {
    const atomData = await createAtomFromThing(
      {
        walletClient: clients.walletClient,
        publicClient: clients.publicClient,
        address,
      },
      {
        name: item.name,
        description: item.description,
        image: item.imageUrl,
        url: `https://store.urbanmayhem.com/items/${item.id}`,
      }
    );

    // Cache atom in Supabase
    await supabase.from('atoms').insert({
      atom_id: atomData.state.termId,
      entity_type: 'item',
      entity_id: item.id,
      atom_uri: atomData.uri,
      atom_data: atomData.state.atomData,
      creator_wallet: atomData.state.creator,
      metadata: {
        name: item.name,
        type: item.type,
      },
    });

    return atomData;
  } catch (error) {
    console.error('Failed to create item atom:', error);
    throw error;
  }
};

/**
 * Create an atom for a player
 */
export const createPlayerAtom = async (
  clients: IntuitionClients,
  playerWallet: Address
) => {
  const address = getMultiVaultAddress(clients.chainId);

  try {
    // Check if player atom already exists
    const existing = await getCachedAtom('player', playerWallet.toLowerCase());
    if (existing) {
      console.log('Player atom already exists:', existing.atom_id);
      return existing;
    }

    console.log('Creating player atom for:', playerWallet);

    const atomData = await createAtomFromEthereumAccount(
      {
        walletClient: clients.walletClient,
        publicClient: clients.publicClient,
        address,
      },
      playerWallet // Just pass the address, not an object
    );

    console.log('Player atom created:', atomData);

    // Cache atom in Supabase
    await supabase.from('atoms').insert({
      atom_id: atomData.state.termId,
      entity_type: 'player',
      entity_id: playerWallet.toLowerCase(),
      atom_uri: atomData.uri,
      atom_data: atomData.state.atomData,
      creator_wallet: atomData.state.creator,
      metadata: {
        wallet: playerWallet,
        chainId: clients.chainId,
      },
    });

    return atomData;
  } catch (error) {
    console.error('Failed to create player atom:', error);
    throw error;
  }
};

/**
 * Get or create a predicate atom
 */
export const getOrCreatePredicateAtom = async (
  clients: IntuitionClients,
  predicate: string
) => {
  const address = getMultiVaultAddress(clients.chainId);

  // Check if predicate atom already exists in cache
  const { data: existing, error: fetchError } = await supabase
    .from('atoms')
    .select('*')
    .eq('entity_type', 'predicate')
    .eq('entity_id', predicate)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching predicate atom:', fetchError);
  }

  if (existing) {
    console.log('Found existing predicate atom:', existing);
    return {
      state: {
        termId: existing.atom_id,
        creator: existing.creator_wallet,
        atomData: existing.atom_data,
      },
      uri: existing.atom_uri,
      transactionHash: null,
    };
  }

  // Create new predicate atom
  try {
    console.log('Creating new predicate atom for:', predicate);
    const atomData = await createAtomFromString(
      {
        walletClient: clients.walletClient,
        publicClient: clients.publicClient,
        address,
      },
      predicate
    );

    console.log('Predicate atom created:', atomData);

    // Cache in Supabase
    await supabase.from('atoms').insert({
      atom_id: atomData.state.termId,
      entity_type: 'predicate',
      entity_id: predicate,
      atom_uri: atomData.uri,
      atom_data: atomData.state.atomData,
      creator_wallet: atomData.state.creator,
      metadata: { text: predicate },
    });

    return atomData;
  } catch (error) {
    console.error('Failed to create predicate atom:', error);
    throw error;
  }
};

/**
 * Create an attestation (triple) about an item or player
 */
export const createAttestation = async (
  clients: IntuitionClients,
  params: {
    subjectAtomId: string; // The item or player being attested about
    predicateAtomId: string; // The claim type (is great, is toxic, etc)
    objectAtomId: string; // Additional context (optional, can be same as subject)
    stakeAmount: bigint; // Amount of $TRUST to stake (in wei)
    comment?: string; // Optional review text
  }
) => {
  const address = getMultiVaultAddress(clients.chainId);

  try {
    // Validate clients
    if (!clients || !clients.walletClient || !clients.publicClient) {
      throw new Error(
        `Invalid clients: walletClient=${!!clients?.walletClient}, publicClient=${!!clients?.publicClient}`
      );
    }

    // Validate all atom IDs are present
    if (
      !params.subjectAtomId ||
      !params.predicateAtomId ||
      !params.objectAtomId
    ) {
      throw new Error(
        `Missing atom IDs: subject=${params.subjectAtomId}, predicate=${params.predicateAtomId}, object=${params.objectAtomId}`
      );
    }

    // Validate address
    if (!address) {
      throw new Error(
        `MultiVault address is undefined for chainId ${clients.chainId}`
      );
    }

    console.log('Creating attestation with:', {
      subject: params.subjectAtomId,
      predicate: params.predicateAtomId,
      object: params.objectAtomId,
      stake: params.stakeAmount.toString(),
      address,
      hasWalletClient: !!clients.walletClient,
      hasPublicClient: !!clients.publicClient,
    });

    // createTriples expects args as 4 arrays: [subjectIds[], predicateIds[], objectIds[], assets[]]
    // NOT as [subjectId, predicateId, objectId]
    const args = [
      [params.subjectAtomId as `0x${string}`], // subjectIds array
      [params.predicateAtomId as `0x${string}`], // predicateIds array
      [params.objectAtomId as `0x${string}`], // objectIds array
      [params.stakeAmount], // assets array
    ] as const;

    console.log('Args prepared (4 arrays format):', {
      subjects: args[0],
      predicates: args[1],
      objects: args[2],
      assets: args[3].map((a) => a.toString()),
    });

    const tripleData = await createTripleStatement(
      {
        walletClient: clients.walletClient,
        publicClient: clients.publicClient,
        address,
      },
      {
        args,
        value: params.stakeAmount, // This is the msg.value for the transaction
      }
    );

    console.log('Triple created successfully:', tripleData);

    // tripleData.state is an array of events, access first event's args
    const eventData = tripleData.state[0]?.args;
    if (!eventData) {
      throw new Error('No event data returned from triple creation');
    }

    console.log('Event data:', eventData);

    // Cache attestation in Supabase
    const { error: insertError } = await supabase.from('attestations').insert({
      triple_id: eventData.termId as string,
      subject_atom_id: params.subjectAtomId,
      predicate_atom_id: params.predicateAtomId,
      object_atom_id: params.objectAtomId,
      stake_amount: params.stakeAmount.toString(),
      creator_wallet: eventData.creator as string,
      transaction_hash: tripleData.transactionHash,
      status: 'active',
      comment: params.comment || null,
      metadata: params.comment ? { comment: params.comment } : {},
    });

    if (insertError) {
      console.error('Failed to cache attestation:', insertError);
      throw insertError;
    }

    console.log('Attestation cached successfully');

    return tripleData;
  } catch (error) {
    console.error('Failed to create attestation:', error);
    throw error;
  }
};

/**
 * Calculate trust score for an item based on attestations
 */
export const calculateTrustScore = async (itemAtomId: string) => {
  const { data: attestations, error } = await supabase
    .from('attestations')
    .select('*, atoms!predicate_atom_id(*)')
    .eq('subject_atom_id', itemAtomId)
    .eq('status', 'active');

  if (error || !attestations) {
    return { score: 0, totalStake: 0n, positiveStake: 0n, negativeStake: 0n };
  }

  let positiveStake = 0n;
  let negativeStake = 0n;

  for (const attestation of attestations) {
    const stake = BigInt(attestation.stake_amount);
    const predicate = attestation.atoms?.entity_id;

    // Categorize predicates as positive or negative
    if (
      predicate === PREDICATES.IS_GREAT ||
      predicate === PREDICATES.IS_HIGH_QUALITY ||
      predicate === PREDICATES.IS_FAIR_PRICE
    ) {
      positiveStake += stake;
    } else if (
      predicate === PREDICATES.IS_BAD ||
      predicate === PREDICATES.IS_OVERPRICED
    ) {
      negativeStake += stake;
    }
  }

  const totalStake = positiveStake + negativeStake;
  const score =
    totalStake > 0n ? Number(positiveStake) / Number(totalStake) : 0;

  return {
    score: score * 100, // Convert to percentage (0-100)
    totalStake,
    positiveStake,
    negativeStake,
    attestationCount: attestations.length,
  };
};

/**
 * Get cached atom by entity
 */
export const getCachedAtom = async (
  entityType: 'item' | 'player' | 'predicate',
  entityId: string
) => {
  const { data, error } = await supabase
    .from('atoms')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();

  if (error || !data) return null;
  return data;
};

/**
 * Get all attestations for an entity
 */
export const getAttestations = async (atomId: string) => {
  const { data, error } = await supabase
    .from('attestations')
    .select(
      `
      *,
      subject:atoms!subject_atom_id(*),
      predicate:atoms!predicate_atom_id(*),
      object:atoms!object_atom_id(*)
    `
    )
    .eq('subject_atom_id', atomId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get attestations:', error);
    return [];
  }

  return data || [];
};
