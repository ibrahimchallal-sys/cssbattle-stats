import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, ArrowLeft, Shield } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminEmails = [
    "ibrahimchallal@admincss.com",
    "younesshlibi@admincss.com", 
    "hamdiboumlik@admincss.com",
    "abdelmoneim@admincss.com"
  ];

  const correctPassword = "passwordPRO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Simple validation - in a real app, this would be server-side
      if (!selectedEmail) {
        setError("Please select an admin email");
        return;
      }
      
      if (password !== correctPassword) {
        setError("Invalid password");
        return;
      }
      
      // Store admin session in localStorage
      localStorage.setItem("adminSession", JSON.stringify({
        email: selectedEmail,
        loggedInAt: new Date().toISOString()
      }));
      
      // Redirect to admin dashboard
      navigate("/admin/dashboard");
      
    } catch (err) {
      setError("Login failed. Please try again.");
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
            CSS <span className="bg-gradient-primary bg-clip-text text-transparent">BATTLE</span> Admin
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Admin Login</h2>
            <p className="text-foreground/80">Access the admin dashboard</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              Error: {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-foreground">Admin Email</Label>
              <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                <SelectTrigger className="bg-background/50 border-battle-purple/30">
                  <SelectValue placeholder="Select admin email" />
                </SelectTrigger>
                <SelectContent>
                  {adminEmails.map((email) => (
                    <SelectItem key={email} value={email}>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                        {email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
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
                disabled={isSubmitting || !selectedEmail}
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