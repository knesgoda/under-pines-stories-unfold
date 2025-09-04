'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnread() {
  const [notifCount, setNotifCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    async function fetchCounts() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get unread notifications count
      const { count: notifCount, error: notifError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .is('read_at', null);

      if (!notifError) {
        setNotifCount(notifCount || 0);
      }

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
