import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Package, Sword, Shirt, Zap, Trophy, Gift } from 'lucide-react';

interface StoreTabsProps {
  children: {
    featured: React.ReactNode;
    skins: React.ReactNode;
    weapons: React.ReactNode;
    boosters: React.ReactNode;
    battlepass: React.ReactNode;
    special: React.ReactNode;
  };
}

export const StoreTabs = ({ children }: StoreTabsProps) => {
  return (
    <Tabs defaultValue='featured' className='w-full'>
      <TabsList className='w-full justify-start gap-2 bg-transparent p-0 h-auto flex-wrap border-b border-border/40 pb-4 mb-6 rounded-none'>
        <TabsTrigger
          value='featured'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Flame className='h-4 w-4' />
          Featured
        </TabsTrigger>
        <TabsTrigger
          value='skins'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Shirt className='h-4 w-4' />
          Skins
        </TabsTrigger>
        <TabsTrigger
          value='weapons'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Sword className='h-4 w-4' />
          Weapons
        </TabsTrigger>
        <TabsTrigger
          value='boosters'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Zap className='h-4 w-4' />
          Boosters
        </TabsTrigger>
        <TabsTrigger
          value='battlepass'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Trophy className='h-4 w-4' />
          Battle Pass
        </TabsTrigger>
        <TabsTrigger
          value='special'
          className='gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-all'
        >
          <Gift className='h-4 w-4' />
          Special Packs
        </TabsTrigger>
      </TabsList>

      <TabsContent value='featured' className='mt-0 animate-accordion-down'>
        {children.featured}
      </TabsContent>
      <TabsContent value='skins' className='mt-0 animate-accordion-down'>
        {children.skins}
      </TabsContent>
      <TabsContent value='weapons' className='mt-0 animate-accordion-down'>
        {children.weapons}
      </TabsContent>
      <TabsContent value='boosters' className='mt-0 animate-accordion-down'>
        {children.boosters}
      </TabsContent>
      <TabsContent value='battlepass' className='mt-0 animate-accordion-down'>
        {children.battlepass}
      </TabsContent>
      <TabsContent value='special' className='mt-0 animate-accordion-down'>
        {children.special}
      </TabsContent>
    </Tabs>
  );
};
