-- ============================================
-- COMPREHENSIVE FIX: RLS, Admin Role Auto-Sync, and Storage Policies
-- ============================================

-- 1. Re-enable RLS on all tables and recreate policies cleanly
-- ============================================

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Players can view their own data" ON players;
DROP POLICY IF EXISTS "Players can update their own data" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;
DROP POLICY IF EXISTS "Admins can insert players" ON players;
DROP POLICY IF EXISTS "Admins can update all players" ON players;
DROP POLICY IF EXISTS "Admins can delete players" ON players;

-- Ensure RLS is enabled on players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Recreate players policies
CREATE POLICY "Players can view their own data"
ON players FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());

CREATE POLICY "Players can update their own data"
ON players FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all players"
ON players FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert players"
ON players FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update all players"
ON players FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete players"
ON players FOR DELETE
TO authenticated
USING (is_admin());

-- quiz_scores policies
DROP POLICY IF EXISTS "Players can view their own quiz scores" ON quiz_scores;
DROP POLICY IF EXISTS "Players can insert their own quiz scores" ON quiz_scores;
DROP POLICY IF EXISTS "Admins can view all quiz scores" ON quiz_scores;
DROP POLICY IF EXISTS "Admins can delete quiz scores" ON quiz_scores;

ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own quiz scores"
ON quiz_scores FOR SELECT
TO authenticated
USING (auth.uid() = player_id OR is_admin());

CREATE POLICY "Players can insert their own quiz scores"
ON quiz_scores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Admins can view all quiz scores"
ON quiz_scores FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete quiz scores"
ON quiz_scores FOR DELETE
TO authenticated
USING (is_admin());

-- contact_messages policies
DROP POLICY IF EXISTS "Players can insert messages" ON contact_messages;
DROP POLICY IF EXISTS "Players can view their sent messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update message status" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view all messages sent to admins" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view messages addressed to them" ON contact_messages;

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Players can view their sent messages"
ON contact_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can update message status"
ON contact_messages FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all messages sent to admins"
ON contact_messages FOR SELECT
TO authenticated
USING (is_admin() AND recipient_email IN (SELECT email FROM admins));

-- learning_resources policies
DROP POLICY IF EXISTS "Resources readable by everyone" ON learning_resources;
DROP POLICY IF EXISTS "Admins can create resources" ON learning_resources;
DROP POLICY IF EXISTS "Admins can update resources" ON learning_resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON learning_resources;

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources readable by everyone"
ON learning_resources FOR SELECT
USING (true);

CREATE POLICY "Admins can create resources"
ON learning_resources FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update resources"
ON learning_resources FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete resources"
ON learning_resources FOR DELETE
TO authenticated
USING (is_admin());

-- admins table policies
DROP POLICY IF EXISTS "Admins can view admin data" ON admins;

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin data"
ON admins FOR SELECT
TO authenticated
USING (is_admin() OR (email = (SELECT admins_1.email FROM admins admins_1 WHERE admins_1.id = auth.uid())));

-- user_roles policies
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Auto-sync admin role from admin emails
-- ============================================

-- Function to grant admin role when a player matches an admin email
CREATE OR REPLACE FUNCTION public.grant_admin_role_for_player()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this player's email exists in admins table
  IF EXISTS (SELECT 1 FROM public.admins WHERE email = NEW.email) THEN
    -- Insert admin role for this player (ON CONFLICT DO NOTHING)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on players table to auto-assign admin role
DROP TRIGGER IF EXISTS auto_grant_admin_role_for_player ON players;
CREATE TRIGGER auto_grant_admin_role_for_player
AFTER INSERT OR UPDATE OF email ON players
FOR EACH ROW
EXECUTE FUNCTION public.grant_admin_role_for_player();

-- Function to grant admin role when an admin is added/updated
CREATE OR REPLACE FUNCTION public.grant_admin_role_for_admins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find all players with this admin email and grant them admin role
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, 'admin'::public.app_role
  FROM public.players p
  WHERE p.email = NEW.email
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger on admins table
DROP TRIGGER IF EXISTS auto_grant_admin_role_for_admins ON admins;
CREATE TRIGGER auto_grant_admin_role_for_admins
AFTER INSERT OR UPDATE OF email ON admins
FOR EACH ROW
EXECUTE FUNCTION public.grant_admin_role_for_admins();

-- Backfill existing admin roles
CREATE OR REPLACE FUNCTION public.backfill_admin_roles_from_admins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant admin role to all players whose email matches an admin email
  INSERT INTO public.user_roles (user_id, role)
  SELECT DISTINCT p.id, 'admin'::public.app_role
  FROM public.players p
  INNER JOIN public.admins a ON p.email = a.email
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Execute backfill
SELECT public.backfill_admin_roles_from_admins();

-- 3. Clean up storage policies for learning bucket
-- ============================================

-- Drop all existing policies on storage.objects for learning bucket
DROP POLICY IF EXISTS "Learning resources are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload learning resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update learning resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete learning resources" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 13sik6r_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 13sik6r_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 13sik6r_2" ON storage.objects;

-- Create clean storage policies for learning bucket
CREATE POLICY "Learning resources are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'learning');

CREATE POLICY "Admins can upload learning resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'learning' AND is_admin());

CREATE POLICY "Admins can update learning resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'learning' AND is_admin());

CREATE POLICY "Admins can delete learning resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'learning' AND is_admin());