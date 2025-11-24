import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal = ({ isOpen, onClose }: CheckoutModalProps) => {
  const { address, isConnected } = useAccount();
  const { cart, total, clear } = useCart();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsPurchasing(true);

    // Simulate purchase processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Implement actual blockchain transaction
    // This would involve:
    // 1. Smart contract interaction for payment
    // 2. Supabase edge function call to record purchase
    // 3. NFT minting if applicable
    console.log('Purchase initiated:', {
      buyer: address,
      items: cart,
      total,
    });

    setIsPurchasing(false);
    setPurchaseSuccess(true);

    toast.success('Purchase successful!', {
      description: 'Items will be available in your inventory shortly.',
    });

    // Clear cart and close modal after success
    setTimeout(() => {
      clear();
      setPurchaseSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md bg-card border-border/50 p-0 overflow-hidden gap-0'>
        <div className='p-6 bg-secondary/20 border-b border-border/50'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold uppercase tracking-wider flex items-center gap-2'>
              <ShieldCheck className='h-5 w-5 text-primary' />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription className='text-muted-foreground'>
              Review your items and confirm transaction
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='p-6 space-y-6'>
          {!isConnected ? (
            <Alert className='bg-destructive/10 border-destructive/20 text-destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Please connect your wallet to complete the purchase.
              </AlertDescription>
            </Alert>
          ) : (
            <div className='space-y-6'>
              {/* Order Summary */}
              <div className='space-y-3'>
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className='flex justify-between text-sm items-center'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='h-10 w-10 rounded bg-secondary/30 overflow-hidden'>
                        <img
                          src={cartItem.item.image_url}
                          alt={cartItem.item.name}
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div>
                        <span className='text-foreground font-medium block'>
                          {cartItem.item.name}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          Qty: {cartItem.quantity}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Zap className='h-3 w-3 text-primary fill-primary' />
                      <span className='font-bold text-foreground'>
                        {(
                          cartItem.item.price * cartItem.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className='bg-border/50' />

              {/* Total */}
              <div className='flex justify-between items-center'>
                <span className='text-muted-foreground uppercase tracking-wider text-sm font-bold'>
                  Total Amount
                </span>
                <div className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-primary fill-primary' />
                  <span className='text-2xl font-bold text-primary shadow-glow-green rounded-sm px-1'>
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Wallet Info */}
              <div className='rounded-sm bg-secondary/30 border border-border/30 p-3 flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm'>
                  <Wallet className='h-4 w-4 text-muted-foreground' />
                  <span className='text-muted-foreground'>Wallet:</span>
                </div>
                <span className='font-mono text-xs bg-background px-2 py-1 rounded text-foreground border border-border/30'>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>

              {/* Success/Error States */}
              {purchaseSuccess && (
                <Alert className='border-primary/50 bg-primary/10 text-primary'>
                  <CheckCircle2 className='h-4 w-4' />
                  <AlertDescription>
                    Purchase completed successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Purchase Button */}
              <Button
                className={`w-full h-12 uppercase tracking-wider font-bold ${
                  purchaseSuccess
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green'
                }`}
                size='lg'
                onClick={handlePurchase}
                disabled={isPurchasing || purchaseSuccess}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing Transaction...
                  </>
                ) : purchaseSuccess ? (
                  <>
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    Confirmed
                  </>
                ) : (
                  `Confirm Payment`
                )}
              </Button>

              {/* Disclaimer */}
              <p className='text-[10px] text-center text-muted-foreground uppercase tracking-wide'>
                Secure transaction powered by Urban Mayhem Protocol
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
