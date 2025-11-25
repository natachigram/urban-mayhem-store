import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Coins, Zap, Shield, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getItemsByType } from '@/services/items';
import type { Item } from '@/types/database';

// Mock ERC20 ABI for transfer (simplified)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

// Store Wallet Address (Mock)
const STORE_WALLET = '0x1234567890123456789012345678901234567890';

const TopUp = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [umpPackages, setUmpPackages] = useState<Item[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Item | null>(null);

  // Load UMP packages from database
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const packages = await getItemsByType('ump');
        setUmpPackages(packages);
      } catch (error) {
        console.error('Failed to load UMP packages:', error);
        toast({
          title: 'Failed to load packages',
          description: 'Could not fetch UMP packages from database',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, [toast]);

  const handlePurchase = (pkg: Item) => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to purchase UMP.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedPackage(pkg);

    // Trigger Wallet Transaction
    // In a real app, we would use the actual $TRUST token contract address
    // For now, we simulate the call
    try {
      // writeContract({
      //   address: '0xTrustTokenAddress...',
      //   abi: ERC20_ABI,
      //   functionName: 'transfer',
      //   args: [STORE_WALLET, parseEther(pkg.price.toString())],
      // });

      // Simulating transaction for UI demo since we don't have a real contract on a testnet here
      console.log(
        `Purchasing ${pkg.metadata?.ump_amount} UMP for ${pkg.price} $TRUST`
      );
      toast({
        title: 'Transaction Initiated',
        description: 'Please confirm the transaction in your wallet.',
      });

      // Mock success after delay
      setTimeout(() => {
        toast({
          title: 'Purchase Successful',
          description: `Successfully purchased ${pkg.metadata?.ump_amount} UMP! Balance updated.`,
          className: 'bg-primary text-primary-foreground border-none',
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Transaction Failed',
        description: 'There was an error processing your transaction.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (isConfirmed && selectedPackage) {
      toast({
        title: 'Transaction Confirmed',
        description: `Successfully purchased ${selectedPackage.metadata?.ump_amount} UMP!`,
        className: 'bg-primary text-primary-foreground border-none',
      });
      // Here we would trigger a backend sync
      setSelectedPackage(null);
    }
  }, [isConfirmed, selectedPackage, toast]);

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='container py-12'>
        <div className='flex justify-end mb-4'>
          <Link to='/history'>
            <Button
              variant='outline'
              className='gap-2 uppercase font-bold tracking-wider'
            >
              <History className='h-4 w-4' />
              Purchase History
            </Button>
          </Link>
        </div>

        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-1 mb-4 text-sm font-bold uppercase tracking-widest text-primary'>
            <Shield className='h-3 w-3' />
            Official Store
          </div>
          <h1 className='text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6'>
            Get <span className='text-primary'>UMP</span>
          </h1>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto font-medium'>
            Purchase Urban Mayhem Points (UMP) using $TRUST tokens.
            <br />
            Instant delivery. Secure blockchain transaction.
          </p>
        </div>

        {isLoadingPackages ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardHeader className='h-32' />
                <CardContent className='h-24' />
                <CardFooter className='h-20' />
              </Card>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {umpPackages.map((pkg) => {
              const umpAmount = pkg.metadata?.ump_amount || 0;
              const isBestValue = pkg.metadata?.best_value === true;

              return (
                <Card
                  key={pkg.id}
                  className={`relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_-5px_rgba(5,255,157,0.3)] group rounded-none ${
                    isBestValue
                      ? 'border-primary shadow-[0_0_20px_-10px_rgba(5,255,157,0.3)] scale-105 z-10'
                      : ''
                  }`}
                >
                  {isBestValue && (
                    <div className='absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1 skew-x-[-10deg] shadow-glow-green w-full text-center'>
                      Best Value
                    </div>
                  )}

                  <CardHeader className='pb-2 pt-10 text-center'>
                    <CardTitle className='flex flex-col items-center gap-2 text-4xl font-black italic tracking-tighter'>
                      <Coins className='w-10 h-10 text-primary group-hover:animate-pulse' />
                      {umpAmount}
                      <span className='text-sm font-bold text-muted-foreground not-italic tracking-widest'>
                        UMP
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='py-6 text-center'>
                    <div className='flex items-baseline justify-center gap-1'>
                      <span className='text-2xl font-bold text-foreground tracking-tight'>
                        {pkg.price}
                      </span>
                      <span className='text-sm text-muted-foreground font-bold'>
                        $TRUST
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full h-12 uppercase font-bold tracking-wider rounded-none ${
                        isBestValue
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green'
                          : 'bg-secondary hover:bg-secondary/80 text-foreground'
                      }`}
                      onClick={() => handlePurchase(pkg)}
                      disabled={isPending || isConfirming}
                    >
                      <div className='flex items-center gap-2'>
                        {isPending || isConfirming ? (
                          <span className='animate-pulse'>Processing...</span>
                        ) : (
                          <>
                            <Zap className='w-4 h-4 fill-current' />
                            Purchase
                          </>
                        )}
                      </div>
                    </Button>
                  </CardFooter>

                  {/* Decorative corners */}
                  <div className='absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity'></div>
                  <div className='absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity'></div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TopUp;
