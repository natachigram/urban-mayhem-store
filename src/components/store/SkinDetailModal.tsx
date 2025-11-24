import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Coins,
  Check,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Users,
  Activity,
  User,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { usePayment } from '@/hooks/usePayment';
import { TrustScoreBadge } from './TrustScoreBadge';
import { RateItemModal } from './RateItemModal';

interface Skin {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  image_url: string;
  description?: string;
  owned?: boolean;
  trustScore?: number;
  attestations?: number;
}

interface SkinDetailModalProps {
  skin: Skin | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (skinId: string) => Promise<void>;
}

export const SkinDetailModal = ({
  skin,
  isOpen,
  onClose,
  onPurchase,
}: SkinDetailModalProps) => {
  const [playerId, setPlayerId] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const { pay, isProcessing: isPurchasing } = usePayment();

  if (!skin) return null;

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!playerId.trim()) {
      toast.error('Please enter your Player ID');
      return;
    }

    const result = await pay(skin.id, playerId, skin.price, 1);

    if (result.success) {
      setPlayerId('');
      onClose();
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'epic':
        return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
      case 'rare':
        return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
      default:
        return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-blue-400';
    return 'text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='bg-card border-border/50 sm:max-w-4xl p-0 overflow-hidden gap-0 flex flex-col md:flex-row h-[80vh] md:h-[600px]'>
        {/* Left Side - Preview */}
        <div className='relative flex-1 bg-gradient-to-b from-secondary/20 to-background flex items-center justify-center p-8 overflow-hidden group'>
          {/* Grid Background */}
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20' />

          {/* Controls */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 rounded-full bg-background/50 backdrop-blur border-border/50'
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 rounded-full bg-background/50 backdrop-blur border-border/50'
              onClick={() => setRotation((r) => r - 45)}
            >
              <RotateCw className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 rounded-full bg-background/50 backdrop-blur border-border/50'
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            >
              <ZoomIn className='h-4 w-4' />
            </Button>
          </div>

          {/* Image */}
          <div
            className='relative z-0 transition-all duration-500 ease-out'
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={skin.image_url}
              alt={skin.name}
              className='max-h-[400px] w-auto object-contain drop-shadow-[0_0_30px_rgba(5,255,157,0.2)]'
            />
          </div>
        </div>

        {/* Right Side - Details */}
        <div className='w-full md:w-[400px] bg-card border-l border-border/50 p-8 flex flex-col overflow-y-auto'>
          <div className='flex-1 space-y-6'>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Badge
                  variant='outline'
                  className={`uppercase tracking-wider font-bold ${getRarityColor(
                    skin.rarity
                  )}`}
                >
                  {skin.rarity}
                </Badge>
                {skin.trustScore && (
                  <div className='flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-sm border border-border/50'>
                    <ShieldCheck
                      className={`h-3.5 w-3.5 ${getTrustColor(
                        skin.trustScore
                      )}`}
                    />
                    <span
                      className={`text-xs font-black ${getTrustColor(
                        skin.trustScore
                      )}`}
                    >
                      {skin.trustScore}% TRUST
                    </span>
                  </div>
                )}
              </div>
              <h2 className='text-3xl font-black uppercase italic tracking-tighter text-foreground'>
                {skin.name}
              </h2>
            </div>

            {/* Trust Analysis Section */}
            <div className='p-4 bg-secondary/10 rounded-lg border border-border/50 space-y-3'>
              <div className='flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground'>
                <Activity className='h-4 w-4 text-primary' />
                Intuition Protocol Analysis
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-[10px] uppercase text-muted-foreground font-bold'>
                    Community Rating
                  </div>
                  <div className='text-lg font-black text-foreground flex items-center gap-1'>
                    {skin.trustScore
                      ? (skin.trustScore / 10).toFixed(1)
                      : '0.0'}
                    <span className='text-xs text-muted-foreground font-medium'>
                      / 10
                    </span>
                  </div>
                </div>
                <div>
                  <div className='text-[10px] uppercase text-muted-foreground font-bold'>
                    Attestations
                  </div>
                  <div className='text-lg font-black text-foreground flex items-center gap-1'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    {skin.attestations?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Trust Score Display */}
              <div className='p-4 bg-secondary/20 rounded-lg border border-border/50'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-bold uppercase text-muted-foreground'>
                    Community Trust
                  </h3>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setRateModalOpen(true)}
                    className='h-7 text-xs gap-1.5'
                  >
                    <Star className='h-3.5 w-3.5' />
                    Rate
                  </Button>
                </div>
                <TrustScoreBadge itemId={skin.id} variant='default' />
              </div>

              <div className='p-4 bg-secondary/20 rounded-lg border border-border/50'>
                <h3 className='text-sm font-bold uppercase text-muted-foreground mb-2'>
                  Description
                </h3>
                <p className='text-sm text-foreground/80 leading-relaxed'>
                  {skin.description ||
                    'High-quality tactical gear for urban operations. Engineered for maximum durability and style in the field.'}
                </p>
              </div>
            </div>
          </div>

          <div className='mt-auto pt-6 border-t border-border/50 space-y-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='playerIdSkin'
                className='text-xs uppercase font-bold text-muted-foreground flex items-center gap-2'
              >
                <User className='h-3.5 w-3.5' />
                Player ID
              </Label>
              <Input
                id='playerIdSkin'
                placeholder='Enter your Player ID...'
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className='bg-secondary/20 border-border/50 focus:border-primary/50 font-mono h-10'
              />
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm font-bold uppercase text-muted-foreground'>
                Price
              </span>
              <div className='flex items-center gap-2 text-2xl font-black text-electric-blue'>
                <Coins className='h-6 w-6' />
                {skin.price.toLocaleString()} $TRUST
              </div>
            </div>

            <Button
              className={`w-full h-14 text-lg font-bold uppercase tracking-wider ${
                skin.owned
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green'
              }`}
              onClick={handlePurchase}
              disabled={isPurchasing || skin.owned}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Processing...
                </>
              ) : skin.owned ? (
                <>
                  <Check className='mr-2 h-5 w-5' />
                  Owned
                </>
              ) : (
                'Purchase Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Rate Item Modal */}
      <RateItemModal
        open={rateModalOpen}
        onOpenChange={setRateModalOpen}
        itemId={skin.id}
        itemName={skin.name}
        onSuccess={() => {
          toast.success('Thank you for your rating!');
        }}
      />
    </Dialog>
  );
};
