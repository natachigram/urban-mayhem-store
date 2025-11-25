import { Header } from '@/components/Header';
import { HeroSection } from '@/components/store/HeroSection';
import { UMPSection } from '@/components/store/UMPSection';
import { TopRatedSection } from '@/components/store/TopRatedSection';
import { SkinsSection } from '@/components/store/SkinsSection';
import {
  Lock,
  Shield,
  Swords,
  Gem,
  Cuboid,
  Code2,
  Cpu,
  Network,
  ChevronRight,
  Users,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Store = () => {
  return (
    <div className='min-h-screen bg-background text-foreground selection:bg-primary/30'>
      <Header />

      <main className='space-y-24 pb-24'>
        {/* Hero Section */}
        <HeroSection />

        <div className='container space-y-24'>
          {/* Buy UMP Section */}
          <UMPSection />

          {/* Top Rated Items - Community Favorites */}
          <TopRatedSection />

          {/* Character Skins Shop */}
          <SkinsSection />

          {/* Coming Soon Section */}
          <section className='pt-12 border-t border-border/30'>
            <div className='flex items-center gap-3 mb-8'>
              <Lock className='h-5 w-5 text-muted-foreground' />
              <h2 className='text-xl font-bold uppercase tracking-widest text-muted-foreground'>
                System Expansion (Coming Soon)
              </h2>
            </div>

            <div className='space-y-8'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500'>
                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <Shield className='h-4 w-4 text-blue-400' />
                      Player Reputation System
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Trust scores for players with skill claims, win/loss
                      history, and behavior ratings powered by Intuition
                      Protocol.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <Swords className='h-4 w-4 text-red-400' />
                      Trust-Weighted Matchmaking
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Queue players based on trust scores - high-trust priority
                      queues, low-trust players matched together.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <Gem className='h-4 w-4 text-purple-400' />
                      Trust-Influenced Loot System
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Weighted reward chances based on player trust, community
                      attestation of item rarity, and fair play behavior.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <Users className='h-4 w-4 text-green-400' />
                      Creator Marketplace
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Community-designed items with creator attestations,
                      earnings tracking, and reputation multipliers.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <Activity className='h-4 w-4 text-yellow-400' />
                      Advanced Attestations
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Detailed reviews, ratings, and anti-cheat proofs using
                      Intuition's attestation framework.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className='bg-secondary/10 border-border/30'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 uppercase tracking-wider text-base text-muted-foreground'>
                      <ShieldCheck className='h-4 w-4 text-cyan-400' />
                      Smart Contract Aggregator
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      On-chain trust score registry reading Intuition
                      attestations for decentralized trust computation.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Unity SDK Special Section */}
              <div className='relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-zinc-900 to-black p-8'>
                <div className='absolute top-0 right-0 p-4 opacity-10'>
                  <Cuboid className='w-48 h-48' />
                </div>

                <div className='relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between'>
                  <div className='space-y-4'>
                    <Badge
                      variant='outline'
                      className='bg-primary/10 text-primary border-primary/30 px-4 py-1'
                    >
                      FOR DEVELOPERS
                    </Badge>
                    <h2 className='text-3xl font-black uppercase italic tracking-tighter'>
                      Urban Mayhem{' '}
                      <span className='text-primary'>Unity SDK & Tools</span>
                    </h2>
                    <p className='text-muted-foreground max-w-md'>
                      Integration package for external game studios: Unity SDK
                      for trust-based features, creator dashboard for tracking
                      community items/payouts, and open-source attestation
                      templates.
                    </p>
                    <Badge
                      variant='secondary'
                      className='text-xs font-normal opacity-60'
                    >
                      Post-Hackathon Release
                    </Badge>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size='lg'
                        className='bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider'
                      >
                        View Technical Specs{' '}
                        <ChevronRight className='ml-2 h-4 w-4' />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-2xl bg-zinc-950 border-primary/20'>
                      <DialogHeader>
                        <DialogTitle className='text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3'>
                          <Cuboid className='h-6 w-6 text-primary' />
                          Unity SDK Architecture
                        </DialogTitle>
                        <DialogDescription className='text-base'>
                          Complete integration package for the Intuition Trust
                          Network.
                        </DialogDescription>
                      </DialogHeader>

                      <div className='grid gap-6 py-4'>
                        <div className='grid md:grid-cols-2 gap-4'>
                          <div className='space-y-4'>
                            <h3 className='font-bold text-primary uppercase text-sm tracking-wider flex items-center gap-2'>
                              <Code2 className='h-4 w-4' /> Core Components
                            </h3>
                            <ul className='space-y-2 text-sm text-muted-foreground'>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                IntuitionManager.cs (Singleton)
                              </li>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                TrustScoreClient.cs
                              </li>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                AttestationClient.cs
                              </li>
                            </ul>
                          </div>

                          <div className='space-y-4'>
                            <h3 className='font-bold text-primary uppercase text-sm tracking-wider flex items-center gap-2'>
                              <Cpu className='h-4 w-4' /> Prefabs & UI
                            </h3>
                            <ul className='space-y-2 text-sm text-muted-foreground'>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                TrustBadge Component
                              </li>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                ReputationPanel UI
                              </li>
                              <li className='flex items-start gap-2'>
                                <span className='text-primary'>•</span>{' '}
                                TrustBasedStore Template
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className='border-t border-primary/10 pt-4'>
                          <h3 className='font-bold text-primary uppercase text-sm tracking-wider flex items-center gap-2 mb-3'>
                            <Network className='h-4 w-4' /> Capabilities
                          </h3>
                          <div className='grid grid-cols-2 gap-2 text-sm'>
                            <div className='bg-primary/5 border border-primary/10 p-2 rounded text-center'>
                              Create Player Subjects
                            </div>
                            <div className='bg-primary/5 border border-primary/10 p-2 rounded text-center'>
                              Write Claims & Attestations
                            </div>
                            <div className='bg-primary/5 border border-primary/10 p-2 rounded text-center'>
                              Read Trust Scores
                            </div>
                            <div className='bg-primary/5 border border-primary/10 p-2 rounded text-center'>
                              Trust-Gated Gameplay
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Store;
