import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, MailOpen, Calendar, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface ContactMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
}

interface Player {
  id: string;
  full_name: string;
  email: string;
  group_name: string | null;
  score: number;
  cssbattle_profile_link: string | null;
  phone: string | null;
}

const AdminMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isAdmin, loading: adminLoading } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (adminLoading) return; // wait for admin context to init
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchMessages();
  }, [isAdmin, adminLoading, navigate]);

  const fetchMessages = async () => {
    try {
      // Fetch all messages sent to any admin
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages((data as ContactMessage[]) || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "read", updated_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message marked as read",
      });

      fetchMessages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const handleViewPlayerDetails = (playerId: string) => {
    // Navigate to player profile page
    navigate(`/admin/player/${playerId}`);
  };

  const filteredMessages = messages.filter(
    (msg) => statusFilter === "all" || msg.status === statusFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="border-primary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-foreground">My Messages</h1>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-background border-primary/30">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredMessages.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No messages found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card
                key={message.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {message.status === "unread" ? (
                      <Mail className="w-5 h-5 text-primary" />
                    ) : (
                      <MailOpen className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {message.subject}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{message.sender_name}</span>
                        <span>({message.sender_email})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        message.status === "unread" ? "default" : "secondary"
                      }
                    >
                      {message.status}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg mb-4">
                  <p className="text-foreground whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>

                <div className="flex gap-2">
                  {message.status === "unread" && (
                    <Button
                      onClick={() => handleMarkAsRead(message.id)}
                      variant="outline"
                      size="sm"
                      className="border-primary/50"
                    >
                      <MailOpen className="w-4 h-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    onClick={() => handleViewPlayerDetails(message.sender_id)}
                    variant="outline"
                    size="sm"
                    className="border-battle-purple/50 hover:bg-battle-purple/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Player Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
