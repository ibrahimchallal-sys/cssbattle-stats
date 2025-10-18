import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function TestMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);
      console.log("Fetching all messages...");
      
      // Try to fetch all messages without any filters
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        return;
      }

      console.log("Messages fetched:", data);
      setMessages((data as ContactMessage[]) || []);
    } catch (err) {
      console.error("General error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = async () => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all by using a condition that matches all

      if (error) throw error;
      
      setMessages([]);
    } catch (err) {
      console.error("Error clearing messages:", err);
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Test Messages</h1>
          <div className="flex gap-2">
            <Button onClick={fetchAllMessages} variant="outline">
              Refresh
            </Button>
            <Button onClick={clearMessages} variant="destructive">
              Clear All
            </Button>
          </div>
        </div>

        {error && (
          <Card className="p-6 mb-6 bg-red-500/20 border border-red-500/50">
            <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
            <p className="text-foreground">{error}</p>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Debug Info</h2>
          <p className="text-foreground">Total messages: {messages.length}</p>
        </Card>

        {messages.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">No messages found in database</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {message.subject}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      From: {message.sender_name} ({message.sender_email})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To: {message.recipient_email}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
                <div className="mt-4 text-sm">
                  <span className="font-medium">Status:</span> {message.status}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}