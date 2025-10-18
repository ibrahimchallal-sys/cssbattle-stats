import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TestPlayerFetch = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [migrationStatus, setMigrationStatus] = useState<string>("");

  const testFetchPlayers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log("Current user:", user);
      
      // Try to fetch players
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .limit(10);
        
      console.log("Players fetch result:", { data, error });
      
      if (error) {
        setError(error.message);
      } else {
        setPlayers(data || []);
      }
    } catch (err) {
      console.error("Test error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyMigrations = async () => {
    setLoading(true);
    try {
      // Try to create the players_public view
      const { error: viewError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE OR REPLACE VIEW public.players_public AS
          SELECT 
            id,
            full_name,
            email,
            group_name,
            score,
            created_at,
            updated_at,
            cssbattle_profile_link,
            phone,
            badges,
            rank,
            verified_ofppt
          FROM public.players;
          
          GRANT SELECT ON public.players_public TO anon, authenticated;
        `
      });
      
      if (viewError) {
        // Try alternative approach - disable RLS
        const { error: rlsError } = await supabase.rpc('execute_sql', {
          sql: 'ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;'
        });
        
        if (rlsError) {
          setError(rlsError.message);
        } else {
          setMigrationStatus("RLS disabled on players table");
        }
      } else {
        setMigrationStatus("Players public view created");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Player Fetch Test</h1>
        
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 mb-6">
          <div className="flex gap-4">
            <Button 
              onClick={testFetchPlayers}
              disabled={loading}
              className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
            >
              {loading ? "Testing..." : "Test Player Fetch"}
            </Button>
            <Button 
              onClick={applyMigrations}
              disabled={loading}
              variant="outline"
              className="border-battle-purple/50 hover:bg-battle-purple/10"
            >
              {loading ? "Applying Migrations..." : "Apply Migrations"}
            </Button>
          </div>
        </Card>
        
        {migrationStatus && (
          <Card className="bg-green-900/50 backdrop-blur-sm border-green-500/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-green-200 mb-4">Migration Status</h2>
            <p className="text-green-100">{migrationStatus}</p>
          </Card>
        )}
        
        {error && (
          <Card className="bg-red-900/50 backdrop-blur-sm border-red-500/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-red-200 mb-4">Error</h2>
            <p className="text-red-100">{error}</p>
          </Card>
        )}
        
        {user && (
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Current User</h2>
            <pre className="bg-background/50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card>
        )}
        
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Players ({players.length})</h2>
          {players.length > 0 ? (
            <div className="space-y-4">
              {players.map((player) => (
                <Card key={player.id} className="bg-background/50 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{player.full_name}</h3>
                      <p className="text-foreground/70">{player.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono">Score: {player.score || 0}</p>
                      <p className="text-sm text-foreground/70">{player.group_name || "No group"}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-foreground/70">No players found</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TestPlayerFetch;