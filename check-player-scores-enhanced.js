#!/usr/bin/env node

/**
 * Enhanced Script to automatically check scores for each player in CSS Battle
 * This script fetches player scores from the CSS Battle API and updates the database
 * Handles monthly score resets while preserving original CSS Battle scores
 *
 * Usage: node check-player-scores-enhanced.js
 */

const fs = require("fs");
const path = require("path");

// Mock function to simulate fetching player scores from CSS Battle API
// In a real implementation, this would make actual HTTP requests to the CSS Battle API
async function fetchPlayerScore(cssBattleUsername) {
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 1000 + 500)
  );

  // Return a random score for demonstration
  // In a real implementation, this would parse the actual response from CSS Battle
  return Math.floor(Math.random() * 1000) + 100;
}

// Function to check if it's time for a monthly reset
function shouldResetScores(lastResetDate) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // If no reset date exists, it's time for a reset
  if (!lastResetDate) {
    return true;
  }

  // Convert lastResetDate to Date object if it's a string
  const lastReset = new Date(lastResetDate);
  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();

  // Reset if we're in a different month or year
  return currentMonth !== lastResetMonth || currentYear !== lastResetYear;
}

// Mock function to simulate getting players from the database
// In a real implementation, this would connect to your Supabase database
async function getPlayersFromDatabase() {
  // Simulate database delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock player data with last_reset_date and base_score
  // In a real implementation, this would query your actual database
  const now = new Date();
  return [
    {
      id: "1",
      full_name: "Ibrahim Challal",
      css_battle_username: "ibrahim_css",
      score: 1500,
      base_score: 1200,
      last_reset_date: now.toISOString().split("T")[0],
    },
    {
      id: "2",
      full_name: "Moneim Mazgoura",
      css_battle_username: "moneim_css",
      score: 1200,
      base_score: 1000,
      last_reset_date: now.toISOString().split("T")[0],
    },
    {
      id: "3",
      full_name: "Hamdi Boumlik",
      css_battle_username: "hamdi_css",
      score: 900,
      base_score: 0,
      last_reset_date: null,
    },
    {
      id: "4",
      full_name: "Youness Hlibi",
      css_battle_username: "youness_css",
      score: 750,
      base_score: 500,
      last_reset_date: now.toISOString().split("T")[0],
    },
    {
      id: "5",
      full_name: "John Doe",
      css_battle_username: "john_doe_css",
      score: 500,
      base_score: 0,
      last_reset_date: null,
    },
  ];
}

// Mock function to simulate updating player scores in the database
// In a real implementation, this would update your Supabase database
async function updatePlayerScoreInDatabase(
  playerId,
  score,
  baseScore,
  resetDate
) {
  // Simulate database update delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log(`Updated player ${playerId}:`);
  console.log(`  Leaderboard Score: ${score}`);
  console.log(`  Base Score: ${baseScore}`);
  console.log(`  Last Reset Date: ${resetDate}`);
  // In a real implementation, this would execute an actual database update
}

async function checkAllPlayerScores() {
  console.log("CSS Battle Championship - Enhanced Player Score Checker");
  console.log("=====================================================\n");

  try {
    console.log("Fetching players from database...");
    const players = await getPlayersFromDatabase();
    console.log(`Found ${players.length} players.\n`);

    console.log("Checking scores for each player...\n");

    // Get current date for reset tracking
    const today = new Date();
    const currentDate = today.toISOString().split("T")[0];

    // Process each player sequentially
    for (const player of players) {
      if (!player.css_battle_username) {
        console.log(
          `⚠️  Skipping ${player.full_name} - No CSS Battle username set`
        );
        continue;
      }

      try {
        console.log(
          `Fetching score for ${player.full_name} (${player.css_battle_username})...`
        );
        const currentCssBattleScore = await fetchPlayerScore(
          player.css_battle_username
        );
        console.log(`  CSS Battle Score: ${currentCssBattleScore}`);

        // Check if we need to reset scores for this player
        const needsReset = shouldResetScores(player.last_reset_date);

        if (needsReset) {
          console.log(`  📅 Monthly reset needed for ${player.full_name}`);

          // Calculate new leaderboard score (current CSS Battle score - base score)
          const newLeaderboardScore = Math.max(
            0,
            currentCssBattleScore - (player.base_score || 0)
          );

          console.log(`  Base Score: ${player.base_score || 0}`);
          console.log(
            `  New Leaderboard Score: ${newLeaderboardScore} (CSS Battle: ${currentCssBattleScore} - Base: ${
              player.base_score || 0
            })`
          );

          // Update database with new scores and reset date
          console.log(
            `  Updating database for ${player.full_name} with reset...`
          );
          await updatePlayerScoreInDatabase(
            player.id,
            newLeaderboardScore,
            currentCssBattleScore,
            currentDate
          );
        } else {
          // No reset needed, calculate current leaderboard score
          const currentLeaderboardScore = Math.max(
            0,
            currentCssBattleScore - (player.base_score || 0)
          );

          console.log(`  Base Score: ${player.base_score || 0}`);
          console.log(
            `  Current Leaderboard Score: ${currentLeaderboardScore} (CSS Battle: ${currentCssBattleScore} - Base: ${
              player.base_score || 0
            })`
          );

          // Update database with current scores
          console.log(`  Updating database for ${player.full_name}...`);
          await updatePlayerScoreInDatabase(
            player.id,
            currentLeaderboardScore,
            player.base_score,
            player.last_reset_date
          );
        }

        console.log(`  ✅ Successfully processed ${player.full_name}\n`);
      } catch (error) {
        console.error(
          `  ❌ Error processing ${player.full_name}:`,
          error.message
        );
      }
    }

    console.log("\n✅ All player scores checked and updated successfully!");
  } catch (error) {
    console.error("❌ Error checking player scores:", error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  checkAllPlayerScores();
}

module.exports = {
  checkAllPlayerScores,
  fetchPlayerScore,
  getPlayersFromDatabase,
  updatePlayerScoreInDatabase,
  shouldResetScores,
};
