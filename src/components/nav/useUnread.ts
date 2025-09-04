'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUnreadNotificationCount } from '@/lib/notifications';

export function useUnread() {
  const [notifCount, setNotifCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    async function fetchCounts() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get unread notifications count using service
      const unreadNotifs = await getUnreadNotificationCount();
      setNotifCount(unreadNotifs);

      // Get unread DMs count (if dm_messages table exists)
      const { count: dmCount, error: dmError } = await supabase
        .from('dm_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', session.user.id)
        .is('read_at', null);

      if (!dmError) {
        setDmCount(dmCount || 0);
      }
    }

    fetchCounts();
    interval = setInterval(fetchCounts, 30000); // Refresh every 30 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return {
    notifCount,
    dmCount,
  };
}
