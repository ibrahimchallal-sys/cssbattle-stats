import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const QuizScoreTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runQuizScoreTest = async () => {
    if (!user) {
      setTestResults("Error: No user authenticated");
      return;
    }

    setLoading(true);
    let results = `=== Quiz Score Test ===\n`;
    results += `User ID: ${user.id}\n`;
    results += `User Email: ${user.email}\n\n`;

    try {
      // Test 1: Check if quiz_scores table exists and is accessible
      results += "1. Testing quiz_scores table access...\n";
      const { data: tableData, error: tableError } = await supabase
        .from("quiz_scores")
        .select("id")
        .limit(1);

      if (tableError) {
        results += `   Error: ${tableError.message}\n`;
      } else {
        results += `   Success: quiz_scores table is accessible\n`;
      }

      // Test 2: Check if player exists
      results += "\n2. Checking if player exists...\n";
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single();

      if (playerError) {
        results += `   Error: ${playerError.message} (Code: ${playerError.code || 'N/A'})\n`;
        
        // Try to create player if not found
        if (playerError.code === "PGRST116") {
          results += "   Attempting to create player record...\n";
          const { error: insertError } = await supabase
            .from("players")
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.full_name || user.email.split('@')[0],
              score: 0,
              group_name: "Default",
              video_completed: false
            });

          if (insertError) {
            results += `   Failed to create player: ${insertError.message}\n`;
          } else {
            results += "   Player record created successfully\n";
          }
        }
      } else {
        results += `   Found player: ${playerData.full_name} (${playerData.email})\n`;
      }

      // Test 3: Try to insert a test quiz score
      results += "\n3. Testing quiz score insertion...\n";
      const testScore = {
        player_id: user.id,
        score: 5,
        total_questions: 6,
        quiz_title: "Test Quiz Score",
        completed_at: new Date().toISOString(),
      };

      const { data: insertData, error: insertError } = await supabase
        .from("quiz_scores")
        .insert(testScore);

      if (insertError) {
        results += `   Error inserting score: ${insertError.message}\n`;
        results += `   Error code: ${insertError.code || 'N/A'}\n`;
        results += `   Error details: ${JSON.stringify(insertError, null, 2)}\n`;
      } else {
        results += "   Success: Quiz score inserted\n";
        
        // Clean up test data
        const { error: deleteError } = await supabase
          .from("quiz_scores")
          .delete()
          .eq("player_id", user.id)
          .eq("quiz_title", "Test Quiz Score");

        if (deleteError) {
          results += `   Warning: Could not clean up test data: ${deleteError.message}\n`;
        } else {
          results += "   Test data cleaned up\n";
        }
      }

      // Test 4: Check existing scores for this player
      results += "\n4. Checking existing scores...\n";
      const { data: existingScores, error: existingError } = await supabase
        .from("quiz_scores")
        .select("*")
        .eq("player_id", user.id);

      if (existingError) {
        results += `   Error fetching scores: ${existingError.message}\n`;
      } else {
        results += `   Found ${existingScores.length} existing scores\n`;
        if (existingScores.length > 0) {
          results += `   Latest score: ${existingScores[0].score}/${existingScores[0].total_questions}\n`;
        }
      }

    } catch (error) {
      results += `Exception: ${(error as Error).message}\n`;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Score Database Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>User ID: {user?.id || "Not authenticated"}</p>
              <p>User Email: {user?.email || "Not authenticated"}</p>
            </div>
            
            <Button onClick={runQuizScoreTest} disabled={loading || !user}>
              {loading ? "Running Tests..." : "Run Quiz Score Tests"}
            </Button>

            {testResults && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                <Textarea
                  value={testResults}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizScoreTest;