-- Add score and last_score_update columns to players table
ALTER TABLE public.players
ADD COLUMN score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_score_update TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when ordering by score
CREATE INDEX idx_players_score ON public.players(score DESC);