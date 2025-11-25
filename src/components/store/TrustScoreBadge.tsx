/**
 * TrustScoreBadge Component
 * Displays community trust score for items
 */

import { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateTrustScore, getCachedAtom } from '@/services/intuition';

interface TrustScoreBadgeProps {
  itemId: string;
  variant?: 'default' | 'compact';
}

export const TrustScoreBadge = ({
  itemId,
  variant = 'default',
}: TrustScoreBadgeProps) => {
  const [trustScore, setTrustScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        // First try to get item data to find identifier
        const { supabase } = await import('@/services/supabase');
        const { data: item } = await supabase
          .from('items')
          .select('identifier')
          .eq('id', itemId)
          .single();

        const entityId = item?.identifier || itemId;
        
        const itemAtom = await getCachedAtom('item', entityId);
        if (itemAtom) {
          const score = await calculateTrustScore(itemAtom.atom_id);
          setTrustScore(score);
        }
      } catch (error) {
        console.error('Failed to fetch trust score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrustScore();
  }, [itemId]);

  if (loading) {
    return <Skeleton className='h-6 w-20' />;
  }

  if (!trustScore || trustScore.attestationCount === 0) {
    return (
      <Badge variant='outline' className='gap-1'>
        <Star className='h-3 w-3' />
        <span className='text-xs'>No ratings</span>
      </Badge>
    );
  }

  const scoreColor =
    trustScore.score >= 70
      ? 'text-green-500'
      : trustScore.score >= 40
      ? 'text-yellow-500'
      : 'text-red-500';

  const scoreBg =
    trustScore.score >= 70
      ? 'bg-green-500/10 border-green-500/30'
      : trustScore.score >= 40
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-red-500/10 border-red-500/30';

  if (variant === 'compact') {
    return (
      <Badge className={`gap-1 ${scoreBg}`}>
        <Star className={`h-3 w-3 ${scoreColor}`} fill='currentColor' />
        <span className={`text-xs font-bold ${scoreColor}`}>
          {Math.round(trustScore.score)}%
        </span>
      </Badge>
    );
  }

  return (
    <div className='flex flex-col gap-1'>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${scoreBg}`}
      >
        <Star className={`h-4 w-4 ${scoreColor}`} fill='currentColor' />
        <div className='flex flex-col'>
          <span className={`text-sm font-bold ${scoreColor}`}>
            {Math.round(trustScore.score)}% Trust
          </span>
          <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
            <Users className='h-3 w-3' />
            {trustScore.attestationCount} ratings
          </span>
        </div>
      </div>

      <div className='flex gap-2 text-xs'>
        <div className='flex items-center gap-1 text-green-500'>
          <TrendingUp className='h-3 w-3' />
          {(Number(trustScore.positiveStake) / 10 ** 18).toFixed(2)} $TRUST
        </div>
        <div className='flex items-center gap-1 text-red-500'>
          <TrendingDown className='h-3 w-3' />
          {(Number(trustScore.negativeStake) / 10 ** 18).toFixed(2)} $TRUST
        </div>
      </div>
    </div>
  );
};
