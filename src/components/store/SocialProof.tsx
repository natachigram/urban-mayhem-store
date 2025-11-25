/**
 * SocialProof Component
 * Displays social proof metrics for items (rating count, top-rated badges)
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trophy, Users, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface SocialProofProps {
  itemId: string;
  compact?: boolean;
  refreshKey?: number; // Increment to force refresh
}

interface SocialMetrics {
  total_attestations: number;
  unique_raters: number;
  positive_count: number;
  negative_count: number;
  comment_count: number;
  trust_score: number;
}

export const SocialProof = ({ itemId, compact = false, refreshKey = 0 }: SocialProofProps) => {
  const [metrics, setMetrics] = useState<SocialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [itemId, refreshKey]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);

      // Get item identifier first (atoms use identifier, not UUID)
      const { data: item } = await supabase
        .from('items')
        .select('identifier')
        .eq('id', itemId)
        .single();

      if (!item?.identifier) {
        setMetrics({
          total_attestations: 0,
          unique_raters: 0,
          positive_count: 0,
          negative_count: 0,
          comment_count: 0,
          trust_score: 0,
        });
        setIsLoading(false);
        return;
      }

      // Get atom ID for this item using identifier
      const { data: atom } = await supabase
        .from('atoms')
        .select('atom_id')
        .eq('entity_type', 'item')
        .eq('entity_id', item.identifier)
        .single();

      if (!atom) {
        setMetrics({
          total_attestations: 0,
          unique_raters: 0,
          positive_count: 0,
          negative_count: 0,
          comment_count: 0,
          trust_score: 0,
        });
        setIsLoading(false);
        return;
      }

      // Get social metrics from view
      const { data: viewData } = await supabase
        .from('item_social_metrics')
        .select('*')
        .eq('atom_id', atom.atom_id)
        .single();

      // Get trust score
      const { data: trustData } = await supabase
        .from('trust_scores')
        .select('score')
        .eq('atom_id', atom.atom_id)
        .single();

      if (viewData) {
        setMetrics({
          total_attestations: viewData.total_attestations || 0,
          unique_raters: viewData.unique_raters || 0,
          positive_count: viewData.positive_count || 0,
          negative_count: viewData.negative_count || 0,
          comment_count: viewData.comment_count || 0,
          trust_score: trustData?.score || 0,
        });
      } else {
        setMetrics({
          total_attestations: 0,
          unique_raters: 0,
          positive_count: 0,
          negative_count: 0,
          comment_count: 0,
          trust_score: trustData?.score || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load social metrics:', error);
      setMetrics({
        total_attestations: 0,
        unique_raters: 0,
        positive_count: 0,
        negative_count: 0,
        comment_count: 0,
        trust_score: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return compact ? (
      <Skeleton className='h-5 w-20' />
    ) : (
      <Skeleton className='h-8 w-full' />
    );
  }

  if (!metrics || metrics.total_attestations === 0) {
    return compact ? (
      <span className='text-xs text-muted-foreground'>No ratings yet</span>
    ) : null;
  }

  const isTopRated = metrics.trust_score >= 80 && metrics.unique_raters >= 5;
  const isTrending = metrics.total_attestations >= 10;
  const hasReviews = metrics.comment_count > 0;

  if (compact) {
    return (
      <div className='flex items-center gap-2 flex-wrap'>
        {/* Rating Percentage */}
        {metrics.trust_score > 0 && (
          <div className='flex items-center gap-1'>
            <Star className='h-3.5 w-3.5 text-yellow-500 fill-yellow-500' />
            <span className='text-sm font-bold text-foreground'>
              {metrics.trust_score.toFixed(0)}%
            </span>
          </div>
        )}

        {/* Number of Raters */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='text-xs text-muted-foreground flex items-center gap-1'>
                ({metrics.unique_raters}{' '}
                {metrics.unique_raters === 1 ? 'rating' : 'ratings'})
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {metrics.unique_raters}{' '}
                {metrics.unique_raters === 1 ? 'person has' : 'people have'}{' '}
                rated this
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                👍 {metrics.positive_count} positive • 👎{' '}
                {metrics.negative_count} negative
              </p>
              {hasReviews && (
                <p className='text-xs text-muted-foreground'>
                  💬 {metrics.comment_count} written{' '}
                  {metrics.comment_count === 1 ? 'review' : 'reviews'}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Top Rated Badge */}
        {isTopRated && (
          <Badge
            variant='default'
            className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px] px-1.5 py-0'
          >
            <Trophy className='h-2.5 w-2.5 mr-0.5' />
            Top
          </Badge>
        )}

        {/* Trending Badge */}
        {isTrending && !isTopRated && (
          <Badge
            variant='default'
            className='bg-blue-500/20 text-blue-500 border-blue-500/30 text-[10px] px-1.5 py-0'
          >
            <TrendingUp className='h-2.5 w-2.5 mr-0.5' />
            Hot
          </Badge>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <div className='space-y-3'>
      {/* Main Rating Display */}
      <div className='flex items-center gap-3'>
        {metrics.trust_score > 0 && (
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <Star className='h-5 w-5 text-yellow-500 fill-yellow-500' />
              <span className='text-2xl font-black text-foreground'>
                {metrics.trust_score.toFixed(0)}%
              </span>
            </div>
            <span className='text-sm text-muted-foreground'>
              ({metrics.unique_raters}{' '}
              {metrics.unique_raters === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}

        <div className='flex items-center gap-2 flex-wrap'>
          {isTopRated && (
            <Badge
              variant='default'
              className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
            >
              <Trophy className='h-3 w-3 mr-1' />
              Top Rated
            </Badge>
          )}

          {isTrending && (
            <Badge
              variant='default'
              className='bg-blue-500/20 text-blue-500 border-blue-500/30'
            >
              <TrendingUp className='h-3 w-3 mr-1' />
              Trending
            </Badge>
          )}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='flex items-center gap-1 cursor-help'>
                👍 {metrics.positive_count} positive
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Positive ratings (great, high quality, fair price)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='flex items-center gap-1 cursor-help'>
                👎 {metrics.negative_count} negative
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Negative ratings (bad, overpriced)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {hasReviews && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='flex items-center gap-1 cursor-help'>
                  💬 {metrics.comment_count}{' '}
                  {metrics.comment_count === 1 ? 'review' : 'reviews'}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Written reviews with detailed feedback</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
