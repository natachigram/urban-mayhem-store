import { Header } from '@/components/Header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck,
  Star,
  Coins,
  TrendingUp,
  Award,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Trophy,
  Gift,
  ArrowDownToLine,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';
import { useAttestation } from '@/hooks/useAttestation';

interface Attestation {
  id: string;
  created_at: string;
  stake_amount: number;
  subject_atom_id: string;
  status: string;
  comment: string | null;
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

interface Reward {
  id: string;
  reward_amount: string;
  reward_type: string;
  position: number;
  claimed: boolean;
  attestation_id: string;
}

interface RewardInfo {
  totalStaked: number;
  estimatedRewards: number;
  earlyAttestorBonus: number;
  activeAttestations: number;
  claimableRewards: number;
}

const AttestationsEnhanced = () => {
  const { address, isConnected } = useAccount();
  const { withdrawAttestation, isProcessing } = useAttestation();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [rewards, setRewards] = useState<RewardInfo>({
    totalStaked: 0,
    estimatedRewards: 0,
    earlyAttestorBonus: 0,
    activeAttestations: 0,
    claimableRewards: 0,
  });
  const [unclaimedRewards, setUnclaimedRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttestation, setSelectedAttestation] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    }
  }, [isConnected, address]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadAttestations(), loadRewards()]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttestations = async () => {
    const { data, error } = await supabase
      .from('attestations')
      .select(
        `
        id,
        created_at,
        stake_amount,
        subject_atom_id,
        status,
        comment,
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
      .order('created_at', { ascending: false });

    if (error) throw error;

    setAttestations(data || []);

    // Calculate stats
    const active = data?.filter((a) => a.status === 'active') || [];
    const totalStaked = active.reduce(
      (sum, att) => sum + parseFloat(att.stake_amount.toString()),
      0
    );

    setRewards((prev) => ({
      ...prev,
      totalStaked,
      activeAttestations: active.length,
      estimatedRewards: totalStaked * 0.05, // 5% APY estimate
    }));
  };

  const loadRewards = async () => {
    const { data, error } = await supabase
      .from('attestation_rewards')
      .select('*')
      .eq('user_wallet', address?.toLowerCase())
      .eq('claimed', false);

    if (error) throw error;

    setUnclaimedRewards(data || []);

    const totalUnclaimed = (data || []).reduce(
      (sum, r) => sum + parseFloat(r.reward_amount),
      0
    );

    setRewards((prev) => ({
      ...prev,
      claimableRewards: totalUnclaimed / 1e18, // Convert from wei
      earlyAttestorBonus: totalUnclaimed / 1e18,
    }));
  };

  const handleWithdraw = async (attestationId: string) => {
    const result = await withdrawAttestation(attestationId);
    if (result.success) {
      await loadData();
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      const { data, error } = await supabase.rpc('claim_reward', {
        reward_id: rewardId,
        claimer_wallet: address?.toLowerCase(),
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        toast.success(`Claimed ${parseFloat(data[0].amount) / 1e18} $TRUST!`);
        await loadData();
      } else {
        throw new Error(data?.[0]?.message || 'Claim failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim reward');
    }
  };

  const getPredicateLabel = (entityId: string): string => {
    return entityId?.replace('is_', '').replace(/_/g, ' ') || 'Unknown';
  };

  const isPositive = (entityId: string): boolean => {
    return ['is_great', 'is_high_quality', 'is_fair_price'].includes(entityId);
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
            Track your ratings, manage stakes, and claim rewards
          </p>
        </div>

        {/* Rewards Dashboard */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <Card className='bg-gradient-to-br from-primary/10 to-background border-primary/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Coins className='h-4 w-4' />
                Total Staked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black'>
                {rewards.totalStaked.toFixed(4)}
              </div>
              <p className='text-xs text-muted-foreground'>$TRUST</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-green-500/10 to-background border-green-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <TrendingUp className='h-4 w-4' />
                Est. Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-green-400'>
                +{rewards.estimatedRewards.toFixed(4)}
              </div>
              <p className='text-xs text-muted-foreground'>~5% APY</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-yellow-500/10 to-background border-yellow-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Gift className='h-4 w-4' />
                Early Bonus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-yellow-400'>
                +{rewards.earlyAttestorBonus.toFixed(4)}
              </div>
              <p className='text-xs text-muted-foreground'>Claimable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4' />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black'>
                {rewards.activeAttestations}
              </div>
              <p className='text-xs text-muted-foreground'>Attestations</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-500/10 to-background border-purple-500/20'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Trophy className='h-4 w-4' />
                Claimable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-purple-400'>
                {rewards.claimableRewards.toFixed(4)}
              </div>
              <Button
                size='sm'
                variant='outline'
                className='mt-2 w-full'
                disabled={unclaimedRewards.length === 0}
                onClick={() =>
                  unclaimedRewards.forEach((r) => handleClaimReward(r.id))
                }
              >
                Claim All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Attestations List */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Your Attestations
            </CardTitle>
            <CardDescription>
              Manage your ratings and withdraw stakes when needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className='h-32 w-full' />
                ))}
              </div>
            ) : attestations.length === 0 ? (
              <div className='text-center py-12'>
                <Star className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                <p className='text-muted-foreground'>
                  No attestations yet. Rate some items to get started!
                </p>
              </div>
            ) : (
              <ScrollArea className='h-[600px] pr-4'>
                <div className='space-y-4'>
                  {attestations.map((attestation) => {
                    const predicateId =
                      attestation.predicate_atoms?.entity_id || '';
                    const positive = isPositive(predicateId);
                    const itemName =
                      attestation.atoms?.metadata?.name || 'Unknown Item';

                    return (
                      <Card
                        key={attestation.id}
                        className={`transition-all hover:border-primary/50 ${
                          attestation.status === 'withdrawn' ? 'opacity-60' : ''
                        }`}
                      >
                        <CardContent className='pt-6'>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                {positive ? (
                                  <ThumbsUp className='h-4 w-4 text-green-500' />
                                ) : (
                                  <ThumbsDown className='h-4 w-4 text-red-500' />
                                )}
                                <span className='font-bold'>{itemName}</span>
                                <Badge
                                  variant={positive ? 'default' : 'destructive'}
                                >
                                  {getPredicateLabel(predicateId)}
                                </Badge>
                                {attestation.status === 'withdrawn' && (
                                  <Badge variant='outline'>Withdrawn</Badge>
                                )}
                              </div>

                              <div className='flex items-center gap-4 text-sm text-muted-foreground mb-2'>
                                <span className='flex items-center gap-1'>
                                  <Coins className='h-3 w-3' />
                                  {parseFloat(
                                    attestation.stake_amount.toString()
                                  ).toFixed(4)}{' '}
                                  $TRUST
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='h-3 w-3' />
                                  {formatDate(attestation.created_at)}
                                </span>
                              </div>

                              {attestation.comment && (
                                <div className='mt-3 p-3 bg-muted/50 rounded-lg'>
                                  <div className='flex items-center gap-2 mb-1'>
                                    <MessageSquare className='h-3 w-3 text-muted-foreground' />
                                    <span className='text-xs font-medium text-muted-foreground'>
                                      Review
                                    </span>
                                  </div>
                                  <p className='text-sm'>
                                    {attestation.comment}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className='flex flex-col gap-2'>
                              {attestation.status === 'active' && (
                                <>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={() =>
                                          setSelectedAttestation(attestation.id)
                                        }
                                      >
                                        <ArrowDownToLine className='h-4 w-4 mr-2' />
                                        Withdraw
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Withdraw Stake
                                        </DialogTitle>
                                        <DialogDescription>
                                          Withdraw your{' '}
                                          {parseFloat(
                                            attestation.stake_amount.toString()
                                          ).toFixed(4)}{' '}
                                          $TRUST stake from this attestation.
                                          <div className='mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
                                            <div className='flex items-start gap-2'>
                                              <AlertTriangle className='h-4 w-4 text-yellow-500 mt-0.5' />
                                              <div className='text-sm'>
                                                <p className='font-medium mb-1'>
                                                  24-Hour Cooldown
                                                </p>
                                                <p className='text-muted-foreground'>
                                                  After withdrawal, you cannot
                                                  re-stake on this item for 24
                                                  hours. This prevents gaming
                                                  the system.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant='outline'
                                          onClick={() =>
                                            setSelectedAttestation(null)
                                          }
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            handleWithdraw(attestation.id);
                                            setSelectedAttestation(null);
                                          }}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing
                                            ? 'Processing...'
                                            : 'Confirm Withdrawal'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Unclaimed Rewards */}
        {unclaimedRewards.length > 0 && (
          <Card className='border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-background'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='h-5 w-5 text-yellow-500' />
                Unclaimed Early Attestor Bonuses
              </CardTitle>
              <CardDescription>
                You earned bonuses for being an early rater!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {unclaimedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className='flex items-center justify-between p-3 bg-background rounded-lg'
                  >
                    <div>
                      <div className='font-bold'>
                        Position #{reward.position} Bonus
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {parseFloat(reward.reward_amount) / 1e18} $TRUST
                      </div>
                    </div>
                    <Button
                      size='sm'
                      onClick={() => handleClaimReward(reward.id)}
                    >
                      <Gift className='h-4 w-4 mr-2' />
                      Claim
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AttestationsEnhanced;
