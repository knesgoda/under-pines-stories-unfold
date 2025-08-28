import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ count: 0 });
  const { data, error } = await sb.rpc('dm_unread_count', { p_me: u.user.id });
  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: data ?? 0 });
}
