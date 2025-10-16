-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  cssbattle_profile_link TEXT,
  "group" TEXT CHECK ("group" IN (
    'DD101', 'DD102', 'DD103', 'DD104', 'DD105', 'DD106', 'DD107',
    'DEVOWS201', 'DEVOWS202', 'DEVOWS203', 'DEVOWS204',
    'ID101', 'ID102', 'ID103', 'ID104',
    'IDOSR201', 'IDOSR202', 'IDOSR203', 'IDOSR204'
  )),
  score DOUBLE PRECISION DEFAULT 0 NOT NULL,
  last_score_update TIMESTAMP WITH TIME ZONE,
  profile_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_players_score ON public.players(score DESC);
CREATE INDEX contact_messages_recipient_email_idx ON public.contact_messages(recipient_email);
CREATE INDEX contact_messages_status_idx ON public.contact_messages(status);
CREATE INDEX contact_messages_created_at_idx ON public.contact_messages(created_at DESC);

-- Create trigger function for players updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for contact_messages updated_at
CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_messages_updated_at_column();

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role::public.app_role
  )
$$;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN has_role(auth.uid(), 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_player()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN has_role(auth.uid(), 'player');
END;
$$;

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Players RLS policies
CREATE POLICY "Players are viewable by everyone"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Players can insert their own data"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Players and admins can update data"
  ON public.players FOR UPDATE
  USING (auth.uid()::text = id::text OR is_admin());

CREATE POLICY "Players and admins can delete data"
  ON public.players FOR DELETE
  USING (auth.uid()::text = id::text OR is_admin());

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (is_admin());

-- Contact messages RLS policies
CREATE POLICY "Users can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read all contact messages"
  ON public.contact_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can read messages sent to them"
  ON public.contact_messages FOR SELECT
  USING (recipient_email = (SELECT email FROM public.players WHERE id::text = auth.uid()::text));

CREATE POLICY "Users can update messages sent to them"
  ON public.contact_messages FOR UPDATE
  USING (recipient_email = (SELECT email FROM public.players WHERE id::text = auth.uid()::text));