import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TestVideoCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videoCompleted, setVideoCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoCompletionStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("players")
          .select("video_completed")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setVideoCompleted(data?.video_completed || false);
      } catch (error) {
        console.error("Error fetching video completion status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch video completion status.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideoCompletionStatus();
  }, [user]);

  const updateVideoCompletion = async (completed: boolean) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("players")
        .update({
          video_completed: completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setVideoCompleted(completed);
      toast({
        title: "Success",
        description: `Video completion status updated to ${
          completed ? "completed" : "not completed"
        }.`,
      });
    } catch (error) {
      console.error("Error updating video completion status:", error);
      toast({
        title: "Error",
        description: "Failed to update video completion status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Video Completion Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Current Status</h3>
              <p className="text-muted-foreground">
                Video Completed:{" "}
                {videoCompleted === null
                  ? "Unknown"
                  : videoCompleted
                  ? "Yes"
                  : "No"}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => updateVideoCompletion(true)}
                disabled={!user}
              >
                Mark as Completed
              </Button>
              <Button
                onClick={() => updateVideoCompletion(false)}
                variant="outline"
                disabled={!user}
              >
                Mark as Not Completed
              </Button>
            </div>

            {!user && (
              <p className="text-destructive">
                You must be logged in to test video completion functionality.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestVideoCompletion;
