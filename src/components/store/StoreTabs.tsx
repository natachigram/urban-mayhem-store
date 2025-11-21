import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Package, Sword, Shirt, Zap } from "lucide-react";

interface StoreTabsProps {
  children: {
    featured: React.ReactNode;
    bundles: React.ReactNode;
    weapons: React.ReactNode;
    skins: React.ReactNode;
    powerups: React.ReactNode;
  };
}

export const StoreTabs = ({ children }: StoreTabsProps) => {
  return (
    <Tabs defaultValue="featured" className="w-full">
      <TabsList className="w-full justify-start gap-2 bg-secondary/20 p-1 h-auto flex-wrap">
        <TabsTrigger 
          value="featured" 
          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary"
        >
          <Flame className="h-4 w-4" />
          Featured
        </TabsTrigger>
        <TabsTrigger 
          value="bundles"
          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Package className="h-4 w-4" />
          Bundles
        </TabsTrigger>
        <TabsTrigger 
          value="weapons"
          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Sword className="h-4 w-4" />
          Weapons
        </TabsTrigger>
        <TabsTrigger 
          value="skins"
          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Shirt className="h-4 w-4" />
          Skins
        </TabsTrigger>
        <TabsTrigger 
          value="powerups"
          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Zap className="h-4 w-4" />
          Power-ups
        </TabsTrigger>
      </TabsList>

      <TabsContent value="featured" className="mt-6">
        {children.featured}
      </TabsContent>
      <TabsContent value="bundles" className="mt-6">
        {children.bundles}
      </TabsContent>
      <TabsContent value="weapons" className="mt-6">
        {children.weapons}
      </TabsContent>
      <TabsContent value="skins" className="mt-6">
        {children.skins}
      </TabsContent>
      <TabsContent value="powerups" className="mt-6">
        {children.powerups}
      </TabsContent>
    </Tabs>
  );
};
