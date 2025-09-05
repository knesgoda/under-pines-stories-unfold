'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUnreadNotificationCount } from '@/lib/notifications';

export function useUnread() {
  const [notifCount, setNotifCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get unread notifications count using service
      const unreadNotifs = await getUnreadNotificationCount();
      setNotifCount(unreadNotifs);

      // DMs count is disabled for now due to schema issues
      setDmCount(0);
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    notifCount,
    dmCount,
  };
}
