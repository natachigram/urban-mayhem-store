import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Globe } from "lucide-react";

const mockServers = [
  { id: 1, name: "RAID", region: "NA-EAST", players: 24, maxPlayers: 32, ping: 15, status: "online" },
  { id: 2, name: "SOLO", region: "EU-WEST", players: 31, maxPlayers: 32, ping: 45, status: "online" },
  { id: 3, name: "SOLO", region: "ASIA", players: 18, maxPlayers: 32, ping: 120, status: "online" },
  { id: 4, name: "RAID", region: "NA-WEST", players: 28, maxPlayers: 32, ping: 32, status: "online" },
];

const Servers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Game Servers</h1>
          <p className="text-muted-foreground">Join active matches worldwide</p>
        </div>

        <div className="grid gap-4">
          {mockServers.map((server) => (
            <Card key={server.id} className="overflow-hidden border-border/40 bg-gradient-card transition-all hover:border-primary/50 hover:shadow-glow-primary">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20 text-2xl font-bold">
                    {server.name}
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-bold">{server.name} Server</h3>
                      <Badge variant="outline" className="border-primary text-primary">
                        <Globe className="mr-1 h-3 w-3" />
                        {server.region}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{server.players}/{server.maxPlayers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>{server.ping}ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                      <div 
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button className="bg-primary shadow-glow-primary hover:bg-primary/90">
                    Join Server
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Servers;
