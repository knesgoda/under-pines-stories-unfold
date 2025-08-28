import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const before = sp.get('before') || new Date().toISOString();
  const limit = Math.min(parseInt(sp.get('limit') || '100', 10), 200);
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ items: [] });

  const { data, error } = await sb.rpc('embers_for_viewer', {
    p_viewer: u.user.id, p_before: before, p_limit: limit
  });
  if (error) return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
