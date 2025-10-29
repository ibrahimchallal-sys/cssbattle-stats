# Monthly Score Reset System

## Overview

The CSS Battle Championship leaderboard implements a monthly score reset system to ensure fair competition while preserving players' original CSS Battle progress.

## How It Works

### Database Schema Changes

Two new fields have been added to the `players` table:

1. `last_reset_date` (DATE) - Tracks when a player's score was last reset
2. `base_score` (INTEGER) - Stores the CSS Battle score at the time of the last reset

### Reset Logic

1. **Monthly Check**: The system checks if the current month/year differs from the `last_reset_date`
2. **Score Calculation**: 
   - If reset is needed: `leaderboard_score = current_css_battle_score - base_score`
   - If no reset: `leaderboard_score = current_css_battle_score - base_score`
3. **Reset Execution**: 
   - Update `last_reset_date` to current date
   - Update `base_score` to current CSS Battle score
   - Set `score` to 0 (or calculated monthly score)

### Example Workflow

1. **January 15th**: Player has 1200 points on CSS Battle
   - `score` = 1200 (leaderboard score)
   - `base_score` = 0 (initial state)
   - `last_reset_date` = null

2. **February 1st** (Monthly Reset):
   - Current CSS Battle score: 1500
   - System detects month change
   - `score` = 1500 - 1200 = 300 (new monthly score)
   - `base_score` = 1500 (current CSS Battle score)
   - `last_reset_date` = '2024-02-01'

3. **February 15th**:
   - Current CSS Battle score: 1700
   - No reset needed (same month)
   - `score` = 1700 - 1500 = 200 (current monthly score)
   - `base_score` = 1500 (unchanged)
   - `last_reset_date` = '2024-02-01' (unchanged)

## Implementation Files

- **Database Migrations**: 
  - `supabase/migrations/20251024000000_add_last_reset_date_to_players.sql`
  - `supabase/migrations/20251024000001_add_base_score_to_players.sql`

- **Score Checking Script**: `check-player-scores-enhanced.js`

## Benefits

1. **Fair Competition**: Monthly resets ensure all players start from a similar baseline
2. **Progress Preservation**: Original CSS Battle scores are always maintained
3. **Transparency**: Players understand how scores are calculated
4. **Motivation**: Regular resets encourage continuous participation

## Cron Job Setup

To automate monthly resets, set up a cron job to run the enhanced score checking script:

```bash
# Run on the 1st of every month at 2:00 AM
0 2 1 * * cd /path/to/cssbattle-stats && node check-player-scores-enhanced.js
```