-- =============================================
-- ENTERPRISE EVENT MANAGEMENT SYSTEM MIGRATION
-- =============================================

-- Step 1: Update events table with new columns for backend control
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'normal' CHECK (event_type IN ('hackathon', 'normal')),
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS allow_solo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tracks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rules_document_url TEXT;

-- Step 2: Update event_registrations table with new columns
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS team_role TEXT DEFAULT 'Leader',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'exempt', 'refunded')),
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invited_by_registration_id UUID;

-- Step 3: Create team_invitations table for managing team invites
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_name TEXT NOT NULL,
  inviter_user_id UUID,
  inviter_name TEXT NOT NULL,
  inviter_email TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_mobile TEXT,
  invitee_name TEXT,
  role TEXT DEFAULT 'Member',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  UNIQUE(registration_id, invitee_email)
);

-- Step 4: Create event_payments table for tracking payments
CREATE TABLE IF NOT EXISTS public.event_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  user_email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  payment_gateway TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Step 5: Enable RLS on new tables
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for team_invitations

-- Anyone can view invitations sent to their email
CREATE POLICY "Users can view invitations for their email"
ON public.team_invitations
FOR SELECT
USING (
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR inviter_user_id = auth.uid()
);

-- Logged in users can create invitations
CREATE POLICY "Authenticated users can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND inviter_user_id = auth.uid());

-- Users can update invitations sent to their email (accept/decline)
CREATE POLICY "Invitees can update invitation status"
ON public.team_invitations
FOR UPDATE
USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Inviters can delete their pending invitations
CREATE POLICY "Inviters can delete pending invitations"
ON public.team_invitations
FOR DELETE
USING (inviter_user_id = auth.uid() AND status = 'pending');

-- Step 7: RLS Policies for event_payments

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON public.event_payments
FOR SELECT
USING (user_id = auth.uid() OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can create their own payment records
CREATE POLICY "Users can create own payments"
ON public.event_payments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_email ON public.team_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_event_id ON public.team_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_event_payments_user_id ON public.event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_registration_id ON public.event_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);

-- Step 9: Function to generate unique invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Step 10: Function to check if user is already registered for an event
CREATE OR REPLACE FUNCTION public.check_user_registration(p_event_id UUID, p_user_id UUID)
RETURNS TABLE(
  is_registered BOOLEAN,
  registration_id UUID,
  team_name TEXT,
  team_role TEXT,
  participation_type TEXT,
  payment_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as is_registered,
    er.id as registration_id,
    er.team_name,
    er.team_role,
    er.participation_type,
    er.payment_status
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id 
    AND er.user_id = p_user_id
  LIMIT 1;
$$;