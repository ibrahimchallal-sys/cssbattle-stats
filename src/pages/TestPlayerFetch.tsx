import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestPlayerFetch = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    if (!user) {
      setTestResults([{ test: "User Authentication", status: "Failed", message: "No user authenticated" }]);
      return;
    }

    setLoading(true);
    const results = [];

    try {
      // Test 1: Check if user exists in players table
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single();

      results.push({
        test: "Player Verification",
        status: playerError ? "Failed" : "Passed",
        message: playerError 
          ? `Error: ${playerError.message} (Code: ${playerError.code || 'N/A'})` 
          : `Found player: ${playerData?.full_name} (${playerData?.email})`
      });
      
      // Test 1b: If player not found, check by email
      if (playerError && playerError.code === "PGRST116") {
        const { data: emailPlayerData, error: emailPlayerError } = await supabase
          .from("players")
          .select("id, full_name, email")
          .eq("email", user.email)
          .single();
          
        results.push({
          test: "Player Verification (by email)",
          status: emailPlayerError ? "Failed" : "Passed",
          message: emailPlayerError 
            ? `Error: ${emailPlayerError.message} (Code: ${emailPlayerError.code || 'N/A'})` 
            : `Found player by email: ${emailPlayerData?.full_name} (${emailPlayerData?.email})`
        });
      }

      // Test 2: Check if we can read quiz scores
      const { data: quizData, error: quizError } = await supabase
        .from("quiz_scores")
        .select("score")
        .eq("player_id", user.id)
        .limit(1);

      results.push({
        test: "Quiz Scores Read Access",
        status: quizError ? "Failed" : "Passed",
        message: quizError 
          ? `Error: ${quizError.message}` 
          : `Found ${quizData?.length || 0} existing scores`
      });

      // Test 3: Try to insert a test score (will fail if already exists)
      const { data: insertData, error: insertError } = await supabase
        .from("quiz_scores")
        .insert({
          player_id: user.id,
          score: 0,
          total_questions: 6,
          quiz_title: "Test Quiz",
          completed_at: new Date().toISOString(),
        });

      results.push({
        test: "Quiz Score Insert Test",
        status: insertError ? "Failed" : "Passed",
        message: insertError 
          ? `Error: ${insertError.message}` 
          : "Successfully inserted test score"
      });

      // Clean up test data if inserted
      if (!insertError) {
        await supabase
          .from("quiz_scores")
          .delete()
          .eq("player_id", user.id)
          .eq("quiz_title", "Test Quiz");
      }

    } catch (error) {
      results.push({
        test: "General Test",
        status: "Failed",
        message: `Exception: ${(error as Error).message}`
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Player Data Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>User ID: {user?.id || "Not authenticated"}</p>
              <p>User Email: {user?.email || "Not authenticated"}</p>
            </div>
            
            <Button onClick={runTests} disabled={loading || !user}>
              {loading ? "Running Tests..." : "Run Database Tests"}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded ${
                      result.status === "Passed" 
                        ? "bg-green-100 border border-green-300" 
                        : "bg-red-100 border border-red-300"
                    }`}
                  >
                    <h4 className="font-medium">{result.test}: {result.status}</h4>
                    <p className="text-sm">{result.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPlayerFetch;