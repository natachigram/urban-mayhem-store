import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/useCart';
import { CheckoutModal } from './CheckoutModal';
import { useState } from 'react';

export const CartSheet = () => {
  const { cart, total, itemCount, updateQuantity, remove, clear } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='relative border-primary/50 hover:bg-primary/10 hover:text-primary rounded-none h-10 w-10'
        >
          <ShoppingCart className='h-5 w-5' />
          {itemCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold rounded-none bg-primary text-primary-foreground border border-background'
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full sm:max-w-lg flex flex-col bg-background border-l border-primary/20 p-0 gap-0'>
        <SheetHeader className='p-6 border-b border-border/50 bg-secondary/20'>
          <SheetTitle className='flex items-center justify-between'>
            <span className='text-xl font-black uppercase italic tracking-wider flex items-center gap-2'>
              <ShoppingCart className='h-5 w-5 text-primary' />
              Loadout
            </span>
            {cart.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clear}
                className='text-destructive hover:text-destructive hover:bg-destructive/10 uppercase text-xs font-bold tracking-wider h-8'
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className='flex-1 flex flex-col items-center justify-center text-center p-8'>
            <div className='h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-border/50'>
              <ShoppingCart className='h-10 w-10 text-muted-foreground/50' />
            </div>
            <h3 className='text-xl font-bold uppercase tracking-wide mb-2'>
              Loadout Empty
            </h3>
            <p className='text-muted-foreground max-w-[200px]'>
              Equip items from the store to prepare for deployment.
            </p>
            <Button
              variant='outline'
              className='mt-6 uppercase font-bold tracking-wider border-primary/50 text-primary hover:bg-primary/10'
              onClick={() => setIsOpen(false)}
            >
              Return to Store
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className='flex-1 px-6'>
              <div className='space-y-4 py-6'>
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className='flex gap-4 bg-card/50 p-3 border border-border/50 hover:border-primary/30 transition-colors group'
                  >
                    <div className='h-20 w-20 bg-secondary/30 overflow-hidden border border-border/30 relative'>
                      <img
                        src={cartItem.item.image_url}
                        alt={cartItem.item.name}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute bottom-0 left-0 w-full h-1 bg-primary/50'></div>
                    </div>

                    <div className='flex-1 min-w-0 flex flex-col justify-between'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-bold uppercase tracking-wide truncate text-sm'>
                            {cartItem.item.name}
                          </h4>
                          <div className='flex items-center gap-1 text-primary text-xs font-bold mt-1'>
                            <Zap className='h-3 w-3 fill-primary' />
                            {cartItem.item.price}
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none'
                          onClick={() => remove(cartItem.item.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>

                      <div className='flex items-center justify-between mt-2'>
                        <div className='flex items-center border border-border/50 bg-background'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 rounded-none hover:bg-secondary'
                            onClick={() =>
                              updateQuantity(
                                cartItem.item.id,
                                cartItem.quantity - 1
                              )
                            }
                            disabled={cartItem.quantity <= 1}
                          >
                            <Minus className='h-3 w-3' />
                          </Button>
                          <span className='w-8 text-center font-mono text-xs'>
                            {cartItem.quantity}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 rounded-none hover:bg-secondary'
                            onClick={() =>
                              updateQuantity(
                                cartItem.item.id,
                                cartItem.quantity + 1
                              )
                            }
                          >
                            <Plus className='h-3 w-3' />
                          </Button>
                        </div>

                        <span className='font-bold text-foreground text-sm'>
                          {(
                            cartItem.item.price * cartItem.quantity
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className='p-6 border-t border-border/50 bg-secondary/10 space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground uppercase tracking-wider text-sm font-bold'>
                  Total Cost
                </span>
                <div className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-primary fill-primary' />
                  <span className='text-2xl font-black text-primary shadow-glow-green'>
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                className='w-full h-12 uppercase font-bold tracking-wider text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green rounded-none'
                size='lg'
                onClick={handleCheckout}
              >
                Confirm Loadout
              </Button>

              <div className='flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest'>
                <ShieldAlert className='h-3 w-3' />
                Non-Refundable Transaction
              </div>
            </div>
          </>
        )}

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
