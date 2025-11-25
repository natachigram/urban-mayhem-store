import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Zap, Loader2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { usePayment } from '@/hooks/usePayment';
import { getItemsByType, type Item } from '@/services/items';

export const UMPSection = () => {
  const [selectedPackage, setSelectedPackage] = useState<Item | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [packages, setPackages] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useAccount();
  const { pay, isProcessing } = usePayment();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    const data = await getItemsByType('ump');
    setPackages(data);
    setIsLoading(false);
  };

  const handleBuyClick = (pkg: Item) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    setSelectedPackage(pkg);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    if (!playerId.trim()) {
      toast.error('Please enter your Player ID');
      return;
    }

    const result = await pay(
      selectedPackage.id,
      playerId,
      selectedPackage.price,
      1
    );

    if (result.success) {
      setSelectedPackage(null);
      setPlayerId('');
    }
  };

  return (
    <section className='space-y-8'>
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl font-black uppercase italic tracking-tighter text-foreground'>
          Buy <span className='text-primary'>UMP</span>
        </h2>
        <div className='text-sm text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-2'>
          <Zap className='h-4 w-4 text-electric-blue' />
          Powered by Intuition Trust Protocol
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : packages.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-muted-foreground text-lg'>No packages available</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group overflow-hidden ${
                pkg.metadata?.best_value
                  ? 'border-primary/50 shadow-glow-green'
                  : ''
              }`}
            >
              {pkg.metadata?.best_value && (
                <div className='absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider z-10'>
                  Best Value
                </div>
              )}

              <CardHeader className='text-center pb-2'>
                <CardTitle className='text-lg font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors'>
                  {pkg.name}
                </CardTitle>
              </CardHeader>

              <CardContent className='text-center space-y-4'>
                <div className='flex items-center justify-center gap-2 text-4xl font-black text-foreground italic tracking-tighter'>
                  <Coins className='h-8 w-8 text-primary' />
                  {pkg.metadata?.ump_amount?.toLocaleString() || 0}
                </div>

                <div className='h-px w-full bg-gradient-to-r from-transparent via-border to-transparent' />

                <div className='flex items-center justify-center gap-2 text-xl font-bold text-electric-blue'>
                  <Zap className='h-5 w-5' />
                  {pkg.price} $TRUST
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className='w-full uppercase font-bold tracking-wider bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300 border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={() => handleBuyClick(pkg)}
                  disabled={!isConnected || isProcessing}
                >
                  {isProcessing ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Processing...
                    </div>
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </CardFooter>

              {/* Hover Effect */}
              <div className='absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <Dialog
        open={!!selectedPackage}
        onOpenChange={(open) => !open && setSelectedPackage(null)}
      >
        <DialogContent className='bg-card border-border/50 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2'>
              Confirm <span className='text-primary'>Purchase</span>
            </DialogTitle>
            <DialogDescription>
              You are about to exchange $TRUST for UMP.
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className='space-y-6 py-4'>
              <div className='flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-border/50'>
                <div className='text-sm text-muted-foreground uppercase font-bold'>
                  Package
                </div>
                <div className='font-bold text-foreground'>
                  {selectedPackage.name}
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='playerId'
                  className='text-sm uppercase font-bold text-muted-foreground flex items-center gap-2'
                >
                  <User className='h-4 w-4' />
                  Player ID
                </Label>
                <Input
                  id='playerId'
                  placeholder='Enter your Player ID...'
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className='bg-secondary/20 border-border/50 focus:border-primary/50 font-mono'
                />
                <p className='text-xs text-muted-foreground'>
                  Required to link purchase to your game account
                </p>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <span className='text-sm text-muted-foreground uppercase font-bold'>
                    You Pay
                  </span>
                  <div className='flex items-center gap-2 text-xl font-bold text-electric-blue'>
                    <Zap className='h-5 w-5' />
                    {selectedPackage.price} $TRUST
                  </div>
                </div>

                <div className='h-8 w-px bg-border/50' />

                <div className='flex flex-col items-end'>
                  <span className='text-sm text-muted-foreground uppercase font-bold'>
                    You Get
                  </span>
                  <div className='flex items-center gap-2 text-xl font-bold text-primary'>
                    <Coins className='h-5 w-5' />
                    {selectedPackage.metadata?.ump_amount?.toLocaleString() ||
                      0}{' '}
                    UMP
                  </div>
                </div>
              </div>

              <Button
                className='w-full h-12 text-lg font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green'
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  'Confirm Transaction'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
