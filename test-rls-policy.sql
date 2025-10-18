-- Test script to verify RLS policy for contact_messages
-- Run this as an admin user to see what messages you can access

-- First, check what user you are
SELECT auth.uid() as current_user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- Check if you're an admin
SELECT public.is_admin() as is_current_user_admin;

-- Try to fetch messages with RLS enabled (should only show messages to your email)
SELECT id, sender_name, recipient_email, subject, status
FROM contact_messages
ORDER BY created_at DESC;

-- Try to fetch messages with RLS disabled (shows all messages - for debugging only)
-- This requires admin privileges
SET LOCAL row_security TO OFF;
SELECT id, sender_name, recipient_email, subject, status
FROM contact_messages
ORDER BY created_at DESC;
RESET row_security;