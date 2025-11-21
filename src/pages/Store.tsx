import { Header } from "@/components/Header";
import { HeroSection } from "@/components/store/HeroSection";
import { StoreTabs } from "@/components/store/StoreTabs";
import { ItemCard, ItemCardProps } from "@/components/store/ItemCard";

// Mock data - will be replaced with real data from Supabase + Intuition
const mockItems: ItemCardProps[] = [
  {
    id: "1",
    name: "Plasma Rifle X",
    type: "Weapon",
    imageUrl: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800&h=800&fit=crop",
    price: 29.99,
    rarity: "legendary",
    attestationScore: 95,
    creator: { name: "ArmsDealer" }
  },
  {
    id: "2",
    name: "Neon Tactical Suit",
    type: "Skin",
    imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=800&fit=crop",
    price: 19.99,
    rarity: "epic",
    attestationScore: 88,
    creator: { name: "StyleCraft" }
  },
  {
    id: "3",
    name: "Speed Boost Pack",
    type: "Power-up",
    imageUrl: "https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800&h=800&fit=crop",
    price: 9.99,
    rarity: "rare",
    attestationScore: 92,
    creator: { name: "PowerLab" }
  },
  {
    id: "4",
    name: "Combat Bundle Pro",
    type: "Bundle",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=800&fit=crop",
    price: 49.99,
    rarity: "legendary",
    attestationScore: 97,
    creator: { name: "ProGear" }
  },
  {
    id: "5",
    name: "Sniper Elite Rifle",
    type: "Weapon",
    imageUrl: "https://images.unsplash.com/photo-1595433562696-a8650ceb3c00?w=800&h=800&fit=crop",
    price: 24.99,
    rarity: "epic",
    attestationScore: 89,
    creator: { name: "ArmsDealer" }
  },
  {
    id: "6",
    name: "Urban Camo Set",
    type: "Skin",
    imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=800&fit=crop",
    price: 14.99,
    rarity: "rare",
    attestationScore: 85,
    creator: { name: "StyleCraft" }
  },
];

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <HeroSection />
        </div>

        {/* Store Tabs */}
        <StoreTabs>
          {{
            featured: (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockItems.sort((a, b) => (b.attestationScore || 0) - (a.attestationScore || 0)).slice(0, 8).map((item) => (
                  <ItemCard key={item.id} {...item} />
                ))}
              </div>
            ),
            bundles: (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockItems.filter(item => item.type === "Bundle").map((item) => (
                  <ItemCard key={item.id} {...item} />
                ))}
              </div>
            ),
            weapons: (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockItems.filter(item => item.type === "Weapon").map((item) => (
                  <ItemCard key={item.id} {...item} />
                ))}
              </div>
            ),
            skins: (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockItems.filter(item => item.type === "Skin").map((item) => (
                  <ItemCard key={item.id} {...item} />
                ))}
              </div>
            ),
            powerups: (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockItems.filter(item => item.type === "Power-up").map((item) => (
                  <ItemCard key={item.id} {...item} />
                ))}
              </div>
            ),
          }}
        </StoreTabs>
      </main>
    </div>
  );
};

export default Store;
