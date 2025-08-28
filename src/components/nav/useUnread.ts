'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export function useUnread() {
  const { data: notifs } = useSWR('/api/notifications/unread-count', fetcher, { refreshInterval: 30_000 });
  const { data: dms }     = useSWR('/api/dm/unread-count',           fetcher, { refreshInterval: 30_000 });
  return {
    notifCount: notifs?.count ?? 0,
    dmCount: dms?.count ?? 0,
  };
}
