import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Mail, Link, ArrowLeft, Save, User, Users, Shield, Phone } from "lucide-react";
import { GROUP_OPTIONS } from "@/constants/groups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    cssBattleProfileLink: user?.cssbattle_profile_link || "",
    phoneNumber: user?.phone || "",
    group: user?.group_name || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      group: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log("Profile - User object:", user);
      console.log("Profile - User ID:", user?.id);
      
      if (!user?.id) {
        throw new Error("User ID is missing. Please log out and log back in.");
      }
      
      // Instead of using single(), let's use a more flexible approach
      const { data: userData, error: userError } = await supabase
        .from('players')
        .select('id, full_name, email, group_name')
        .eq('id', user.id);
      
      console.log("Profile - User fetch result:", userData);
      console.log("Profile - User fetch error:", userError);
      
      if (userError) {
        throw new Error(`Database error: ${userError.message}`);
      }
      
      if (!userData || userData.length === 0) {
        throw new Error(`User not found in database with ID: ${user.id}. This might indicate the user record doesn't exist in the players table.`);
      }
      
      if (userData.length > 1) {
        console.warn("Profile - Multiple users found with same ID:", userData);
      }
      
      const userRecord = userData[0];
      console.log("Profile - Working with user record:", userRecord);
      
      // Try the update
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({
          full_name: formData.fullName,
          cssbattle_profile_link: formData.cssBattleProfileLink || null,
          phone: formData.phoneNumber || null,
          group_name: formData.group || null
        })
        .eq('id', user.id);
      
      console.log("Profile - Update result:", updateData);
      console.log("Profile - Update error:", updateError);
      
      if (updateError) {
        // Log detailed error information
        console.error("Profile - Detailed update error:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Check if it's a permission error
        if (updateError.code === "42501") {
          throw new Error("Permission denied. You may not have the required permissions to update this record.");
        }
        
        throw new Error(`Update failed: ${updateError.message}`);
      }
      
      // Check if any rows were affected
      if (updateData === null) {
        console.log("Profile - Update completed but no data returned. This is normal for update operations without select().");
      }
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile - Update error:", err);
      setError(`Failed to update profile: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Not Logged In</h2>
          <p className="text-foreground/80 mb-6">You need to be logged in to view this page.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate("/login")}
              className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
            >
              Log In
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
            >
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Debug: Log user object
  console.log("Profile - User object:", user);
  console.log("Profile - User ID:", user?.id);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-center flex-1 text-foreground">
            CSS <span className="bg-gradient-primary bg-clip-text text-transparent">BATTLE</span> Championship
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-12 h-12 text-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Your Profile</h2>
            <p className="text-foreground/80">Manage your account information</p>
            {isAdmin && (
              <div className="mt-2 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1 text-battle-accent" />
                <span className="text-sm text-battle-accent font-medium">Admin User</span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
              Error: {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-foreground">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground/70">Full Name</Label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="pl-10 bg-background/50 border-battle-purple/30"
                    required
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {user.full_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/70">Email</Label>
              <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {user.email}
                </div>
              </div>
              <p className="text-xs text-foreground/50">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground/70">Phone Number</Label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="pl-10 bg-background/50 border-battle-purple/30"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {user.phone ? (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {user.phone}
                    </div>
                  ) : (
                    <span className="text-foreground/50">Not provided</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm font-medium text-foreground/70">Player Group</Label>
              {isEditing ? (
                <Select value={formData.group} onValueChange={handleGroupChange}>
                  <SelectTrigger className="bg-background/50 border-battle-purple/30">
                    <SelectValue placeholder="Select your group" />
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
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    {user.group_name ? GROUP_OPTIONS.find(option => option.value === user.group_name)?.label || user.group_name : 'No group assigned'}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cssBattleProfileLink" className="text-sm font-medium text-foreground/70">CSSBattle Profile</Label>
              {isEditing ? (
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="cssBattleProfileLink"
                    name="cssBattleProfileLink"
                    value={formData.cssBattleProfileLink}
                    onChange={handleInputChange}
                    placeholder="https://cssbattle.dev/player/..."
                    className="pl-10 bg-background/50 border-battle-purple/30"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {user.cssbattle_profile_link ? (
                    <div className="flex items-center">
                      <Link className="w-4 h-4 mr-2 text-muted-foreground" />
                      <a 
                        href={user.cssbattle_profile_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-battle-purple hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  ) : (
                    <span className="text-foreground/50">Not provided</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              {isEditing ? (
                <>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                    setIsEditing(false);
                      setFormData({
                        fullName: user.full_name || "",
                        cssBattleProfileLink: user.cssbattle_profile_link || "",
                        phoneNumber: user.phone || "",
                        group: user.group_name || ""
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                    className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                  >
                    Edit Profile
                  </Button>
                  {isAdmin && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/dashboard")}
                      className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                  >
                    Log Out
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
