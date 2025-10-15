import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, Medal, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  full_name: string;
  cssbattle_profile_link: string | null;
  score: number;
  last_score_update: string | null;
  group: string;
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, cssbattle_profile_link, score, last_score_update, "group"')
        .order('score', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2">CSS Battle Championship Rankings</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 font-bold text-lg">
                      {getRankIcon(index) || `#${index + 1}`}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{player.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Group: {player.group}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {player.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No players registered yet
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
