import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Star,
  TrendingUp,
  Trophy,
  Zap,
  Shield,
  AlertCircle,
  Sparkles,
  Users,
  Loader2,
  ArrowUp,
  ArrowDown,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { formatDistanceToNow } from 'date-fns';
import { SkinDetailModal } from '@/components/store/SkinDetailModal';
import type { Item } from '@/services/items';

interface TrustMilestone {
  item: Item;
  trust_score: number;
  attestation_count: number;
  milestone_type: 'elite' | 'verified' | 'trusted';
}

interface TrendingItem {
  item: Item;
  trust_score: number;
  recent_attestations: number;
  trend_direction: 'up' | 'down';
}

interface RecentAttestation {
  id: string;
  created_at: string;
  creator_address: string;
  item_name: string;
  item_id: string;
  rating_type: string;
  comment?: string;
  trust_score: number;
}

const Activity = () => {
  const [milestones, setMilestones] = useState<TrustMilestone[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentAttestation[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttestations: 0,
    activeToday: 0,
    eliteItems: 0,
  });

  useEffect(() => {
    loadAllData();

    // Refresh every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadMilestones(),
      loadTrending(),
      loadRecentActivity(),
      loadStats(),
    ]);
    setIsLoading(false);
  };

  const loadMilestones = async () => {
    try {
      // Get all items
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'skin')
        .limit(20);

      if (!items) return;

      // Get trust scores for each item
      const itemsWithScores = await Promise.all(
        items.map(async (item) => {
          const identifier = item.identifier || item.id;

          const { data: atom } = await supabase
            .from('atoms')
            .select('atom_id')
            .eq('entity_type', 'item')
            .eq('entity_id', identifier)
            .maybeSingle();

          if (!atom) return null;

          const { data: trust } = await supabase
            .from('trust_scores')
            .select('score')
            .eq('atom_id', atom.atom_id)
            .maybeSingle();

          const { data: metrics } = await supabase
            .from('item_social_metrics')
            .select('unique_raters')
            .eq('atom_id', atom.atom_id)
            .maybeSingle();

          const score = trust?.score || 0;
          const count = metrics?.unique_raters || 0;

          return { item, trust_score: score, attestation_count: count };
        })
      );

      // Filter and categorize by milestone
      const milestonesData: TrustMilestone[] = itemsWithScores
        .filter(
          (i): i is NonNullable<typeof i> => i !== null && i.trust_score >= 70
        )
        .map((i) => ({
          ...i,
          milestone_type:
            i.trust_score >= 90
              ? 'elite'
              : i.trust_score >= 80
              ? 'verified'
              : 'trusted',
        }))
        .sort((a, b) => b.trust_score - a.trust_score)
        .slice(0, 6);

      setMilestones(milestonesData);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const loadTrending = async () => {
    try {
      // Get attestations from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data: recentAttestations } = await supabase
        .from('attestations')
        .select('subject_atom_id')
        .gte('created_at', yesterday.toISOString());

      if (!recentAttestations) return;

      // Count attestations per item
      const countMap = recentAttestations.reduce((acc, att) => {
        acc[att.subject_atom_id] = (acc[att.subject_atom_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top trending atom IDs
      const trendingAtomIds = Object.entries(countMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([atomId]) => atomId);

      // Get item details
      const trendingData = await Promise.all(
        trendingAtomIds.map(async (atomId) => {
          const { data: atom } = await supabase
            .from('atoms')
            .select('entity_id')
            .eq('atom_id', atomId)
            .eq('entity_type', 'item')
            .maybeSingle();

          if (!atom) return null;

          const { data: item } = await supabase
            .from('items')
            .select('*')
            .eq('identifier', atom.entity_id)
            .maybeSingle();

          const { data: trust } = await supabase
            .from('trust_scores')
            .select('score')
            .eq('atom_id', atomId)
            .maybeSingle();

          if (!item) return null;

          return {
            item,
            trust_score: trust?.score || 0,
            recent_attestations: countMap[atomId] || 0,
            trend_direction: 'up' as const,
          };
        })
      );

      setTrending(
        trendingData.filter((i): i is NonNullable<typeof i> => i !== null)
      );
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent attestations
      const { data: attestations, error } = await supabase
        .from('attestations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading attestations:', error);
        setRecentActivity([]);
        return;
      }

      if (attestations && attestations.length > 0) {
        // Get item details for each attestation
        const enriched = await Promise.all(
          attestations.map(async (att) => {
            try {
              // Get subject atom (the item being rated)
              const { data: subjectAtom } = await supabase
                .from('atoms')
                .select('entity_id, atom_id, entity_type')
                .eq('atom_id', att.subject_atom_id)
                .maybeSingle();

              if (!subjectAtom || subjectAtom.entity_type !== 'item') {
                return {
                  id: att.id,
                  created_at: att.created_at,
                  creator_address: att.creator_wallet || '',
                  item_name: 'Unknown Item',
                  item_id: '',
                  rating_type: 'neutral',
                  comment: '',
                  trust_score: 0,
                };
              }

              // Get predicate atom (the rating type: "is great", "is bad", etc.)
              const { data: predicateAtom } = await supabase
                .from('atoms')
                .select('entity_id')
                .eq('atom_id', att.predicate_atom_id)
                .maybeSingle();

              const predicateText = predicateAtom?.entity_id || '';
              const ratingType =
                predicateText.includes('great') ||
                predicateText.includes('high quality')
                  ? 'positive'
                  : predicateText.includes('bad') ||
                    predicateText.includes('overpriced')
                  ? 'negative'
                  : 'neutral';

              // Get item details using identifier
              const { data: item } = await supabase
                .from('items')
                .select('id, name')
                .eq('identifier', subjectAtom.entity_id)
                .maybeSingle();

              // Get trust score
              const { data: trust } = await supabase
                .from('trust_scores')
                .select('score')
                .eq('atom_id', subjectAtom.atom_id)
                .maybeSingle();

              return {
                id: att.id,
                created_at: att.created_at,
                creator_address: att.creator_wallet || '',
                item_name: item?.name || subjectAtom.entity_id,
                item_id: item?.id || '',
                rating_type: ratingType,
                comment: att.comment || att.metadata?.comment || '',
                trust_score: trust?.score || 0,
              };
            } catch (err) {
              console.error('Error enriching attestation:', err);
              return {
                id: att.id,
                created_at: att.created_at,
                creator_address: att.creator_wallet || '',
                item_name: 'Unknown Item',
                item_id: '',
                rating_type: 'neutral',
                comment: '',
                trust_score: 0,
              };
            }
          })
        );

        setRecentActivity(enriched);
      } else {
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      setRecentActivity([]);
    }
  };

  const loadStats = async () => {
    try {
      // Total attestations
      const { count: total } = await supabase
        .from('attestations')
        .select('*', { count: 'exact', head: true });

      // Attestations today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('attestations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Elite items (90%+ trust)
      const { count: elite } = await supabase
        .from('trust_scores')
        .select('*', { count: 'exact', head: true })
        .gte('score', 90);

      setStats({
        totalAttestations: total || 0,
        activeToday: todayCount || 0,
        eliteItems: elite || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'elite':
        return <Trophy className='h-5 w-5 text-yellow-500' />;
      case 'verified':
        return <Shield className='h-5 w-5 text-blue-400' />;
      default:
        return <Star className='h-5 w-5 text-primary' />;
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'elite':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'verified':
        return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      default:
        return 'from-primary/20 to-primary/5 border-primary/30';
    }
  };

  const getMilestoneBadgeColor = (type: string) => {
    switch (type) {
      case 'elite':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'verified':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return 'Anonymous';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header />

      <main className='container py-12 space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <Sparkles className='h-8 w-8 text-primary' />
            <h1 className='text-4xl font-black uppercase italic tracking-tighter'>
              Trust <span className='text-primary'>Intelligence</span>
            </h1>
          </div>
          <p className='text-muted-foreground text-lg'>
            Real-time trust insights powered by Intuition Protocol
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'>
            <div className='flex items-start justify-between'>
              <div>
                <div className='text-sm uppercase font-bold text-muted-foreground tracking-wider mb-2'>
                  Total Verifications
                </div>
                <div className='text-4xl font-black text-primary'>
                  {stats.totalAttestations.toLocaleString()}
                </div>
              </div>
              <Users className='h-10 w-10 text-primary/30' />
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20'>
            <div className='flex items-start justify-between'>
              <div>
                <div className='text-sm uppercase font-bold text-muted-foreground tracking-wider mb-2'>
                  Active Today
                </div>
                <div className='text-4xl font-black text-green-400'>
                  {stats.activeToday}
                </div>
              </div>
              <Zap className='h-10 w-10 text-green-400/30' />
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20'>
            <div className='flex items-start justify-between'>
              <div>
                <div className='text-sm uppercase font-bold text-muted-foreground tracking-wider mb-2'>
                  Elite Tier Items
                </div>
                <div className='text-4xl font-black text-yellow-400'>
                  {stats.eliteItems}
                </div>
              </div>
              <Trophy className='h-10 w-10 text-yellow-400/30' />
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <>
            {/* Trust Milestones */}
            {milestones.length > 0 && (
              <section className='space-y-6'>
                <div className='flex items-center gap-3'>
                  <Trophy className='h-6 w-6 text-yellow-500' />
                  <h2 className='text-2xl font-black uppercase italic tracking-tighter'>
                    Trust <span className='text-yellow-500'>Milestones</span>
                  </h2>
                  <Badge
                    variant='outline'
                    className='bg-yellow-500/10 text-yellow-500 border-yellow-500/30 uppercase text-xs'
                  >
                    Elite Verified Items
                  </Badge>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {milestones.map((milestone) => (
                    <Card
                      key={milestone.item.id}
                      className={`p-6 bg-gradient-to-br ${getMilestoneColor(
                        milestone.milestone_type
                      )} cursor-pointer hover:scale-[1.02] transition-transform`}
                      onClick={() => setSelectedItem(milestone.item)}
                    >
                      <div className='flex items-start gap-4'>
                        <div className='relative'>
                          <img
                            src={
                              milestone.item.gallery_images?.[1] ||
                              milestone.item.image_url
                            }
                            alt={milestone.item.name}
                            className='w-20 h-20 object-cover rounded-lg border-2 border-border/50'
                          />
                          <div className='absolute -top-2 -right-2'>
                            {getMilestoneIcon(milestone.milestone_type)}
                          </div>
                        </div>

                        <div className='flex-1 space-y-2'>
                          <div>
                            <h3 className='font-bold text-foreground uppercase text-sm'>
                              {milestone.item.name}
                            </h3>
                            <Badge
                              variant='outline'
                              className={`mt-1 text-xs uppercase ${getMilestoneBadgeColor(
                                milestone.milestone_type
                              )}`}
                            >
                              {milestone.milestone_type}
                            </Badge>
                          </div>

                          <div className='flex items-center gap-4 text-sm'>
                            <div className='flex items-center gap-1'>
                              <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                              <span className='font-bold'>
                                {milestone.trust_score.toFixed(0)}%
                              </span>
                            </div>
                            <div className='text-muted-foreground'>
                              {milestone.attestation_count} verifications
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Items */}
            {trending.length > 0 && (
              <section className='space-y-6'>
                <div className='flex items-center gap-3'>
                  <TrendingUp className='h-6 w-6 text-primary' />
                  <h2 className='text-2xl font-black uppercase italic tracking-tighter'>
                    Trending <span className='text-primary'>Now</span>
                  </h2>
                  <Badge
                    variant='outline'
                    className='bg-primary/10 text-primary border-primary/30 uppercase text-xs'
                  >
                    Last 24 Hours
                  </Badge>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                  {trending.map((item) => (
                    <Card
                      key={item.item.id}
                      className='group relative border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer'
                      onClick={() => setSelectedItem(item.item)}
                    >
                      <div className='absolute top-2 right-2 z-10'>
                        <Badge
                          variant='outline'
                          className='bg-primary/90 text-white border-primary text-[9px] px-1 py-0 font-black'
                        >
                          <ArrowUp className='h-2.5 w-2.5 mr-0.5' />
                          HOT
                        </Badge>
                      </div>

                      <div className='aspect-[3/4] relative overflow-hidden bg-gradient-to-b from-secondary/20 to-background p-2 flex items-center justify-center'>
                        <img
                          src={
                            item.item.gallery_images?.[1] || item.item.image_url
                          }
                          alt={item.item.name}
                          className='w-full h-full object-contain transition-transform duration-500 group-hover:scale-110'
                        />
                      </div>

                      <div className='p-2 space-y-1 bg-card/90 backdrop-blur-sm border-t border-border/50'>
                        <h3 className='font-bold uppercase tracking-wider text-[10px] truncate'>
                          {item.item.name}
                        </h3>
                        <div className='flex items-center justify-between text-[9px]'>
                          <div className='flex items-center gap-1'>
                            <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                            <span className='font-bold'>
                              {item.trust_score.toFixed(0)}%
                            </span>
                          </div>
                          <div className='text-primary font-bold'>
                            +{item.recent_attestations} new
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Activity Feed */}
            {recentActivity.length > 0 && (
              <section className='space-y-6'>
                <div className='flex items-center gap-3'>
                  <Clock className='h-6 w-6 text-muted-foreground' />
                  <h2 className='text-2xl font-black uppercase italic tracking-tighter'>
                    Recent{' '}
                    <span className='text-muted-foreground'>Activity</span>
                  </h2>
                </div>

                <Card className='border-border/50 divide-y divide-border/30'>
                  {recentActivity.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className='p-4 hover:bg-secondary/20 transition-colors'
                    >
                      <div className='flex items-start gap-3'>
                        <Avatar className='h-8 w-8 bg-primary/20 border border-primary/30'>
                          <div className='w-full h-full flex items-center justify-center text-primary font-bold text-xs'>
                            {activity.creator_address
                              ? activity.creator_address
                                  .slice(2, 4)
                                  .toUpperCase()
                              : '??'}
                          </div>
                        </Avatar>

                        <div className='flex-1 space-y-1'>
                          <div className='flex items-center gap-2 flex-wrap text-sm'>
                            <span className='font-bold text-foreground'>
                              {activity.creator_address
                                ? `${activity.creator_address.slice(
                                    0,
                                    6
                                  )}...${activity.creator_address.slice(-4)}`
                                : 'Anonymous'}
                            </span>
                            <span className='text-muted-foreground'>
                              verified
                            </span>
                            <span className='font-bold text-primary'>
                              {activity.item_name}
                            </span>
                            {activity.trust_score > 0 && (
                              <Badge
                                variant='outline'
                                className='text-xs bg-primary/10 border-primary/30'
                              >
                                {activity.trust_score.toFixed(0)}% trust
                              </Badge>
                            )}
                          </div>

                          {activity.comment && (
                            <div className='flex items-start gap-2 text-xs text-muted-foreground bg-secondary/20 p-2 rounded border border-border/30'>
                              <MessageSquare className='h-3 w-3 mt-0.5 flex-shrink-0' />
                              <p className='italic'>"{activity.comment}"</p>
                            </div>
                          )}

                          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <Clock className='h-3 w-3' />
                            {formatDistanceToNow(
                              new Date(activity.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </section>
            )}

            {/* Empty State */}
            {milestones.length === 0 &&
              trending.length === 0 &&
              recentActivity.length === 0 && (
                <div className='text-center py-20'>
                  <Sparkles className='h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50' />
                  <p className='text-lg text-muted-foreground mb-2'>
                    No trust activity yet
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Be the first to rate items and build community trust!
                  </p>
                </div>
              )}
          </>
        )}
      </main>

      <SkinDetailModal
        skin={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onPurchase={async () => {}}
      />
    </div>
  );
};

export default Activity;
