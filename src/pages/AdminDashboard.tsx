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
  Edit,
  Shield,
  Plus,
  Trash2,
  Phone,
  Key
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GROUP_OPTIONS } from "@/constants/groups";
import { useAdmin } from "@/contexts/AdminContext";

interface Player {
  id: string;
  full_name: string;
  email: string;
  cssbattle_profile_link: string | null;
  group: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout: adminLogout } = useAdmin();
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
    cssbattle_profile_link: "",
    phone_number: "",
    group: "" // Add group to edit form
  });
  
  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null
  });

  // State for create player form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    group: "",
    password: "",
    phone_number: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  // State for password change modal
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    player: Player | null;
    userId: string | null;
  }>({
    isOpen: false,
    player: null,
    userId: null
  });
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

    // Test database permissions
    testDatabasePermissions();
    
    fetchPlayers();
  }, [navigate]);

  const testDatabasePermissions = async () => {
    try {
      // Test select permission
      const { data: selectData, error: selectError } = await supabase
        .from('players')
        .select('id')
        .limit(1);
      
      console.log("AdminDashboard - Select test:", { data: selectData, error: selectError });
    } catch (error) {
      console.error("AdminDashboard - Permission test error:", error);
    }
  };

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
    adminLogout(); // Use the context logout function
    navigate("/admin");
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player.id);
    setEditForm({
      full_name: player.full_name,
      email: player.email,
      cssbattle_profile_link: player.cssbattle_profile_link || "",
      phone_number: player.phone_number || "",
      group: player.group || "" // Add group to edit form
    });
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditForm({
      full_name: "",
      email: "",
      cssbattle_profile_link: "",
      phone_number: "",
      group: "" // Add group to reset form
    });
  };

  const handleSendPasswordReset = async (player: Player) => {
    try {
      setLoading(true);
      setError(null);
      
      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(player.email, {
        redirectTo: `http://localhost:8080/reset-password`
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess(`Password reset email sent to ${player.email} successfully! The user can now reset their password.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError("Failed to send password reset email: " + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlayer = async (playerId: string) => {
    try {
      console.log("AdminDashboard - Updating player with ID:", playerId);
      console.log("AdminDashboard - Update data:", {
        full_name: editForm.full_name,
        email: editForm.email,
        cssbattle_profile_link: editForm.cssbattle_profile_link || null,
        phone_number: editForm.phone_number || null,
        group: editForm.group || null
      });
      
      // First, let's check if the player exists
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, full_name, email')
        .eq('id', playerId);
      
      console.log("AdminDashboard - Player fetch result:", playerData);
      console.log("AdminDashboard - Player fetch error:", playerError);
      
      if (playerError) {
        throw new Error(`Database error: ${playerError.message}`);
      }
      
      if (!playerData || playerData.length === 0) {
        throw new Error(`Player not found in database with ID: ${playerId}`);
      }
      
      // Now try to update
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          cssbattle_profile_link: editForm.cssbattle_profile_link || null,
          phone_number: editForm.phone_number || null,
          group: editForm.group || null
        })
        .eq('id', playerId);

      console.log("AdminDashboard - Update result:", updateData);
      console.log("AdminDashboard - Update error:", updateError);
      
      if (updateError) {
        // Log detailed error information
        console.error("AdminDashboard - Detailed update error:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Check if it's a permission error
        if (updateError.code === "42501") {
          throw new Error("Permission denied. You may not have the required permissions to update this record.");
        }
        
        throw new Error(`Failed to update player: ${updateError.message}`);
      }
      
      setSuccess("Player updated successfully!");
      setEditingPlayer(null);
      fetchPlayers(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("AdminDashboard - Update error:", err);
      setError(`Failed to update player: ${(err as Error).message}`);
    }
  };

  const handleCreatePlayer = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.group || !createForm.password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      // First, sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            full_name: createForm.full_name
          },
          emailRedirectTo: `https://cssbattle-pro.vercel.app/login`
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        // Insert user data into players table
        const { error: insertError } = await supabase
          .from('players')
          .insert([
            {
              full_name: createForm.full_name,
              email: createForm.email,
              group: createForm.group,
              phone_number: createForm.phone_number || null,
              score: 0 // Add score field to satisfy NOT NULL constraint
            }
          ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess("Player account created successfully!");
        setIsCreateModalOpen(false);
        setCreateForm({
          full_name: "",
          email: "",
          group: "",
          password: "",
          phone_number: ""
        });
        fetchPlayers(); // Refresh the player list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to create player account: " + (err as Error).message);
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    console.log("=== DELETE OPERATION START ===");
    console.log("Attempting to delete player with ID:", playerId);
    
    try {
      // Show loading state
      setLoading(true);
      setError(null);
      
      // First, let's try to delete from players table
      console.log("Attempting to delete player from players table...");
      const { data, error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .select(); // Add select() to get the deleted record
      
      console.log("Delete operation result:", { data, error });
      
      if (error) {
        console.error("Database delete error:", error);
        // Check if it's a permission error
        if (error.code === "42501") {
          throw new Error("Permission denied. You may not have the required permissions to delete this record.");
        }
        throw new Error(`Failed to delete player from database: ${error.message}`);
      }
      
      // Check if any rows were actually deleted
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Player deleted successfully:", data[0]);
        setSuccess("Player deleted successfully!");
      } else {
        console.warn("No rows were deleted - player may not exist or was already deleted");
        setSuccess("Player may have already been deleted.");
      }
      
      // Close the modal and refresh the list
      setDeleteConfirmation({ isOpen: false, player: null });
      fetchPlayers();
      
      console.log("=== DELETE OPERATION END ===");
    } catch (error) {
      console.error("=== DELETE OPERATION ERROR ===");
      console.error("Error details:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";
      setError("Delete failed: " + errorMessage);
      setDeleteConfirmation({ isOpen: false, player: null });
    } finally {
      setLoading(false);
    }
  };

  const debugDeleteOperation = async (playerId: string) => {
    console.log("=== DEBUG DELETE OPERATION START ===");
    console.log("Attempting to debug delete player with ID:", playerId);
    
    try {
      // Show loading state
      setLoading(true);
      setError(null);
      
      // Debug: First check if the player exists
      console.log("Debug: Checking if player exists before deletion...");
      const { data: existingData, error: existingError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId);
      
      console.log("Player existence check:", { existingData, existingError });
      
      if (existingError) {
        throw new Error(`Error checking player existence: ${existingError.message}`);
      }
      
      if (!existingData || existingData.length === 0) {
        console.warn("Player does not exist, nothing to delete");
        setSuccess("Player may have already been deleted.");
        setDeleteConfirmation({ isOpen: false, player: null });
        fetchPlayers();
        return;
      }
      
      console.log("Player exists, proceeding with deletion:", existingData[0]);
      
      // Get user info for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user for delete operation:", user);
      
      // Log the exact query we're about to execute
      console.log("Executing DELETE query for player ID:", playerId);
      
      // First, let's try to delete from players table
      console.log("Attempting to delete player from players table...");
      const { data, error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .select(); // Add select() to get the deleted record
      
      console.log("Delete operation result:", { data, error });
      
      if (error) {
        console.error("Database delete error:", error);
        // Check if it's a permission error
        if (error.code === "42501") {
          throw new Error("Permission denied. You may not have the required permissions to delete this record.");
        }
        throw new Error(`Failed to delete player from database: ${error.message}`);
      }
      
      // Check if any rows were actually deleted
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Player deleted successfully:", data[0]);
        setSuccess("Player deleted successfully!");
      } else {
        console.warn("No rows were deleted - checking why...");
        
        // This is the critical part - let's investigate why no rows were deleted
        console.log("Investigating why no rows were deleted:");
        console.log("1. Checking if this is due to RLS policies...");
        
        // Try a more direct approach to see if there are any policy issues
        console.log("2. Checking current session and permissions...");
        
        // Double-check by trying to fetch the player again
        console.log("3. Double-checking if player still exists...");
        const { data: verificationData, error: verificationError } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId);
        
        console.log("Verification result:", { verificationData, verificationError });
        
        if (verificationError) {
          console.warn("Verification error:", verificationError);
          setSuccess("Delete operation completed but verification failed.");
        } else if (verificationData && Array.isArray(verificationData) && verificationData.length === 0) {
          console.log("Verification confirms player has been deleted");
          setSuccess("Player deleted successfully!");
        } else if (verificationData && Array.isArray(verificationData) && verificationData.length > 0) {
          console.warn("Player still exists after delete attempt");
          console.warn("This suggests an RLS policy is preventing deletion");
          
          // Try to get more information about the policies
          console.log("Attempting to diagnose RLS policy issue...");
          
          setSuccess("Delete operation completed but player may still exist due to RLS policies.");
        } else {
          console.warn("Unexpected verification result");
          setSuccess("Delete operation completed but status is unclear.");
        }
      }
      
      // Close the modal and refresh the list
      setDeleteConfirmation({ isOpen: false, player: null });
      fetchPlayers();
      
      console.log("=== DEBUG DELETE OPERATION END ===");
    } catch (error) {
      console.error("=== DEBUG DELETE OPERATION ERROR ===");
      console.error("Error details:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";
      setError("Delete failed: " + errorMessage);
      setDeleteConfirmation({ isOpen: false, player: null });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm({ ...createForm, password });
  };

  const handleChangePassword = (player: Player, userId: string) => {
    setPasswordModal({
      isOpen: true,
      player: player,
      userId: userId
    });
    setNewPassword("");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!passwordModal.userId) {
      setError("User ID not found");
      return;
    }

    setIsUpdatingPassword(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to perform this action");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-password', {
        body: {
          action: 'update_password',
          userId: passwordModal.userId,
          newPassword: newPassword
        }
      });

      if (error) {
        throw error;
      }

      setSuccess("Password updated successfully!");
      setPasswordModal({ isOpen: false, player: null, userId: null });
      setNewPassword("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Password update error:", err);
      setError(`Failed to update password: ${(err as Error).message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const analyzeRLSPolicies = async () => {
    console.log("ANALYZING RLS POLICIES");
    
    try {
      // Create a test player to analyze policies against
      console.log("Creating test player...");
      const testEmail = `policy-test-${Date.now()}@example.com`;
      const { data: insertData, error: insertError } = await supabase
        .from('players')
        .insert([
          {
            full_name: "Policy Test User",
            email: testEmail,
            group: "DD101",
            score: 0 // Explicitly set score to satisfy NOT NULL constraint
          }
        ])
        .select();
      
      console.log("Insert result:", { insertData, insertError });
      
      if (insertError) {
        console.error("Failed to create test player:", insertError);
        alert("Failed to create test player: " + insertError.message);
        return;
      }
      
      if (!insertData || insertData.length === 0) {
        console.error("No test player created");
        alert("Failed to create test player");
        return;
      }
      
      const testPlayerId = insertData[0].id;
      console.log("Test player created with ID:", testPlayerId);
      
      // Test different DELETE conditions to understand the policy
      console.log("Testing DELETE with exact ID match...");
      const { data: deleteData1, error: deleteError1 } = await supabase
        .from('players')
        .delete()
        .eq('id', testPlayerId)
        .select();
      
      console.log("DELETE with exact ID:", { deleteData1, deleteError1 });
      
      // Verify if deleted
      const { data: verify1, error: verifyError1 } = await supabase
        .from('players')
        .select('*')
        .eq('id', testPlayerId);
      
      console.log("Verification after exact ID DELETE:", { verify1, verifyError1 });
      
      const wasDeletedWithExactId = verify1 && Array.isArray(verify1) && verify1.length === 0;
      console.log("Was deleted with exact ID?", wasDeletedWithExactId);
      
      // If not deleted, try to delete the test player with a different approach
      if (!wasDeletedWithExactId) {
        console.log("Player not deleted with exact ID - testing cleanup...");
        // Clean up the test player for next test
        await supabase
          .from('players')
          .delete()
          .eq('id', testPlayerId);
      }
      
      alert("RLS policy analysis completed. Check console for detailed results.");
      
    } catch (error) {
      console.error("RLS analysis error:", error);
      alert("Error during RLS analysis: " + (error as Error).message);
    }
  };

  const testRLSPolicies = async () => {
    console.log("TESTING RLS POLICIES");
    
    // Try to delete a fake player to test RLS policies
    const fakeId = "00000000-0000-0000-0000-000000000000";
    console.log("Testing delete with fake ID:", fakeId);
    
    try {
      const { data, error } = await supabase
        .from('players')
        .delete()
        .eq('id', fakeId)
        .select();
      
      console.log("RLS test result:", { data, error });
      
      if (error) {
        alert("RLS test failed: " + error.message + " (Code: " + error.code + ")");
      } else {
        alert("RLS test completed - no error (this might indicate permissions are too permissive)");
      }
    } catch (error) {
      console.error("RLS test error:", error);
      alert("RLS test error: " + (error as Error).message);
    }
  };

  const checkRLSPoliciesDetailed = async () => {
    console.log("DETAILED RLS POLICY CHECK");
    
    try {
      // This would normally be done via SQL, but we can test the effects
      console.log("Testing current user permissions...");
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        alert("Error getting user info: " + userError.message);
        return;
      }
      
      console.log("Current user:", user);
      
      // Test what operations are allowed
      console.log("Testing SELECT permission...");
      const { data: selectData, error: selectError } = await supabase
        .from('players')
        .select('id')
        .limit(1);
      
      console.log("SELECT test:", { allowed: !selectError, error: selectError });
      
      // Test INSERT permission
      console.log("Testing INSERT permission...");
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: insertData, error: insertError } = await supabase
        .from('players')
        .insert([
          {
            full_name: "Test User",
            email: testEmail,
            group: "DD101",
            score: 0 // Add score field to satisfy NOT NULL constraint
          }
        ])
        .select();
      
      console.log("INSERT test:", { allowed: !insertError, error: insertError });
      
      // If insert succeeded, test UPDATE and DELETE on the test record
      if (insertData && Array.isArray(insertData) && insertData.length > 0) {
        const testPlayerId = insertData[0].id;
        console.log("Testing UPDATE permission on test record...");
        const { data: updateData, error: updateError } = await supabase
          .from('players')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testPlayerId);
        
        console.log("UPDATE test:", { allowed: !updateError, error: updateError });
        
        console.log("Testing DELETE permission on test record...");
        const { data: deleteData, error: deleteError } = await supabase
          .from('players')
          .delete()
          .eq('id', testPlayerId)
          .select();
        
        console.log("DELETE test:", { allowed: !deleteError, data: deleteData, error: deleteError });
        
        // Verify deletion
        if (!deleteError) {
          const { data: verifyData, error: verifyError } = await supabase
            .from('players')
            .select('*')
            .eq('id', testPlayerId);
          
          console.log("DELETE verification:", { 
            recordDeleted: verifyData && Array.isArray(verifyData) && verifyData.length === 0,
            remainingData: verifyData,
            error: verifyError 
          });
        }
      }
      
      alert("RLS policy check completed. Check console for detailed results.");
    } catch (error) {
      console.error("Detailed RLS check error:", error);
      alert("Error during RLS check: " + (error as Error).message);
    }
  };

  const runSimpleDeleteTest = async () => {
    console.log("RUNNING SIMPLE DELETE TEST");
    
    // Get the first player in the list
    if (players.length === 0) {
      alert("No players to test with");
      return;
    }
    
    const testPlayer = players[0];
    console.log("Testing delete with player:", testPlayer);
    
    // Show confirmation
    if (!window.confirm(`Delete player ${testPlayer.full_name}? This is a test and will actually delete the player!`)) {
      return;
    }
    
    // Try to delete this player
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .delete()
        .eq('id', testPlayer.id)
        .select();
      
      console.log("Simple delete test result:", { data, error });
      
      if (error) {
        throw error;
      }
      
      alert("Player deleted successfully!");
      fetchPlayers();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed: " + (error as Error).message);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div></div> {/* Empty div for spacing */}
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              CSS <span className="bg-gradient-primary bg-clip-text text-transparent">BATTLE</span> Admin Dashboard
            </h1>
            {adminEmail && (
              <p className="text-sm text-foreground/70 mt-1 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1 text-battle-accent inline-flex" />
                Logged in as: <span className="text-battle-purple font-medium ml-1">{adminEmail}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Player
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-battle-purple/50 hover:bg-battle-purple/10"
              disabled={loading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.player && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">Confirm Deletion</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setDeleteConfirmation({ isOpen: false, player: null })}
                    className="text-foreground hover:bg-battle-purple/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mb-6">
                  <p className="text-foreground/80 mb-4">
                    Are you sure you want to delete the player <span className="font-bold text-foreground">
                    {deleteConfirmation.player.full_name}</span>? This action cannot be undone.
                  </p>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-200 text-sm">
                      <strong>Warning:</strong> This will permanently remove the player's account and all associated data.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setDeleteConfirmation({ isOpen: false, player: null })}
                    variant="outline"
                    className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log("Delete button clicked, player ID:", deleteConfirmation.player!.id);
                      handleDeletePlayer(deleteConfirmation.player!.id);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Player
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Player Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
...
          </div>
        )}

        {/* Password Change Modal */}
        {passwordModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">Change Password</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setPasswordModal({ isOpen: false, player: null, userId: null });
                      setNewPassword("");
                    }}
                    className="text-foreground hover:bg-battle-purple/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {error && !success && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-battle-purple/30">
                    <p className="text-sm text-foreground/70 mb-1">Player</p>
                    <p className="font-semibold text-foreground">{passwordModal.player?.full_name}</p>
                    <p className="text-sm text-foreground/70">{passwordModal.player?.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-foreground">New Password *</Label>
                    <Input
                      id="new_password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => {
                        setPasswordModal({ isOpen: false, player: null, userId: null });
                        setNewPassword("");
                      }}
                      variant="outline"
                      className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdatePassword}
                      className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

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
              <div className="w-12 h-12 bg-battle-accent rounded-lg flex items-center justify-center mr-4">
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
                  <th className="text-left p-4 text-foreground font-semibold">Phone</th>
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
                      {editingPlayer === player.id ? (
                        <Input
                          value={editForm.phone_number || ""}
                          onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                          className="bg-background/50 border-battle-purple/30"
                        />
                      ) : (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {player.phone_number || "Not provided"}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editingPlayer === player.id ? (
                        <Select value={editForm.group} onValueChange={(value) => setEditForm({...editForm, group: value})}>
                          <SelectTrigger className="bg-background/50 border-battle-purple/30">
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent>
                            {GROUP_OPTIONS.map((group) => (
                              <SelectItem key={group.value} value={group.value}>
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          {player.group ? GROUP_OPTIONS.find(option => option.value === player.group)?.label || player.group : 'No group'}
                        </div>
                      )}
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
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSendPasswordReset(player)}
                            size="sm"
                            variant="outline"
                            className="border-battle-purple/50 hover:bg-battle-purple/10"
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            onClick={() => handleEditPlayer(player)}
                            size="sm"
                            variant="outline"
                            className="border-battle-purple/50 hover:bg-battle-purple/10"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleChangePassword(player, player.id)}
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/50 hover:bg-yellow-500/10"
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Password
                          </Button>
                          <Button
                            onClick={() => {
                              console.log("DELETE BUTTON CLICKED for player:", player);
                              setDeleteConfirmation({ isOpen: true, player });
                            }}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 hover:bg-red-500/10"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
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












































































