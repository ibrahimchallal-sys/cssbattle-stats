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
  const [updating, setUpdating] = useState(false);
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

  const fetchScoreFromProfile = async (profileUrl: string): Promise<number | null> => {
    try {
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(profileUrl)}`);
      const html = await response.text();
      
      const scoreMatch = html.match(/<div[^>]*class="score"[^>]*>(\d+(?:,\d+)*)<\/div>/i) ||
                         html.match(/score['":\s]+(\d+(?:,\d+)*)/i) ||
                         html.match(/>(\d+(?:,\d+)*)\s*<[^>]*>.*?score/i);
      
      if (scoreMatch && scoreMatch[1]) {
        return parseInt(scoreMatch[1].replace(/,/g, ''));
      }
      return null;
    } catch (error) {
      console.error('Error fetching score:', error);
      return null;
    }
  };

  const updateAllScores = async () => {
    setUpdating(true);
    let successCount = 0;
    let failCount = 0;

    for (const player of players) {
      if (player.cssbattle_profile_link) {
        const score = await fetchScoreFromProfile(player.cssbattle_profile_link);
        
        if (score !== null) {
          const { error } = await supabase
            .from('players')
            .update({ 
              score, 
              last_score_update: new Date().toISOString() 
            })
            .eq('id', player.id);

          if (!error) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setUpdating(false);
    toast({
      title: "Update Complete",
      description: `Updated ${successCount} players. ${failCount} failed.`,
    });
    
    fetchPlayers();
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
            
            <Button
              onClick={updateAllScores}
              disabled={updating || loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              Update Scores
            </Button>
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
                      <div className="text-xs text-muted-foreground">
                        {player.last_score_update 
                          ? `Updated ${new Date(player.last_score_update).toLocaleDateString()}`
                          : 'Not updated'
                        }
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
