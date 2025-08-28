import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const before = sp.get('cursor') || new Date().toISOString();
  const limit = Math.min(parseInt(sp.get('limit') || '20', 10), 50);
  const sb = createClient(); const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb.rpc('feed_with_tags', { p_user: u.user.id, p_before: before, p_limit: limit });
  if (error) return NextResponse.json({ error: 'feed_failed' }, { status: 500 });

  const nextCursor = data?.length ? data[data.length - 1].created_at : null;
  return NextResponse.json({ items: data || [], nextCursor });
}
