import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/nav/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  let meUsername: string | undefined;
  if (u?.user) {
    const { data: p } = await sb.from('profiles').select('username').eq('id', u.user.id).maybeSingle();
    meUsername = p?.username || undefined;
  }
  return <AppShell meUsername={meUsername}>{children}</AppShell>;
}
