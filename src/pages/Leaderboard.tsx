import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, Medal, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Player {
  id: string;
  full_name: string;
  cssbattle_profile_link: string | null;
  score: number;
  group_name: string;
  email?: string;
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, cssbattle_profile_link, score, group_name, email')
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

  // Get top 10 players
  const topPlayers = players.slice(0, 10);
  
  // Find current user's rank and data
  const userRank = user ? players.findIndex(p => p.email === user.email) + 1 : -1;
  const userIsInTop10 = userRank > 0 && userRank <= 10;
  const currentUserData = user ? players.find(p => p.email === user.email) : null;

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
              <p className="text-muted-foreground mt-2">CSS Battle Championship Rankings - Top 10</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
            </div>
          ) : (
            <>
              {/* Top 10 Leaderboard */}
              <div className="space-y-3 mb-8">
                {topPlayers.map((player, index) => {
                  const isCurrentUser = user && player.email === user.email;
                  return (
                    <div
                      key={player.id}
                      className={`bg-card border rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${
                        isCurrentUser 
                          ? 'border-primary/80 shadow-lg shadow-primary/20 bg-primary/5' 
                          : 'border-border hover:border-primary/50 hover:shadow-primary/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                          isCurrentUser ? 'bg-primary/20' : 'bg-primary/10'
                        }`}>
                          {getRankIcon(index) || `#${index + 1}`}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${
                            isCurrentUser ? 'text-primary' : ''
                          }`}>
                            {player.full_name}
                            {isCurrentUser && <span className="ml-2 text-sm">(You)</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground">Group: {player.group_name}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            isCurrentUser ? 'text-primary' : 'text-primary'
                          }`}>
                            {player.score.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {topPlayers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No players registered yet
                  </div>
                )}
              </div>

              {/* Current User Card (if not in top 10) */}
              {user && !userIsInTop10 && currentUserData && userRank > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Your Ranking</h2>
                  <div className="bg-card border-2 border-primary/50 rounded-lg p-6 shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 font-bold text-xl text-primary">
                        #{userRank}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-primary">
                          {currentUserData.full_name}
                          <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">Group: {currentUserData.group_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {userRank - 10} places away from top 10
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {currentUserData.score.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">points</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
