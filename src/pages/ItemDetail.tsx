import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp, Star, ShoppingCart } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

// Mock data - will be replaced with real data
const mockItemDetails = {
  "1": {
    id: "1",
    name: "Plasma Rifle X",
    type: "Weapon",
    description: "High-powered energy weapon with plasma core technology. Delivers devastating damage at medium to long range.",
    longDescription: `The Plasma Rifle X represents the pinnacle of energy weapon engineering. Its advanced plasma core generates superheated bolts capable of melting through armor plating. 

**Features:**
- Adjustable fire rate (semi-auto to full-auto)
- Integrated cooling system for sustained fire
- Smart targeting assist
- Modular attachments support

Perfect for tactical engagements where precision and power matter most.`,
    imageUrl: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800&h=800&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=800&fit=crop",
    ],
    price: 29.99,
    rarity: "legendary" as const,
    attestationScore: 95,
    attestationCount: 342,
    purchaseCount: 1205,
    creator: {
      name: "ArmsDealer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArmsDealer",
      totalRevenue: 36149.95,
    },
    stats: {
      damage: 85,
      range: 90,
      fireRate: 75,
      accuracy: 88,
    },
  },
};

const rarityColors = {
  common: "text-rarity-common border-rarity-common",
  rare: "text-rarity-rare border-rarity-rare",
  epic: "text-rarity-epic border-rarity-epic",
  legendary: "text-rarity-legendary border-rarity-legendary",
};

const ItemDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [rating, setRating] = useState([4]);
  const [comment, setComment] = useState("");
  const [isAttesting, setIsAttesting] = useState(false);

  const item = mockItemDetails[id as keyof typeof mockItemDetails];

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Item Not Found</h1>
          <Link to="/">
            <Button>Return to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitAttestation = async () => {
    setIsAttesting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Attestation Submitted!",
      description: `Your ${rating[0]}-star rating for ${item.name} has been recorded on-chain.`,
    });
    
    setIsAttesting(false);
    setComment("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/20">
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="h-full w-full object-cover"
              />
              
              {/* Rarity Badge */}
              <Badge 
                variant="outline" 
                className={`absolute right-4 top-4 ${rarityColors[item.rarity]} backdrop-blur-sm bg-background/80`}
              >
                {item.rarity}
              </Badge>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">{item.type}</p>
              <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
              
              {/* Attestation Score */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{item.attestationScore}</span>
                  <span className="text-sm text-muted-foreground">Attestation Score</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {item.attestationCount} attestations • {item.purchaseCount} purchases
                </div>
              </div>

              {/* Creator Info */}
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold">{item.creator.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-bold">{item.creator.name}</p>
                  </div>
                </div>
              </Card>

              {/* Price & Actions */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-primary">${item.price}</span>
                
                <div className="flex gap-2 ml-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="outline" className="gap-2">
                        <Star className="h-5 w-5" />
                        Recommend / Rate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rate {item.name}</DialogTitle>
                        <DialogDescription>
                          Your attestation will be recorded on-chain via Intuition Protocol
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        <div>
                          <label className="text-sm font-medium mb-3 block">
                            Rating: {rating[0]} / 5 stars
                          </label>
                          <Slider
                            value={rating}
                            onValueChange={setRating}
                            min={1}
                            max={5}
                            step={1}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Poor</span>
                            <span>Excellent</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Comment (optional)
                          </label>
                          <Textarea
                            placeholder="Share your experience with this item..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={500}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {comment.length}/500 characters
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          onClick={handleSubmitAttestation}
                          disabled={isAttesting}
                          className="gap-2"
                        >
                          <Star className="h-4 w-4" />
                          {isAttesting ? "Submitting..." : "Submit Attestation"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button size="lg" className="gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </Button>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {item.longDescription}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Stats */}
              <div>
                <h2 className="text-xl font-bold mb-4">Stats</h2>
                <div className="space-y-3">
                  {Object.entries(item.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{stat}</span>
                        <span className="font-bold">{value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetail;
