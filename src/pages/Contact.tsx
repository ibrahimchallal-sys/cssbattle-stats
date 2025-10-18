import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { Mail, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define the type for contact messages
interface ContactMessage {
  sender_id: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: "unread" | "read";
}

export default function Contact() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    recipient: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const [admins, setAdmins] = useState<Array<{ name: string; email: string }>>([]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("name, email")
        .order("name");
      
      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast({
        title: "Error",
        description: "Failed to load admin contacts",
        variant: "destructive",
      });
    }
  };

  const teamMembers = [
    {
      name: "ABDEL MONIM MAGOURA",
      role: "Stagiaire",
      cohort: "DEVOWS 203",
      email: "mazgouraabdalmounim@gmail.com",
    },
    {
      name: "IBRAHIM CHALLAL",
      role: "Stagiaire",
      cohort: "DEVOWS 203",
      email: "ibrahimchallal@admincss.com",
    },
    {
      name: "YOUNESS HLIBI",
      role: "Stagiaire",
      cohort: "DEVOWS 201",
      email: "younesshlibi@admincss.com",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recipient || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert<ContactMessage>({
          sender_id: user.id,
          sender_name: formData.fullName,
          sender_email: user.email,
          recipient_email: formData.recipient,
          subject: formData.subject,
          message: formData.message,
          status: "unread",
        } as never);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
      });

      // Reset form
      setFormData({
        fullName: user.full_name || "",
        recipient: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Contact
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Meet our team members and send them a message
          </p>
        </div>

        {/* Team Members Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-primary/30 hover:scale-105 transition-transform hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-xl text-foreground text-center">
                  {member.name}
                </CardTitle>
                <CardDescription className="text-primary text-center">
                  {member.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-foreground/80 mb-2 text-center">
                    {member.cohort}
                  </p>
                  {member.email !== "X" && (
                    <div className="flex items-center text-sm text-foreground/80">
                      <Mail className="w-4 h-4 mr-2" />
                      <a
                        href={`mailto:${member.email}`}
                        className="hover:text-primary transition-colors text-center break-all"
                      >
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card className="max-w-3xl mx-auto bg-card/50 backdrop-blur-sm border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Send a Message
            </CardTitle>
            <CardDescription className="text-center">
              Choose a team member and send them a message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Your Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="bg-background/50 border-primary/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Select Recipient</Label>
                <Select
                  value={formData.recipient}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recipient: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-primary/30">
                    <SelectValue placeholder="Choose a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <optgroup label="Team Members">
                      {teamMembers
                        .filter((m) => m.email !== "X")
                        .map((member, index) => (
                          <SelectItem key={`team-${index}`} value={member.email}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </optgroup>
                    <optgroup label="Admins">
                      {admins.map((admin, index) => (
                        <SelectItem key={`admin-${index}`} value={admin.email}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Enter message subject"
                  className="bg-background/50 border-primary/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Type your message here..."
                  rows={6}
                  className="bg-background/50 border-primary/30 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform"
                disabled={loading}
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
