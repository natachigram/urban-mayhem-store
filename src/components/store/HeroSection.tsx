import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 md:p-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/20 to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <div className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1 text-sm font-semibold text-primary backdrop-blur-sm">
          Season 5 • Now Live
        </div>
        
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-6xl">
          Choose Your
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Combat Mode
          </span>
        </h1>
        
        <p className="mb-6 text-lg text-muted-foreground">
          Equip legendary weapons, unlock exclusive skins, and dominate the battlefield. 
          New items verified by the community every week.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-glow-primary">
            Explore Store
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline">
            View Leaderboard
          </Button>
        </div>
      </div>

      {/* Hero Image - Right Side */}
      <div className="absolute right-0 top-0 hidden h-full w-1/2 items-center justify-end md:flex">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-3xl"></div>
          {/* Character image would go here */}
        </div>
      </div>
    </section>
  );
};
