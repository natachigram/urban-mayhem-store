import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

const mockLeaderboard = [
  { rank: 1, name: "ArmsDealer", score: 52824, level: 452, badge: "legendary" },
  { rank: 2, name: "StyleCraft", score: 48392, level: 438, badge: "epic" },
  { rank: 3, name: "PowerLab", score: 45217, level: 421, badge: "epic" },
  { rank: 4, name: "ProGear", score: 42156, level: 412, badge: "rare" },
  { rank: 5, name: "EliteSniper", score: 39841, level: 398, badge: "rare" },
];

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Creator Leaderboard</h1>
          <p className="text-muted-foreground">Top creators ranked by attestation scores</p>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {mockLeaderboard.slice(0, 3).map((creator, idx) => (
            <Card 
              key={creator.rank} 
              className={`relative overflow-hidden border-2 bg-gradient-card p-6 ${
                idx === 0 ? 'border-rarity-legendary md:order-2 md:scale-110' :
                idx === 1 ? 'border-rarity-epic md:order-1' :
                'border-rarity-rare md:order-3'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold">
                  {creator.rank}
                </div>
                <Trophy className={`h-8 w-8 ${
                  idx === 0 ? 'text-rarity-legendary' :
                  idx === 1 ? 'text-rarity-epic' :
                  'text-rarity-rare'
                }`} />
              </div>
              
              <Avatar className="mb-4 h-20 w-20 border-4 border-primary/50">
                <AvatarFallback className="text-2xl">{creator.name[0]}</AvatarFallback>
              </Avatar>
              
              <h3 className="mb-2 text-xl font-bold">{creator.name}</h3>
              <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                <TrendingUp className="h-5 w-5" />
                {creator.score.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Level {creator.level}</p>
            </Card>
          ))}
        </div>

        {/* Rest of Leaderboard */}
        <Card className="overflow-hidden border-border/40 bg-gradient-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/40 bg-secondary/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Creator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {mockLeaderboard.slice(3).map((creator) => (
                  <tr key={creator.rank} className="transition-colors hover:bg-secondary/10">
                    <td className="px-6 py-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">
                        {creator.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{creator.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">{creator.score.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{creator.level}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`border-rarity-${creator.badge} text-rarity-${creator.badge}`}>
                        {creator.badge}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
