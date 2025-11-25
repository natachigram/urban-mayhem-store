import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { Coins, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { intuitionTestnet } from '@/lib/blockchain';

export const Header = () => {
  const { address, isConnected, chain } = useAccount();
  const [umpBalance, setUmpBalance] = useState<number>(0);

  // Fetch real UMP Balance from user_inventory
  useEffect(() => {
    if (isConnected && address) {
      fetchUmpBalance();
    } else {
      setUmpBalance(0);
    }

    // Listen for balance updates (triggered after successful payments)
    const handleBalanceUpdate = () => {
      if (isConnected && address) {
        fetchUmpBalance();
      }
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    return () =>
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
  }, [isConnected, address]);

  const fetchUmpBalance = async () => {
    if (!address) return;

    try {
      // Fetch all completed purchases (don't lowercase the address - DB stores mixed case)
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('quantity, metadata')
        .eq('user_wallet', address) // Keep original case
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      if (!purchases || purchases.length === 0) {
        console.log('📦 No completed purchases found for:', address);
        setUmpBalance(0);
        return;
      }

      console.log('📦 Fetched purchases:', purchases);

      // Extract item identifiers from metadata
      const itemIdentifiers = purchases
        .map((p) => p.metadata?.item_identifier)
        .filter(Boolean);

      if (itemIdentifiers.length === 0) {
        console.log('⚠️ No item identifiers found in purchases');
        setUmpBalance(0);
        return;
      }

      // Fetch all UMP items
      const { data: allItems, error: itemsError } = await supabase
        .from('items')
        .select('id, name, type, metadata')
        .eq('type', 'ump');

      if (itemsError) throw itemsError;

      // Build lookup map by checking name patterns (legacy item_identifier mapping)
      const itemMap = new Map();
      allItems?.forEach((item) => {
        // Map by item name patterns (Starter Pack -> pkg_1, Pro Pack -> pkg_2, etc)
        if (item.name.includes('Starter')) itemMap.set('pkg_1', item);
        if (item.name.includes('Pro')) itemMap.set('pkg_2', item);
        if (item.name.includes('Elite')) itemMap.set('pkg_3', item);
        if (item.name.includes('Warlord')) itemMap.set('pkg_4', item);

        // Also map by UUID if it matches
        itemMap.set(item.id, item);
      });

      console.log('🗺️ Item map size:', itemMap.size);

      // Calculate UMP from purchases using metadata
      const totalUmp = purchases.reduce((sum, purchase) => {
        const itemIdentifier = purchase.metadata?.item_identifier;
        const quantity = purchase.quantity || 1;

        // Look up the item
        const item = itemMap.get(itemIdentifier);

        if (item && item.type === 'ump' && item.metadata?.ump_amount) {
          console.log(
            `✅ Found UMP: ${item.name} = ${item.metadata.ump_amount} x ${quantity}`
          );
          return sum + item.metadata.ump_amount * quantity;
        } else if (itemIdentifier) {
          console.log(`⚠️ Item not found for identifier: ${itemIdentifier}`);
        }

        return sum;
      }, 0);

      console.log('💰 Total UMP Balance:', totalUmp);
      setUmpBalance(totalUmp);
    } catch (error) {
      console.error('❌ Failed to fetch UMP balance:', error);
      setUmpBalance(0);
    }
  };

  // Fetch balance for the current connected chain
  const { data: trustBalance, isLoading: isTrustLoading } = useBalance({
    address,
    chainId: chain?.id, // Use current chain instead of hardcoded
    query: {
      enabled: !!address && isConnected && !!chain,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Debug logging
  useEffect(() => {
    if (isConnected && address) {
      console.log('💳 Connected Address:', address);
      console.log('🌐 Current Chain:', chain?.name, '(ID:', chain?.id, ')');
      console.log('⚡ Balance Data:', trustBalance);
      console.log(
        '✅ Is Intuition Testnet:',
        chain?.id === intuitionTestnet.id
      );
    }
  }, [isConnected, address, trustBalance, chain]);

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center justify-between'>
        <div className='flex items-center gap-8'>
          <Link to='/' className='flex items-center space-x-2'>
            <div className='relative'>
              <h1 className='text-2xl font-black tracking-tighter text-foreground italic'>
                URBAN <span className='text-primary'>MAYHEM</span>
              </h1>
            </div>
          </Link>

          <nav className='hidden md:flex gap-6'>
            <Link
              to='/'
              className='text-sm font-bold text-foreground hover:text-primary transition-colors uppercase tracking-wider'
            >
              Store
            </Link>
            <Link
              to='/history'
              className='text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider'
            >
              History
            </Link>
            <Link
              to='/attestations'
              className='text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider'
            >
              Attestations
            </Link>
          </nav>
        </div>

        <div className='flex items-center gap-4'>
          {isConnected && (
            <div className='hidden md:flex items-center gap-4 mr-4'>
              {/* UMP Balance Display */}
              <div className='flex items-center gap-2 bg-secondary/30 px-3 py-1 border border-border/50 skew-x-[-10deg]'>
                <Coins className='h-4 w-4 text-primary skew-x-[10deg]' />
                <div className='flex flex-col leading-none skew-x-[10deg]'>
                  <span className='text-[10px] text-muted-foreground font-bold uppercase'>
                    UMP
                  </span>
                  <span className='text-sm font-black text-foreground'>
                    {umpBalance?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>

              {/* Native Token Balance Display */}
              <div className='flex items-center gap-2 bg-secondary/30 px-3 py-1 border border-border/50 skew-x-[-10deg]'>
                <Zap className='h-4 w-4 text-blue-400 skew-x-[10deg]' />
                <div className='flex flex-col leading-none skew-x-[10deg]'>
                  <span className='text-[10px] text-muted-foreground font-bold uppercase'>
                    {trustBalance?.symbol || 'TOKEN'}
                  </span>
                  <span className='text-sm font-black text-foreground'>
                    {trustBalance?.value
                      ? (
                          Number(trustBalance.value) /
                          10 ** (trustBalance.decimals || 18)
                        ).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ConnectButton chainStatus='icon' showBalance={false} />
        </div>
      </div>
    </header>
  );
};
