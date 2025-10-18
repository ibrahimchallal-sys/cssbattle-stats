import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Mail,
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  User,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { usePlayerMessages } from "@/hooks/usePlayerMessages";

interface ContactMessage {
  id: string;
  sender_id: string | null;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
}

interface AdminContact {
  name: string;
  email: string;
}

interface PlayerMessagesPanelProps {
  playerEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const PlayerMessagesPanel = ({
  playerEmail,
  isOpen,
  onClose,
}: PlayerMessagesPanelProps) => {
  const { toast } = useToast();
  console.log("PlayerMessagesPanel rendered with props:", {
    playerEmail,
    isOpen,
  });

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [admins, setAdmins] = useState<AdminContact[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminContact | null>(null);
  const [adminMessages, setAdminMessages] = useState<ContactMessage[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle keyboard visibility on mobile - improved version
  useEffect(() => {
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        // Check if keyboard is likely open by comparing viewport height
        const isKeyboardOpen =
          window.innerHeight - window.visualViewport.height > 100;
        setIsInputFocused(isKeyboardOpen);
      }
    };

    // Use visualViewport API for better mobile keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange
      );
      return () => {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange
        );
      };
    } else {
      // Fallback to focus/blur events
      const handleFocusIn = () => setIsInputFocused(true);
      const handleFocusOut = () => setIsInputFocused(false);

      const inputs = document.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        input.addEventListener("focusin", handleFocusIn);
        input.addEventListener("focusout", handleFocusOut);
      });

      return () => {
        inputs.forEach((input) => {
          input.removeEventListener("focusin", handleFocusIn);
          input.removeEventListener("focusout", handleFocusOut);
        });
      };
    }
  }, []);

  useEffect(() => {
    console.log("PlayerMessagesPanel useEffect triggered", {
      isOpen,
      playerEmail,
    });
    if (isOpen) {
      fetchAdmins();
      // Fetch initial unread message count
      fetchMessages();
    } else {
      // Reset state when panel closes
      setAdmins([]);
      setSelectedAdmin(null);
      setAdminMessages([]);
      setNewMessage("");
    }
  }, [isOpen, playerEmail]);

  useEffect(() => {
    if (selectedAdmin) {
      fetchMessagesWithAdmin(selectedAdmin);
    }
  }, [selectedAdmin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log("Using hardcoded admin contacts...");

      // Use hardcoded admin emails from AdminLogin.tsx
      const hardcodedAdmins = [
        { name: "Ibrahim Challal", email: "ibrahimchallal@admincss.com" },
        { name: "Youness Hlibi", email: "younesshlibi@admincss.com" },
        { name: "Hamdi Boumlik", email: "hamdiboumlik@admincss.com" },
        {
          name: "Mazgour Abdalmonim",
          email: "mazgouraabdalmonim@admincss.com",
        },
      ];

      setAdmins(hardcodedAdmins);
      console.log("Using hardcoded admins:", hardcodedAdmins);
    } catch (error) {
      console.error("Failed to set hardcoded admins:", error);
      toast({
        title: "Error",
        description: "Failed to load admin contacts",
        variant: "destructive",
      });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesWithAdmin = async (admin: AdminContact) => {
    if (!playerEmail) return;

    try {
      setLoading(true);
      // Fetch all messages between player and this specific admin
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .or(
          `and(sender_email.eq.${playerEmail},recipient_email.eq.${admin.email}),` +
            `and(sender_email.eq.${admin.email},recipient_email.eq.${playerEmail})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Type cast the data to ensure status is correct type
      const typedData = (data || []).map((msg) => ({
        ...msg,
        status: msg.status as "unread" | "read" | "replied",
      }));

      setAdminMessages(typedData);

      // Mark messages as read (only the ones sent TO the player)
      const unreadMessages = typedData.filter(
        (msg) => msg.status === "unread" && msg.recipient_email === playerEmail
      );

      console.log("Found unread messages with admin:", unreadMessages.length);

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (msg) => {
            const { error: updateError } = await supabase
              .from("contact_messages")
              .update({ status: "read", updated_at: new Date().toISOString() })
              .eq("id", msg.id);

            if (updateError) {
              console.error("Failed to mark message as read:", updateError);
            }
          })
        );

        // Dispatch a custom event to notify that unread messages have been read
        console.log("Dispatching playerMessagesRead event");
        window.dispatchEvent(new CustomEvent("playerMessagesRead"));
      }
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

  const fetchMessages = async () => {
    if (!playerEmail) return;

    try {
      // Fetch all messages where the player is either sender or recipient
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .or(`sender_email.eq.${playerEmail},recipient_email.eq.${playerEmail}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Type cast the data to ensure status is correct type
      const typedData = (data || []).map((msg) => ({
        ...msg,
        status: msg.status as "unread" | "read" | "replied",
      }));

      setMessages(typedData);
      setLoading(false);

      // Mark messages as read (only the ones sent TO the player)
      const unreadMessages = typedData.filter(
        (msg) => msg.status === "unread" && msg.recipient_email === playerEmail
      );

      console.log("Found unread messages for player:", unreadMessages.length);

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (msg) => {
            const { error: updateError } = await supabase
              .from("contact_messages")
              .update({ status: "read", updated_at: new Date().toISOString() })
              .eq("id", msg.id);

            if (updateError) {
              console.error("Failed to mark message as read:", updateError);
            }
          })
        );

        // Dispatch a custom event to notify that unread messages have been read
        console.log("Dispatching playerMessagesRead event");
        window.dispatchEvent(new CustomEvent("playerMessagesRead"));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSelectAdmin = (admin: AdminContact) => {
    // Reset messages when selecting a new admin
    setAdminMessages([]);
    // Small delay to ensure UI updates
    setTimeout(() => {
      setSelectedAdmin(admin);
    }, 50);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !playerEmail || !selectedAdmin) {
      toast({
        title: "Error",
        description: "Please select an admin and enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("contact_messages").insert({
        sender_email: playerEmail,
        sender_name: "Player",
        recipient_email: selectedAdmin.email,
        subject: "Message from Player",
        message: newMessage,
        status: "unread",
      });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });

      // Refresh messages
      fetchMessagesWithAdmin(selectedAdmin);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/0 transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide-in panel - responsive for mobile */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-auto">
        <div className="relative w-screen max-w-4xl h-full">
          <div className="flex h-full bg-background border-l border-battle-purple/20 shadow-xl flex-col md:flex-row">
            {/* Sidebar for admins list - hidden on mobile when chat is open */}
            <div
              className={`border-r border-battle-purple/20 flex flex-col md:w-1/3 ${
                selectedAdmin && isMobile ? "hidden" : "flex"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-battle-purple/20">
                <h2 className="text-lg font-semibold text-foreground">
                  Contact Admins
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchAdmins}
                    className="text-foreground hover:bg-battle-purple/10"
                    title="Refresh admin list"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-foreground hover:bg-battle-purple/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Admins list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <div className="animate-pulse text-foreground mb-4">
                      Loading admins...
                    </div>
                  </div>
                ) : admins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <User className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No admins available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-battle-purple/10">
                    {admins.map((admin) => (
                      <div
                        key={admin.email}
                        className={`p-4 cursor-pointer hover:bg-battle-purple/5 transition-colors ${
                          selectedAdmin?.email === admin.email
                            ? "bg-battle-purple/10"
                            : ""
                        }`}
                        onClick={() => handleSelectAdmin(admin)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {admin.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat area - full width on mobile when chat is open */}
            <div
              className={`flex flex-col ${
                selectedAdmin && isMobile ? "w-full" : "md:w-2/3"
              } ${!selectedAdmin && isMobile ? "hidden md:flex" : "flex"}`}
            >
              {selectedAdmin ? (
                <>
                  {/* Chat header - with back button on mobile */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-battle-purple/20">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedAdmin(null)}
                          className="text-foreground hover:bg-battle-purple/10 md:hidden"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5"
                          >
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </Button>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {selectedAdmin.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {selectedAdmin.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-foreground">
                          Loading messages...
                        </div>
                      </div>
                    ) : adminMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No messages yet
                        </h3>
                        <p className="text-muted-foreground max-w-xs">
                          Send a message to {selectedAdmin.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {adminMessages.map((message) => (
                          <div
                            key={`${message.id}-${message.created_at}`}
                            className={`flex ${
                              message.sender_email === playerEmail
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_email === playerEmail
                                  ? "bg-battle-purple text-white rounded-br-none"
                                  : "bg-muted text-foreground rounded-bl-none"
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <div
                                className={`text-xs mt-1 flex items-center ${
                                  message.sender_email === playerEmail
                                    ? "text-battle-purple-foreground/80 justify-end"
                                    : "text-muted-foreground justify-start"
                                }`}
                              >
                                {message.sender_email === playerEmail ? (
                                  message.status === "replied" ? (
                                    <CheckCheck className="w-3 h-33 mr-1 text-blue-500" />
                                  ) : message.status === "read" ? (
                                    <CheckCheck className="w-3 h-33 mr-1 text-blue-500" />
                                  ) : (
                                    <Check className="w-3 h-3 mr-1 text-blue-500" />
                                  )
                                ) : null}
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message input - fixed at bottom with mobile keyboard support */}
                  <div
                    className={`border-t border-battle-purple/20 p-4 transition-all duration-300 ${
                      isMobile && isInputFocused
                        ? "fixed bottom-0 left-0 right-0 bg-background z-50"
                        : ""
                    }`}
                    style={{
                      // Adjust positioning based on the chat panel's position
                      left: isMobile && isInputFocused ? "auto" : "",
                      right: isMobile && isInputFocused ? "0" : "",
                      width:
                        isMobile && isInputFocused ? "calc(100% - 2rem)" : "",
                      marginLeft: isMobile && isInputFocused ? "1rem" : "",
                      marginRight: isMobile && isInputFocused ? "1rem" : "",
                    }}
                  >
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-background/50 border-primary/30"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-primary hover:scale-105 transition-transform"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select an Admin
                  </h3>
                  <p className="text-muted-foreground max-w-xs">
                    Choose an admin from the contacts list to start chatting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMessagesPanel;
