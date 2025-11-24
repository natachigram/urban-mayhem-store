import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Star,
  Coins,
  TrendingUp,
  Award,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Trophy,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

interface Attestation {
  id: string;
  created_at: string;
  stake_amount: number;
  subject_atom_id: string;
  status: string;
  atoms: {
    entity_id: string;
    entity_type: string;
    metadata: any;
  } | null;
  predicate_atoms: {
    metadata: any;
    entity_id: string;
  } | null;
}

interface RewardInfo {
  totalStaked: number;
  estimatedRewards: number;
  earlyAttestorBonus: number;
  activeAttestations: number;
}

const Attestations = () => {
  const { address, isConnected } = useAccount();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [rewards, setRewards] = useState<RewardInfo>({
    totalStaked: 0,
    estimatedRewards: 0,
    earlyAttestorBonus: 0,
    activeAttestations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadAttestations();
    }
  }, [isConnected, address]);

  const loadAttestations = async () => {
    try {
      setIsLoading(true);

      // Fetch user's attestations with item and predicate details
      const { data, error } = await supabase
        .from('attestations')
        .select(
          `
          id,
          created_at,
          stake_amount,
          subject_atom_id,
          status,
          atoms:subject_atom_id!inner (
            entity_id,
            entity_type,
            metadata
          ),
          predicate_atoms:predicate_atom_id!inner (
            metadata,
            entity_id
          )
        `
        )
        .eq('creator_wallet', address?.toLowerCase())
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttestations(data || []);

      // Calculate rewards
      if (data && data.length > 0) {
        const totalStaked = data.reduce(
          (sum, att) => sum + parseFloat(att.stake_amount.toString()),
          0
        );

        // Early attestor bonus: 10% for first 10 attestations on an item
        const earlyBonus = await calculateEarlyAttestorBonus(data);

        // Estimated rewards: 5% APY on staked amount + early bonus
        const estimatedRewards = totalStaked * 0.05 + earlyBonus;

        setRewards({
          totalStaked,
          estimatedRewards,
          earlyAttestorBonus: earlyBonus,
          activeAttestations: data.length,
        });
      }
    } catch (error: any) {
      console.error('Error loading attestations:', error);
      toast.error('Failed to load attestations');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEarlyAttestorBonus = async (
    userAttestations: Attestation[]
  ): Promise<number> => {
    let totalBonus = 0;

    for (const attestation of userAttestations) {
      const subjectAtomId = attestation.atoms?.entity_id;
      if (!subjectAtomId) continue;

      // Get total attestations for this item
      const { data, error } = await supabase
        .from('attestations')
        .select('id, created_at, stake_amount')
        .eq('subject_atom_id', subjectAtomId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error || !data) continue;

      // Check if user's attestation is in the first 10
      const userAttIndex = data.findIndex((a) => a.id === attestation.id);
      if (userAttIndex !== -1 && userAttIndex < 10) {
        // Bonus decreases from 10% to 1% for positions 1-10
        const bonusMultiplier = (10 - userAttIndex) / 100;
        totalBonus +=
          parseFloat(attestation.stake_amount.toString()) * bonusMultiplier;
      }
    }

    return totalBonus;
  };

  const getPredicateLabel = (metadata: any): string => {
    const label = metadata?.label || 'Unknown';
    return label.replace('is_', '').replace(/_/g, ' ');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <div className='container py-12'>
          <Card className='max-w-md mx-auto'>
            <CardContent className='pt-6 text-center'>
              <ShieldCheck className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <p className='text-muted-foreground'>
                Connect your wallet to view attestations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <main className='container py-12 space-y-8'>
        {/* Page Header */}
        <div>
          <h1 className='text-3xl font-black uppercase tracking-tight mb-2'>
            My Attestations
          </h1>
          <p className='text-muted-foreground'>
            Track your community ratings and earned rewards
          </p>
        </div>

        {/* Rewards Dashboard */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='bg-gradient-to-br from-primary/10 to-background border-primary/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Coins className='h-4 w-4' />
                Total Staked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black'>
                {rewards.totalStaked.toFixed(4)} $TRUST
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-green-500/10 to-background border-green-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <TrendingUp className='h-4 w-4' />
                Estimated Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-green-400'>
                +{rewards.estimatedRewards.toFixed(4)} $TRUST
              </div>
              <p className='text-xs text-muted-foreground mt-1'>~5% APY</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-yellow-500/10 to-background border-yellow-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Trophy className='h-4 w-4' />
                Early Bonus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-yellow-400'>
                +{rewards.earlyAttestorBonus.toFixed(4)} $TRUST
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                First 10 attestors
              </p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Activity className='h-4 w-4' />
                Active Attestations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black'>
                {rewards.activeAttestations}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Info */}
        <Card className='bg-secondary/20 border-border/50'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <Award className='h-5 w-5 text-primary mt-0.5' />
              <div className='space-y-1'>
                <h3 className='font-bold text-sm'>
                  Attestation Rewards Program
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Earn rewards by providing valuable community ratings. Early
                  attestors (first 10 on each item) receive bonus rewards
                  ranging from 10% to 1% of their stake. All stakes earn
                  approximately 5% APY. Rewards are calculated based on the
                  accuracy and helpfulness of your attestations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attestation History */}
        <div>
          <h2 className='text-xl font-black uppercase mb-4'>
            Attestation History
          </h2>

          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className='pt-6'>
                    <div className='flex items-center gap-4'>
                      <Skeleton className='h-12 w-12 rounded-lg' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-1/3' />
                        <Skeleton className='h-3 w-1/2' />
                      </div>
                      <Skeleton className='h-8 w-20' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : attestations.length === 0 ? (
            <Card>
              <CardContent className='pt-6 text-center'>
                <Star className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                <p className='text-muted-foreground mb-4'>
                  No attestations yet
                </p>
                <Button onClick={() => (window.location.href = '/store')}>
                  Browse Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-3'>
              {attestations.map((attestation) => (
                <Card
                  key={attestation.id}
                  className='hover:border-primary/50 transition-colors'
                >
                  <CardContent className='pt-6'>
                    <div className='flex items-center gap-4'>
                      {/* Icon */}
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          attestation.is_positive
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        {attestation.is_positive ? (
                          <ThumbsUp className='h-6 w-6 text-green-400' />
                        ) : (
                          <ThumbsDown className='h-6 w-6 text-red-400' />
                        )}
                      </div>

                      {/* Details */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-bold truncate'>
                            {attestation.atoms?.metadata?.name ||
                              'Unknown Item'}
                          </h3>
                          <Badge
                            variant='outline'
                            className='text-xs capitalize'
                          >
                            {getPredicateLabel(
                              attestation.predicate_atoms?.metadata
                            )}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatDate(attestation.created_at)}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Coins className='h-3 w-3' />
                            {parseFloat(
                              attestation.stake_amount.toString()
                            ).toFixed(4)}{' '}
                            $TRUST staked
                          </span>
                        </div>
                      </div>

                      {/* Stake Badge */}
                      <Badge
                        variant='outline'
                        className='bg-primary/10 border-primary/20'
                      >
                        <Coins className='h-3 w-3 mr-1' />
                        {parseFloat(
                          attestation.stake_amount.toString()
                        ).toFixed(2)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Attestations;
