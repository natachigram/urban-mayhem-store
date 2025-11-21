import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Wallet } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                URBAN MAYHEM
              </h1>
              <div className="absolute -inset-1 bg-gradient-primary opacity-20 blur-xl"></div>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              Store
            </Link>
            <Link to="/leaderboard" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link to="/servers" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              Servers
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold">
              0
            </span>
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
