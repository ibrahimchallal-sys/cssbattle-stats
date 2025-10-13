-- Add group column to players table
ALTER TABLE players 
ADD COLUMN "group" TEXT;

-- Add a check constraint to ensure group is one of the valid options
ALTER TABLE players 
ADD CONSTRAINT players_group_check 
CHECK ("group" IN ('DD101', 'DD102', 'DD103', 'DD104', 'DD105', 'DD106', 'DD107', 'DEVOWS201', 'DEVOWS202', 'DEVOWS203', 'DEVOWS204', 'ID101', 'ID102', 'ID103', 'ID104', 'IDOSR201', 'IDOSR202', 'IDOSR203', 'IDOSR204'));

-- Add comment to the column
COMMENT ON COLUMN players."group" IS 'Player group - DEV groups (DD101-DD107, DEVOWS201-DEVOWS204) or ID groups (ID101-ID104, IDOSR201-IDOSR204)';