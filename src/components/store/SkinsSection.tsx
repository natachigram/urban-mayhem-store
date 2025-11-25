import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Coins,
  Search,
  Filter,
  ShieldCheck,
  Users,
  Loader2,
} from 'lucide-react';
import { SkinDetailModal } from './SkinDetailModal';
import { SocialProof } from './SocialProof';
import { getItemsByType, type Item } from '@/services/items';

export const SkinsSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('purchase_count');
  const [selectedSkin, setSelectedSkin] = useState<Item | null>(null);
  const [skins, setSkins] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkins();
  }, []);

  const loadSkins = async () => {
    setIsLoading(true);
    const data = await getItemsByType('skin');
    setSkins(data);
    setIsLoading(false);
  };

  const filteredSkins = skins
    .filter((skin) => {
      const matchesSearch = skin.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRarity =
        rarityFilter === 'all' || skin.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      if (sortBy === 'purchase_count')
        return b.purchase_count - a.purchase_count;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

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

  const getTrustColor = (score: number) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-blue-400';
    return 'text-muted-foreground';
  };

  const handlePurchase = async (skinId: string) => {
    // Simulate purchase
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In real app, update state/backend
  };

  return (
    <section className='space-y-8'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-black uppercase italic tracking-tighter text-foreground'>
            Character <span className='text-primary'>Skins</span>
          </h2>
          <div className='text-sm text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-2'>
            <ShieldCheck className='h-4 w-4 text-primary' />
            Verified by Intuition Trust Protocol
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <div className='relative w-full md:w-64'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='SEARCH SKINS...'
              className='pl-9 bg-secondary/20 border-border/50 focus:border-primary/50 uppercase text-sm font-bold tracking-wider'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className='w-[130px] bg-secondary/20 border-border/50 uppercase font-bold text-xs tracking-wider'>
              <div className='flex items-center gap-2'>
                <Filter className='h-3 w-3' />
                <SelectValue placeholder='Rarity' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Rarities</SelectItem>
              <SelectItem value='legendary'>Legendary</SelectItem>
              <SelectItem value='epic'>Epic</SelectItem>
              <SelectItem value='rare'>Rare</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-[160px] bg-secondary/20 border-border/50 uppercase font-bold text-xs tracking-wider'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-3 w-3' />
                <SelectValue placeholder='Sort By' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='purchase_count'>Most Popular</SelectItem>
              <SelectItem value='price_asc'>Price: Low to High</SelectItem>
              <SelectItem value='price_desc'>Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : filteredSkins.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-muted-foreground text-lg'>No skins found</p>
          <p className='text-sm text-muted-foreground mt-2'>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {filteredSkins.map((skin) => (
            <Card
              key={skin.id}
              className='group relative border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer'
              onClick={() => setSelectedSkin(skin)}
            >
              {/* Rarity Tag */}
              <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
                <Badge
                  variant='outline'
                  className={`uppercase text-[10px] font-bold tracking-wider ${getRarityColor(
                    skin.rarity
                  )}`}
                >
                  {skin.rarity}
                </Badge>
              </div>

              {/* Real-time Trust Score from Attestations */}
              <div className='absolute top-2 right-2 z-10'>
                <div className='bg-background/90 backdrop-blur-sm px-2 py-1 rounded-sm border border-border/50'>
                  <SocialProof itemId={skin.id} compact />
                </div>
              </div>

              {/* Image Container */}
              <div className='aspect-[3/4] relative overflow-hidden bg-gradient-to-b from-secondary/20 to-background p-4 flex items-center justify-center'>
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
                <img
                  src={skin.image_url}
                  alt={skin.name}
                  className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                />
              </div>

              <CardContent className='p-4 space-y-2 relative z-10 bg-card/90 backdrop-blur-sm border-t border-border/50'>
                <h3 className='font-bold uppercase tracking-wider text-sm truncate group-hover:text-primary transition-colors'>
                  {skin.name}
                </h3>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1.5 text-primary font-black'>
                    <Coins className='h-3.5 w-3.5' />
                    {skin.price.toLocaleString()}
                  </div>

                  <div className='flex items-center gap-1 text-[10px] text-muted-foreground font-medium'>
                    <Users className='h-3 w-3' />
                    {skin.purchase_count > 1000
                      ? `${(skin.purchase_count / 1000).toFixed(1)}k`
                      : skin.purchase_count}
                  </div>
                </div>
              </CardContent>

              {/* Hover Overlay */}
              <div className='absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-all duration-300 pointer-events-none' />
            </Card>
          ))}
        </div>
      )}

      <SkinDetailModal
        skin={selectedSkin}
        isOpen={!!selectedSkin}
        onClose={() => setSelectedSkin(null)}
        onPurchase={handlePurchase}
      />
    </section>
  );
};
