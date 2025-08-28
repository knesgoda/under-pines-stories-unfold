import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await req.json().catch(() => ({}));
  const sb = createClient(); const { data: u } = await sb.auth.getUser();
  if (!u?.user || !userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // must be mod/owner
  const { data: me } = await sb.from('group_members').select('role').eq('group_id', params.id).eq('user_id', u.user.id).maybeSingle();
  if (!me || (me.role !== 'owner' && me.role !== 'mod')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await sb.from('group_members').update({ state: 'active' }).eq('group_id', params.id).eq('user_id', userId).eq('state', 'requested');
  return NextResponse.json({ ok: true });
}
