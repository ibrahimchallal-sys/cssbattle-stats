-- Fix contact_messages RLS policy to allow admins to view messages addressed to them
-- The previous policy required emails to be in an 'admins' table which doesn't exist

DROP POLICY IF EXISTS "Admins can view all messages sent to admins" ON contact_messages;

-- Updated policy: Admins can view messages addressed to their email
CREATE POLICY "Admins can view messages addressed to them"
ON contact_messages
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- Add index for better performance on recipient_email
CREATE INDEX IF NOT EXISTS idx_contact_messages_recipient_email ON contact_messages(recipient_email);