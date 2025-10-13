import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Trophy, 
  Target, 
  LogOut, 
  Link, 
  Calendar, 
  ArrowLeft, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Save, 
  X, 
  Edit 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GROUP_OPTIONS } from "@/constants/groups";

interface Player {
  id: string;
  full_name: string;
  email: string;
  cssbattle_profile_link: string | null;
  group: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    cssbattle_profile_link: ""
  });

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem("adminSession");
    if (!adminSession) {
      navigate("/admin");
      return;
    }

    // Parse admin session to get email
    try {
      const sessionData = JSON.parse(adminSession);
      setAdminEmail(sessionData.email || "");
    } catch (error) {
      console.error("Error parsing admin session:", error);
      setAdminEmail("");
    }

    fetchPlayers();
  }, [navigate]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPlayers(data || []);
    } catch (err) {
      setError("Failed to fetch players");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin");
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player.id);
    setEditForm({
      full_name: player.full_name,
      email: player.email,
      cssbattle_profile_link: player.cssbattle_profile_link || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditForm({
      full_name: "",
      email: "",
      cssbattle_profile_link: ""
    });
  };

  const handleSavePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          cssbattle_profile_link: editForm.cssbattle_profile_link || null
        })
        .eq('id', playerId);

      if (error) {
        throw error;
      }

      setSuccess("Player updated successfully!");
      setEditingPlayer(null);
      fetchPlayers(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update player");
      console.error(err);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = groupFilter === "all" || player.group === groupFilter;
    
    return matchesSearch && matchesGroup;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battle-purple mx-auto mb-4"></div>
          <p className="text-foreground/80">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              CSS <span className="bg-gradient-primary bg-clip-text text-transparent">BATTLE</span> Admin Dashboard
            </h1>
            {adminEmail && (
              <p className="text-sm text-foreground/70 mt-1">
                Logged in as: <span className="text-battle-purple font-medium">{adminEmail}</span>
              </p>
            )}
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-battle-purple/50 hover:bg-battle-purple/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-battle-purple rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{players.length}</p>
                <p className="text-foreground/70">Total Players</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-battle-yellow rounded-lg flex items-center justify-center mr-4">
                <Link className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {players.filter(p => p.cssbattle_profile_link).length}
                </p>
                <p className="text-foreground/70">With CSS Battle Profile</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-battle-pink rounded-lg flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-foreground/70">Today's Date</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Messages */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search players by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-battle-purple/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-48 bg-background/50 border-battle-purple/30">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {GROUP_OPTIONS.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              Error: {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
              {success}
            </div>
          )}
        </div>

        {/* Players Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
          <div className="p-6 border-b border-battle-purple/30">
            <h2 className="text-xl font-bold text-foreground">Registered Players</h2>
            <p className="text-foreground/70">Manage all registered players</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50">
                <tr>
                  <th className="text-left p-4 text-foreground font-semibold">Name</th>
                  <th className="text-left p-4 text-foreground font-semibold">Email</th>
                  <th className="text-left p-4 text-foreground font-semibold">Group</th>
                  <th className="text-left p-4 text-foreground font-semibold">CSS Battle Profile</th>
                  <th className="text-left p-4 text-foreground font-semibold">Registered</th>
                  <th className="text-left p-4 text-foreground font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className="border-t border-battle-purple/20">
                    <td className="p-4">
                      {editingPlayer === player.id ? (
                        <Input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="bg-background/50 border-battle-purple/30"
                        />
                      ) : (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          {player.full_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editingPlayer === player.id ? (
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="bg-background/50 border-battle-purple/30"
                        />
                      ) : (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                          {player.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        {player.group ? GROUP_OPTIONS.find(option => option.value === player.group)?.label || player.group : 'No group'}
                      </div>
                    </td>
                    <td className="p-4">
                      {editingPlayer === player.id ? (
                        <Input
                          value={editForm.cssbattle_profile_link}
                          onChange={(e) => setEditForm({...editForm, cssbattle_profile_link: e.target.value})}
                          placeholder="CSS Battle profile URL"
                          className="bg-background/50 border-battle-purple/30"
                        />
                      ) : (
                        <div className="flex items-center">
                          <Link className="w-4 h-4 mr-2 text-muted-foreground" />
                          {player.cssbattle_profile_link ? (
                            <a 
                              href={player.cssbattle_profile_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-battle-purple hover:underline"
                            >
                              View Profile
                            </a>
                          ) : (
                            <span className="text-foreground/50">Not provided</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-foreground/70">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(player.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {editingPlayer === player.id ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSavePlayer(player.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleEditPlayer(player)}
                          size="sm"
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPlayers.length === 0 && (
            <div className="p-8 text-center text-foreground/70">
              <Users className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
              <p>No players found matching your search criteria.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;