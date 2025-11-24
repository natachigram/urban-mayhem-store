import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Item } from '@/types/database';

export interface ItemCardProps {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Pass full item for cart
  item?: Item;
}

const rarityColors = {
  common: 'text-rarity-common border-rarity-common bg-rarity-common/10',
  rare: 'text-rarity-rare border-rarity-rare bg-rarity-rare/10',
  epic: 'text-rarity-epic border-rarity-epic bg-rarity-epic/10',
  legendary:
    'text-rarity-legendary border-rarity-legendary bg-rarity-legendary/10',
};

const rarityBorders = {
  common: 'border-rarity-common',
  rare: 'border-rarity-rare',
  epic: 'border-rarity-epic',
  legendary: 'border-rarity-legendary',
};

export const ItemCard = ({
  id,
  name,
  type,
  imageUrl,
  price,
  rarity,
}: ItemCardProps) => {
  return (
    <Link to={`/item/${id}`}>
      <Card
        className={`group relative overflow-hidden border bg-card transition-all hover:scale-[1.02] hover:shadow-lg ${
          rarityBorders[rarity]
        } hover:shadow-${
          rarity === 'rare'
            ? 'glow-blue'
            : rarity === 'legendary'
            ? 'glow-primary'
            : 'none'
        }`}
      >
        {/* Image Container */}
        <div className='relative aspect-[4/3] overflow-hidden bg-secondary/20'>
          <img
            src={imageUrl}
            alt={name}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
          />

          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80'></div>

          {/* Rarity Badge */}
          <Badge
            variant='outline'
            className={`absolute left-2 top-2 uppercase tracking-wider text-[10px] font-bold ${rarityColors[rarity]} backdrop-blur-md border`}
          >
            {rarity}
          </Badge>
        </div>

        {/* Content */}
        <div className='p-4 relative'>
          <div className='mb-3'>
            <p className='text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1'>
              {type}
            </p>
            <h3 className='text-lg font-bold text-foreground line-clamp-1 tracking-tight group-hover:text-primary transition-colors'>
              {name}
            </h3>
          </div>

          {/* Price and Action */}
          <div className='flex items-center justify-between mt-4'>
            <div className='flex items-center gap-1.5'>
              <Zap className='w-4 h-4 text-primary fill-primary' />
              <span className='text-xl font-bold text-foreground'>
                {price.toLocaleString()}
              </span>
            </div>

            <Button
              size='sm'
              variant='secondary'
              className='gap-2 font-bold uppercase tracking-wider text-xs h-8'
            >
              <Eye className='h-3.5 w-3.5' />
              View
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
