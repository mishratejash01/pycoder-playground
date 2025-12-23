import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationStatus {
  isRegistered: boolean;
  registration: {
    id: string;
    team_name: string | null;
    team_role: string;
    participation_type: string;
    payment_status: string;
    status: string;
  } | null;
  loading: boolean;
}

export function useEventRegistration(eventId: string | undefined): RegistrationStatus {
  const [status, setStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    registration: null,
    loading: true,
  });

  useEffect(() => {
    async function checkRegistration() {
      if (!eventId) {
        setStatus({ isRegistered: false, registration: null, loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setStatus({ isRegistered: false, registration: null, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, team_name, team_role, participation_type, payment_status, status')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error || !data) {
        setStatus({ isRegistered: false, registration: null, loading: false });
        return;
      }

      setStatus({
        isRegistered: true,
        registration: data as any,
        loading: false,
      });
    }

    checkRegistration();
  }, [eventId]);

  return status;
}

export function useCheckPendingInvitations() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('team_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('invitee_email', session.user.email.toLowerCase())
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingCount(count);
      }
      setLoading(false);
    }

    check();
  }, []);

  return { pendingCount, loading };
}