import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, admin } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if already logged in as admin
    if (isAdmin && admin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, admin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed");
      }

      // Verify the user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error("You do not have admin privileges");
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      navigate("/admin/dashboard");
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message || "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
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
            CSS{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>{" "}
            Admin
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Admin Login
            </h2>
            <p className="text-foreground/80">Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="pl-10 bg-background/50 border-battle-purple/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-background/50 border-battle-purple/30"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow text-foreground"
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
