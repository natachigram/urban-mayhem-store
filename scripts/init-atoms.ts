/**
 * Initialize Atoms Script
 * Creates Intuition atoms for all store items
 * Run with: npm run init-atoms
 */

import {
  createAtomFromThing,
  createAtomFromString,
  getMultiVaultAddressFromChainId,
} from '@0xintuition/sdk';
import {
  createPublicClient,
  createWalletClient,
  http,
  privateKeyToAccount,
} from 'viem';
import { intuitionTestnet } from './src/lib/blockchain';
import { supabase } from './src/services/supabase';
import prefabs from './src/data/prefabs.json';
import { PREDICATES } from './src/services/intuition';

// Setup clients (use environment variable for private key)
const PRIVATE_KEY = process.env.INIT_WALLET_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ INIT_WALLET_PRIVATE_KEY environment variable required');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: intuitionTestnet,
  transport: http(),
  account,
});

const address = getMultiVaultAddressFromChainId(intuitionTestnet.id);

console.log('🚀 Starting atom initialization...');
console.log('📍 Using wallet:', account.address);
console.log('🌐 Chain:', intuitionTestnet.name);
console.log('📦 MultiVault:', address);

async function initializeItemAtoms() {
  console.log('\n📦 Creating atoms for UMP packages...');

  for (const pkg of prefabs.umpPackages) {
    try {
      // Check if atom already exists
      const { data: existing } = await supabase
        .from('atoms')
        .select('atom_id')
        .eq('entity_type', 'item')
        .eq('entity_id', pkg.id)
        .single();

      if (existing) {
        console.log(`✅ ${pkg.name} - Already exists (${existing.atom_id})`);
        continue;
      }

      // Create atom on Intuition
      console.log(`Creating atom for ${pkg.name}...`);
      const atomData = await createAtomFromThing(
        { walletClient, publicClient, address },
        {
          name: pkg.name,
          description: pkg.description,
          image: pkg.imageUrl,
          url: `https://store.urbanmayhem.com/items/${pkg.id}`,
        }
      );

      // Cache in Supabase
      await supabase.from('atoms').insert({
        atom_id: atomData.state.termId,
        entity_type: 'item',
        entity_id: pkg.id,
        atom_uri: atomData.uri,
        atom_data: atomData.state.atomData,
        creator_wallet: atomData.state.creator,
        metadata: {
          name: pkg.name,
          type: 'ump',
          price: pkg.price,
          umpAmount: pkg.umpAmount,
        },
      });

      console.log(`✅ ${pkg.name} - Created (${atomData.state.termId})`);
    } catch (error) {
      console.error(`❌ Failed to create atom for ${pkg.name}:`, error.message);
    }
  }

  console.log('\n🎨 Creating atoms for skins...');

  for (const skin of prefabs.skins) {
    try {
      const { data: existing } = await supabase
        .from('atoms')
        .select('atom_id')
        .eq('entity_type', 'item')
        .eq('entity_id', skin.id)
        .single();

      if (existing) {
        console.log(`✅ ${skin.name} - Already exists (${existing.atom_id})`);
        continue;
      }

      console.log(`Creating atom for ${skin.name}...`);
      const atomData = await createAtomFromThing(
        { walletClient, publicClient, address },
        {
          name: skin.name,
          description: skin.description,
          image: skin.imageUrl,
          url: `https://store.urbanmayhem.com/items/${skin.id}`,
        }
      );

      await supabase.from('atoms').insert({
        atom_id: atomData.state.termId,
        entity_type: 'item',
        entity_id: skin.id,
        atom_uri: atomData.uri,
        atom_data: atomData.state.atomData,
        creator_wallet: atomData.state.creator,
        metadata: {
          name: skin.name,
          type: 'skin',
          price: skin.price,
          rarity: skin.rarity,
        },
      });

      console.log(`✅ ${skin.name} - Created (${atomData.state.termId})`);
    } catch (error) {
      console.error(
        `❌ Failed to create atom for ${skin.name}:`,
        error.message
      );
    }
  }
}

async function initializePredicateAtoms() {
  console.log('\n🏷️  Creating predicate atoms...');

  for (const [key, predicate] of Object.entries(PREDICATES)) {
    try {
      const { data: existing } = await supabase
        .from('atoms')
        .select('atom_id')
        .eq('entity_type', 'predicate')
        .eq('entity_id', predicate)
        .single();

      if (existing) {
        console.log(`✅ "${predicate}" - Already exists (${existing.atom_id})`);
        continue;
      }

      console.log(`Creating predicate atom for "${predicate}"...`);
      const atomData = await createAtomFromString(
        { walletClient, publicClient, address },
        predicate
      );

      await supabase.from('atoms').insert({
        atom_id: atomData.state.termId,
        entity_type: 'predicate',
        entity_id: predicate,
        atom_uri: atomData.uri,
        atom_data: atomData.state.atomData,
        creator_wallet: atomData.state.creator,
        metadata: { text: predicate, key },
      });

      console.log(`✅ "${predicate}" - Created (${atomData.state.termId})`);
    } catch (error) {
      console.error(
        `❌ Failed to create predicate "${predicate}":`,
        error.message
      );
    }
  }
}

async function main() {
  try {
    await initializeItemAtoms();
    await initializePredicateAtoms();

    console.log('\n✨ Initialization complete!');
    console.log('\n📊 Summary:');

    const { count: itemCount } = await supabase
      .from('atoms')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'item');

    const { count: predicateCount } = await supabase
      .from('atoms')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'predicate');

    console.log(`  Items: ${itemCount}`);
    console.log(`  Predicates: ${predicateCount}`);
    console.log('\n🎉 All atoms initialized successfully!');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
