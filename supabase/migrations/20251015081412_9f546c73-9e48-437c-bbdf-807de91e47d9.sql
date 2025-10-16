-- Add missing columns to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS score double precision NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_score_update timestamp with time zone,
ADD COLUMN IF NOT EXISTS profile_name text;

-- Create user_roles table for proper admin access control (app_role enum already exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Players can update their own data" ON public.players;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.players;
DROP POLICY IF EXISTS "Players and admins can update data" ON public.players;
DROP POLICY IF EXISTS "Players and admins can delete data" ON public.players;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- New policy: Players can update their own data OR admins can update any
CREATE POLICY "Players and admins can update data"
ON public.players
FOR UPDATE
USING (
  auth.uid() = id OR 
  public.has_role(auth.uid(), 'admin')
);

-- New policy: Players can delete their own data OR admins can delete any
CREATE POLICY "Players and admins can delete data"
ON public.players
FOR DELETE
USING (
  auth.uid() = id OR 
  public.has_role(auth.uid(), 'admin')
);