-- Fix contact_messages RLS policy to allow admins to view only messages addressed to them
-- The previous policy required emails to be in an 'admins' table which doesn't exist

DROP POLICY IF EXISTS "Admins can view all messages sent to admins" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view messages addressed to them" ON contact_messages;

-- Create function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Updated policy: Admins can view only messages addressed to their email
CREATE POLICY "Admins can view messages addressed to them"
ON contact_messages
FOR SELECT
TO authenticated
USING (
  is_admin() AND 
  recipient_email = public.get_current_user_email()
);

-- Add index for better performance on recipient_email
CREATE INDEX IF NOT EXISTS idx_contact_messages_recipient_email ON contact_messages(recipient_email);