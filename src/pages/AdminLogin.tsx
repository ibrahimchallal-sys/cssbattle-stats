import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { safeLocalStorage } from "@/lib/storage";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, admin, logout: adminLogout } = useAdmin();
  const { user, logout: playerLogout } = useAuth();

  // Admin data with name, email, and password
  const adminUsers = [
    {
      name: "Brahim Bousseta",
      email: "brahimbousseta@adminofppt.com",
      password: "passwordPro",
    },
    {
      name: "Ibrahim Challal",
      email: "ibrahimchallal@admincss.com",
      password: "passwordChallal",
    },
    {
      name: "Younes Hlibi",
      email: "younesshlibi@admincss.com",
      password: "passwordHlibi",
    },
    {
      name: "Abd El Monim Mazgoura",
      email: "mazgouraabdalmonim@admincss.com",
      password: "passwordMazgoura",
    },
    {
      name: "Hamdi Boumlik",
      email: "hamdiboumlik@admincss.com",
      password: "passwordPro",
    },
  ];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AdminLogin - isAdmin:", isAdmin, "admin:", admin);
    // Redirect if already logged in as admin
    if (isAdmin && admin) {
      console.log("Already logged in, redirecting to dashboard");
      navigate("/admin/dashboard");
    }
  }, [isAdmin, admin, navigate]);

  // Also check localStorage directly on component mount
  useEffect(() => {
    console.log("Checking localStorage for admin data");
    const hardcodedAdmin = localStorage.getItem("hardcoded_admin");
    console.log("Found hardcodedAdmin:", hardcodedAdmin);
    if (hardcodedAdmin) {
      try {
        const adminData = JSON.parse(hardcodedAdmin);
        console.log("Parsed adminData:", adminData);
        if (adminData && adminData.email) {
          console.log("Admin data found, redirecting to dashboard");
          navigate("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error parsing admin data:", error);
        localStorage.removeItem("hardcoded_admin");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (user) {
        console.log("Logging out player session before admin login");
        await playerLogout();
        toast({
          title: "Session Switched",
          description:
            "You have been logged out as player. Logging in as admin...",
        });
      }

      // Check if email is in our admin list
      const validAdmin = adminUsers.find((admin) => admin.email === email);
      if (!validAdmin) {
        throw new Error("Invalid admin email");
      }

      // Check if password matches the specific admin's password
      if (password !== validAdmin.password) {
        throw new Error("Invalid password");
      }

      // Try to find a real admin user ID from the database
      let adminUserId = "00000000-0000-0000-0000-000000000000"; // Default placeholder
      let foundRealAdmin = false;

      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1);

        if (!adminError && adminUsers && adminUsers.length > 0) {
          adminUserId = adminUsers[0].user_id;
          foundRealAdmin = true;
          console.log("Found real admin user ID:", adminUserId);
        } else {
          console.log("No real admin users found, using placeholder UUID");
        }
      } catch (dbError) {
        console.warn("Could not fetch admin user ID from database:", dbError);
      }

      // Store admin session in localStorage with proper UUID
      const adminData = {
        id: adminUserId,
        email: email,
        // Add other relevant admin data here if needed
      };

      safeLocalStorage.setItem("hardcoded_admin", JSON.stringify(adminData));

      // Dispatch storage event to notify AdminContext of the change
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "hardcoded_admin",
          newValue: JSON.stringify(adminData),
          storageArea: localStorage,
        })
      );

      toast({
        title: "Success",
        description: "You have been logged in as admin successfully!",
      });

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      const errorMessage = (err as Error).message || "Login failed";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-background py-4 px-4 sm:px-6 flex items-center justify-center overflow-hidden">
      <div className="max-w-md w-full">
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-foreground hover:bg-white h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Admin Login</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-foreground text-sm">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-battle-purple/30 bg-background/50 px-2.5 py-1 pl-8 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
                  required
                  aria-label="Select admin"
                >
                  <option value="">Select an admin...</option>
                  {adminUsers.map((admin) => (
                    <option key={admin.email} value={admin.email}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-background/50 border-battle-purple/30 h-8 text-xs px-2.5 py-1"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center py-1">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-primary hover:scale-[1.02] transition-transform shadow-glow text-foreground h-8 text-xs"
              >
                {isSubmitting ? "Logging in..." : "Login as Admin"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
