import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TIME_UPDATE_INTERVAL = 60000; // Update every minute

export function useTimeTracking() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    const updateTimeSpent = async () => {
      if (!isActiveRef.current) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        await supabase.rpc('update_time_spent', { p_minutes: 1 });
      } catch (error) {
        // Silently fail - time tracking is non-critical
        console.debug('Time tracking update failed:', error);
      }
    };

    // Start tracking
    intervalRef.current = setInterval(updateTimeSpent, TIME_UPDATE_INTERVAL);

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isActiveRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial update after 1 minute
    const initialTimeout = setTimeout(updateTimeSpent, TIME_UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
