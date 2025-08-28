import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const { tag } = await req.json().catch(() => ({}));
  const sb = createClient(); const { data: u } = await sb.auth.getUser();
  if (!u?.user || !tag) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await sb.from('tag_follows').delete().eq('user_id', u.user.id).eq('tag', tag.toLowerCase());
  return NextResponse.json({ ok: true });
}
