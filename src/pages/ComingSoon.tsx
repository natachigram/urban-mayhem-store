import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Swords,
  Gem,
  Cuboid,
  Lock,
  ChevronRight,
  Code2,
  Cpu,
  Network,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ComingSoon = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Reputation Identity',
      description:
        'On-chain player profiles with skill claims, behavior ratings, and anti-cheat proofs powered by Intuition.',
      color: 'text-blue-400',
    },
    {
      icon: Swords,
      title: 'Trust Matchmaking',
      description:
        'Fair play enforcement. High-trust players get priority queues; toxic behavior leads to isolation.',
      color: 'text-red-400',
    },
    {
      icon: Gem,
      title: 'Trust-Weighted Loot',
      description:
        'Dynamic drop rates influenced by your reputation score and community attestations.',
      color: 'text-purple-400',
    },
  ];

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Header />

      <main className='flex-1 container py-12 space-y-16'>
        {/* Hero Section */}
        <div className='text-center space-y-6 max-w-3xl mx-auto'>
          <div className='inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-primary'></span>
            </span>
            Roadmap Active
          </div>

          <h1 className='text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-foreground'>
            System{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary'>
              Expansion
            </span>
          </h1>

          <p className='text-xl text-muted-foreground font-medium leading-relaxed'>
            The Urban Mayhem ecosystem is evolving. We are integrating the
            Intuition Trust Protocol to revolutionize gaming identity and
            economy.
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='bg-card/50 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-colors group'
            >
              <CardHeader>
                <feature.icon
                  className={`w-10 h-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                />
                <CardTitle className='uppercase tracking-wider'>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base'>
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Unity SDK Special Section */}
        <div className='relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-zinc-900 to-black p-8 md:p-12'>
          <div className='absolute top-0 right-0 p-4 opacity-10'>
            <Cuboid className='w-64 h-64' />
          </div>

          <div className='relative z-10 grid md:grid-cols-2 gap-8 items-center'>
            <div className='space-y-6'>
              <Badge
                variant='outline'
                className='bg-primary/10 text-primary border-primary/30 px-4 py-1'
              >
                FOR DEVELOPERS
              </Badge>
              <h2 className='text-4xl font-black uppercase italic tracking-tighter'>
                Urban Mayhem <br />
                <span className='text-primary'>Unity SDK</span>
              </h2>
              <p className='text-muted-foreground text-lg max-w-md'>
                A powerful toolkit enabling any Unity developer to integrate the
                Intuition Trust Protocol into their games.
              </p>

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
                          <li className='flex items-start gap-2'>
                            <span className='text-primary'>•</span> Wallet
                            Binding System
                          </li>
                        </ul>
                      </div>

                      <div className='space-y-4'>
                        <h3 className='font-bold text-primary uppercase text-sm tracking-wider flex items-center gap-2'>
                          <Cpu className='h-4 w-4' /> Prefabs & UI
                        </h3>
                        <ul className='space-y-2 text-sm text-muted-foreground'>
                          <li className='flex items-start gap-2'>
                            <span className='text-primary'>•</span> TrustBadge
                            Component
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='text-primary'>•</span>{' '}
                            ReputationPanel UI
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='text-primary'>•</span>{' '}
                            TrustBasedStore Template
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='text-primary'>•</span> Demo Scene
                            Included
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className='border-t border-primary/10 pt-4'>
                      <h3 className='font-bold text-primary uppercase text-sm tracking-wider flex items-center gap-2 mb-3'>
                        <Network className='h-4 w-4' /> Capabilities
                      </h3>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div className='bg-primary/5 border border-primary/10 p-2 rounded'>
                          Create Player Subjects
                        </div>
                        <div className='bg-primary/5 border border-primary/10 p-2 rounded'>
                          Write Claims & Attestations
                        </div>
                        <div className='bg-primary/5 border border-primary/10 p-2 rounded'>
                          Read Trust Scores
                        </div>
                        <div className='bg-primary/5 border border-primary/10 p-2 rounded'>
                          Trust-Gated Gameplay
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className='relative h-64 bg-black/50 rounded-lg border border-primary/20 p-4 flex flex-col justify-center items-center text-center space-y-4 backdrop-blur-sm'>
              <Lock className='w-12 h-12 text-muted-foreground/50' />
              <div>
                <h3 className='font-bold text-foreground'>
                  SDK Access Restricted
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Currently in closed beta for partner studios.
                </p>
              </div>
              <Button
                variant='outline'
                className='border-primary/30 hover:bg-primary/10'
              >
                Request Access
              </Button>
            </div>
          </div>
        </div>

        <div className='flex justify-center pt-8'>
          <Button
            onClick={() => navigate('/')}
            variant='ghost'
            className='text-muted-foreground hover:text-primary'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Return to Store
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ComingSoon;
