import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingUp, Coins, Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { SkinDetailModal } from './SkinDetailModal';
import type { Item } from '@/services/items';

interface TopRatedItem extends Item {
  trust_score: number;
  attestation_count: number;
}

export const TopRatedSection = () => {
  const [topRatedItems, setTopRatedItems] = useState<TopRatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    loadTopRated();
  }, []);

  const loadTopRated = async () => {
    try {
      setIsLoading(true);

      // Get all skin items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'skin')
        .limit(20);

      if (itemsError || !items || items.length === 0) {
        setIsLoading(false);
        return;
      }

      // For each item, get its trust score
      const itemsWithScores = await Promise.all(
        items.map(async (item) => {
          try {
            // Get identifier
            const identifier = item.identifier || item.id;

            // Get atom
            const { data: atom } = await supabase
              .from('atoms')
              .select('atom_id')
              .eq('entity_type', 'item')
              .eq('entity_id', identifier)
              .maybeSingle();

            if (!atom) {
              return { ...item, trust_score: 0, attestation_count: 0 };
            }

            // Get trust score
            const { data: trustData } = await supabase
              .from('trust_scores')
              .select('score')
              .eq('atom_id', atom.atom_id)
              .maybeSingle();

            // Get attestation count
            const { data: metrics } = await supabase
              .from('item_social_metrics')
              .select('unique_raters')
              .eq('atom_id', atom.atom_id)
              .maybeSingle();

            return {
              ...item,
              trust_score: trustData?.score || 0,
              attestation_count: metrics?.unique_raters || 0,
            };
          } catch (err) {
            console.error('Error getting scores for item:', item.id, err);
            return { ...item, trust_score: 0, attestation_count: 0 };
          }
        })
      );

      // Filter items with trust scores and sort
      const topItems = itemsWithScores
        .filter((item) => item.trust_score > 0 && item.attestation_count >= 1)
        .sort((a, b) => b.trust_score - a.trust_score)
        .slice(0, 6);

      setTopRatedItems(topItems);
    } catch (error) {
      console.error('Failed to load top rated items:', error);
      setTopRatedItems([]);
    } finally {
      setIsLoading(false);
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

  const handlePurchase = async (itemId: string) => {
    // Placeholder - handled by modal
  };

  if (isLoading) {
    return (
      <section className='space-y-6'>
        <div className='flex items-center gap-3'>
          <Trophy className='h-6 w-6 text-yellow-500' />
          <h2 className='text-2xl font-black uppercase italic tracking-tighter text-foreground'>
            Top <span className='text-yellow-500'>Rated</span>
          </h2>
        </div>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      </section>
    );
  }

  if (topRatedItems.length === 0) {
    return null; // Don't show section if no top rated items
  }

  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Trophy className='h-6 w-6 text-yellow-500' />
          <h2 className='text-2xl font-black uppercase italic tracking-tighter text-foreground'>
            Top <span className='text-yellow-500'>Rated</span> by Community
          </h2>
        </div>
        <Badge
          variant='outline'
          className='bg-yellow-500/10 text-yellow-500 border-yellow-500/30 uppercase text-xs'
        >
          <TrendingUp className='h-3 w-3 mr-1' />
          Most Trusted
        </Badge>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {topRatedItems.map((item) => (
          <Card
            key={item.id}
            className='group relative border-border/50 bg-card/50 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 cursor-pointer'
            onClick={() => setSelectedItem(item)}
          >
            {/* Top Rated Badge */}
            <div className='absolute top-1 left-1 z-10'>
              <Badge
                variant='outline'
                className='bg-yellow-500/90 text-black border-yellow-500 text-[9px] px-1 py-0 font-black'
              >
                <Trophy className='h-2.5 w-2.5 mr-0.5' />
                TOP
              </Badge>
            </div>

            {/* Trust Score Badge */}
            <div className='absolute top-1 right-1 z-10'>
              <div className='bg-background/95 backdrop-blur-sm px-1.5 py-0.5 rounded-sm border border-border/50 flex items-center gap-1'>
                <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                <span className='text-[10px] font-bold'>
                  {item.trust_score.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Image */}
            <div className='aspect-[3/4] relative overflow-hidden bg-gradient-to-b from-secondary/20 to-background p-2 flex items-center justify-center'>
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
              <img
                src={item.gallery_images?.[1] || item.image_url}
                alt={item.name}
                className='w-full h-full object-contain transition-transform duration-500 group-hover:scale-110'
              />
            </div>

            <CardContent className='p-2 space-y-1 relative z-10 bg-card/90 backdrop-blur-sm border-t border-border/50'>
              <h3 className='font-bold uppercase tracking-wider text-[10px] truncate group-hover:text-yellow-500 transition-colors'>
                {item.name}
              </h3>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1 text-primary font-black text-xs'>
                  <Coins className='h-3 w-3' />
                  {item.price.toLocaleString()}
                </div>
                <div className='text-[9px] text-muted-foreground'>
                  {item.attestation_count} ratings
                </div>
              </div>
            </CardContent>

            {/* Hover Glow */}
            <div className='absolute inset-0 border-2 border-yellow-500/0 group-hover:border-yellow-500/50 transition-all duration-300 pointer-events-none' />
          </Card>
        ))}
      </div>

      <SkinDetailModal
        skin={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onPurchase={handlePurchase}
      />
    </section>
  );
};
