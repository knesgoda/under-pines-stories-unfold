import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: embers } = await sb
    .from('embers').select('*')
    .eq('author_id', u.user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const viewers: Record<string, number> = {};
  if (embers?.length) {
    const ids = embers.map(e => e.id);
    const { data: v } = await sb.from('ember_views').select('ember_id').in('ember_id', ids);
    (v || []).forEach(r => { viewers[r.ember_id] = (viewers[r.ember_id] || 0) + 1; });
  }

  return NextResponse.json({ items: embers || [], viewers });
}
