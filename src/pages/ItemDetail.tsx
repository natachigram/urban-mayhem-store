import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  AlertCircle,
  Zap,
  Shield,
  Crosshair,
  Maximize2,
  Lock,
} from 'lucide-react';
import { useItemDetail } from '@/hooks/useSupabase';
import { ItemDetailSkeleton } from '@/components/ui/skeletons';

const rarityColors = {
  common: 'text-rarity-common border-rarity-common bg-rarity-common/10',
  rare: 'text-rarity-rare border-rarity-rare bg-rarity-rare/10',
  epic: 'text-rarity-epic border-rarity-epic bg-rarity-epic/10',
  legendary:
    'text-rarity-legendary border-rarity-legendary bg-rarity-legendary/10',
};

const ItemDetail = () => {
  const { id } = useParams();
  const { data: item, isLoading, error } = useItemDetail(id);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <main className='container py-8'>
          <div className='mb-6'>
            <Link
              to='/'
              className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Store
            </Link>
          </div>
          <ItemDetailSkeleton />
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <div className='container py-24 text-center space-y-6'>
          <h1 className='text-4xl font-bold mb-4 text-foreground'>
            Item Not Found
          </h1>
          <Alert
            variant='destructive'
            className='max-w-md mx-auto bg-destructive/10 border-destructive/20 text-destructive'
          >
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error?.message ||
                'This item does not exist or has been removed.'}
            </AlertDescription>
          </Alert>
          <Link to='/'>
            <Button variant='outline' className='uppercase tracking-wider'>
              Return to Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header />

      <main className='container py-8'>
        {/* Back Button */}
        <Link
          to='/'
          className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium mb-8'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Store
        </Link>

        <div className='grid lg:grid-cols-2 gap-12 items-start'>
          {/* Image Gallery */}
          <div className='space-y-4'>
            <div className='relative aspect-square overflow-hidden rounded-sm border border-border/50 bg-secondary/20 group'>
              <img
                src={item.image_url}
                alt={item.name}
                className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-105'
              />

              {/* Gradient Overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent'></div>

              {/* Rarity Badge */}
              <Badge
                variant='outline'
                className={`absolute right-4 top-4 uppercase tracking-widest text-xs font-bold px-3 py-1 ${
                  rarityColors[item.rarity]
                } backdrop-blur-md`}
              >
                {item.rarity}
              </Badge>

              <Button
                size='icon'
                variant='ghost'
                className='absolute bottom-4 right-4 text-muted-foreground hover:text-foreground hover:bg-background/50'
              >
                <Maximize2 className='h-5 w-5' />
              </Button>
            </div>
          </div>

          {/* Item Details */}
          <div className='space-y-8'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Badge
                  variant='secondary'
                  className='uppercase tracking-widest text-[10px] font-bold bg-secondary text-muted-foreground hover:bg-secondary'
                >
                  {item.type}
                </Badge>
                {item.is_featured && (
                  <Badge
                    variant='default'
                    className='uppercase tracking-widest text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary'
                  >
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className='text-5xl font-bold mb-4 tracking-tight text-foreground'>
                {item.name}
              </h1>

              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <Shield className='h-4 w-4' />
                  Official Item
                </span>
                <span className='w-1 h-1 rounded-full bg-muted-foreground/50'></span>
                <span className='flex items-center gap-1'>
                  <Crosshair className='h-4 w-4' />
                  Season 5 Ready
                </span>
              </div>
            </div>

            <Separator className='bg-border/50' />

            {/* Price & Actions */}
            <div className='flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-card border border-border/50 rounded-sm'>
              <div>
                <p className='text-sm text-muted-foreground uppercase tracking-wider mb-1'>
                  Price
                </p>
                <div className='flex items-center gap-2'>
                  <Zap className='h-6 w-6 text-primary fill-primary' />
                  <span className='text-4xl font-bold text-foreground tracking-tight'>
                    {item.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className='flex gap-3 sm:ml-auto w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='flex-1 sm:flex-none gap-2 uppercase tracking-wider font-bold h-14 px-8 bg-secondary text-muted-foreground cursor-not-allowed opacity-80'
                  disabled
                >
                  <Lock className='h-5 w-5' />
                  Coming Soon
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className='text-lg font-bold mb-3 uppercase tracking-wider text-foreground'>
                Description
              </h2>
              <p className='text-muted-foreground leading-relaxed text-lg'>
                {item.description}
              </p>
              {item.long_description && (
                <div className='mt-4 prose prose-invert max-w-none'>
                  <p className='text-muted-foreground whitespace-pre-line leading-relaxed'>
                    {item.long_description}
                  </p>
                </div>
              )}
            </div>

            {item.stats && Object.keys(item.stats).length > 0 && (
              <>
                <Separator className='bg-border/50' />

                {/* Stats */}
                <div>
                  <h2 className='text-lg font-bold mb-6 uppercase tracking-wider text-foreground'>
                    Specifications
                  </h2>
                  <div className='grid gap-4'>
                    {Object.entries(item.stats).map(([stat, value]) => (
                      <div key={stat} className='group'>
                        <div className='flex justify-between text-sm mb-2'>
                          <span className='capitalize text-muted-foreground font-medium group-hover:text-primary transition-colors'>
                            {stat}
                          </span>
                          <span className='font-bold text-foreground'>
                            {value}
                          </span>
                        </div>
                        <div className='h-1.5 bg-secondary rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-primary shadow-glow-green'
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetail;
