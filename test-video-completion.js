// Test script to verify video completion functionality
const { createClient } = require("@supabase/supabase-js");

// Supabase configuration - replace with your actual values
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ubjttptjigwbjwqyiwmi.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // You'll need a service key for this

if (!SUPABASE_SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_KEY environment variable is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testVideoCompletion() {
  try {
    console.log("Testing video completion functionality...");

    // Test 1: Check if video_completed column exists
    console.log("\n1. Checking if video_completed column exists...");
    const { data: columnData, error: columnError } = await supabase
      .from("players")
      .select("video_completed")
      .limit(1);

    if (columnError) {
      console.error("Error checking video_completed column:", columnError);
      return;
    }

    console.log("✓ video_completed column exists");

    // Test 2: Get a sample player
    console.log("\n2. Getting a sample player...");
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, email, video_completed")
      .limit(1);

    if (playerError) {
      console.error("Error getting sample player:", playerError);
      return;
    }

    if (!playerData || playerData.length === 0) {
      console.log("No players found in database");
      return;
    }

    const player = playerData[0];
    console.log(`✓ Found player: ${player.email} (ID: ${player.id})`);
    console.log(`  Current video_completed status: ${player.video_completed}`);

    // Test 3: Update video completion status
    console.log("\n3. Updating video completion status...");
    const newStatus = !player.video_completed;
    const { data: updateData, error: updateError } = await supabase
      .from("players")
      .update({
        video_completed: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.id);

    if (updateError) {
      console.error("Error updating video completion status:", updateError);
      return;
    }

    console.log(`✓ Successfully updated video_completed to ${newStatus}`);

    // Test 4: Verify the update
    console.log("\n4. Verifying the update...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("players")
      .select("video_completed")
      .eq("id", player.id)
      .single();

    if (verifyError) {
      console.error("Error verifying update:", verifyError);
      return;
    }

    if (verifyData.video_completed === newStatus) {
      console.log(
        `✓ Verification successful. video_completed is now ${verifyData.video_completed}`
      );
    } else {
      console.error(
        `✗ Verification failed. Expected ${newStatus}, got ${verifyData.video_completed}`
      );
    }

    // Test 5: Reset to original status
    console.log("\n5. Resetting to original status...");
    const { error: resetError } = await supabase
      .from("players")
      .update({
        video_completed: player.video_completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.id);

    if (resetError) {
      console.error("Error resetting video completion status:", resetError);
      return;
    }

    console.log("✓ Successfully reset to original status");

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the test
testVideoCompletion();
