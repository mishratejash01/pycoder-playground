-- Create event_admins table
CREATE TABLE public.event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.event_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own admin assignments
CREATE POLICY "Users can view own admin assignments"
  ON public.event_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check if user is event admin
CREATE OR REPLACE FUNCTION public.is_event_admin(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_admins
    WHERE user_id = _user_id AND event_id = _event_id
  )
$$;

-- Function to get all authorized events for a user
CREATE OR REPLACE FUNCTION public.get_admin_events(_user_id UUID)
RETURNS TABLE(event_id UUID, event_title TEXT, event_slug TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ea.event_id, e.title, e.slug
  FROM public.event_admins ea
  JOIN public.events e ON e.id = ea.event_id
  WHERE ea.user_id = _user_id
$$;