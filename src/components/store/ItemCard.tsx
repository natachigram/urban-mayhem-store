import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export interface ItemCardProps {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  attestationScore?: number;
  creator?: {
    name: string;
    avatar?: string;
  };
}

const rarityColors = {
  common: "text-rarity-common border-rarity-common",
  rare: "text-rarity-rare border-rarity-rare",
  epic: "text-rarity-epic border-rarity-epic",
  legendary: "text-rarity-legendary border-rarity-legendary",
};

export const ItemCard = ({ 
  id, 
  name, 
  type, 
  imageUrl, 
  price, 
  rarity, 
  attestationScore,
  creator 
}: ItemCardProps) => {
  return (
    <Link to={`/item/${id}`}>
      <Card className="group relative overflow-hidden border-border/40 bg-gradient-card transition-all hover:border-primary/50 hover:shadow-glow-primary">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          <img 
            src={imageUrl} 
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Rarity Badge */}
          <Badge 
            variant="outline" 
            className={`absolute right-2 top-2 ${rarityColors[rarity]} backdrop-blur-sm bg-background/80`}
          >
            {rarity}
          </Badge>

          {/* Attestation Score */}
          {attestationScore !== undefined && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold text-primary">{attestationScore}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{type}</p>
            <h3 className="text-lg font-bold text-foreground line-clamp-1">{name}</h3>
          </div>

          {/* Creator Info */}
          {creator && (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>by</span>
              <span className="font-medium text-foreground">{creator.name}</span>
            </div>
          )}

          {/* Price and Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">${price}</span>
            </div>
            
            <Button 
              size="sm" 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-glow-primary"
              onClick={(e) => {
                e.preventDefault();
                // Add to cart logic
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Buy</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
