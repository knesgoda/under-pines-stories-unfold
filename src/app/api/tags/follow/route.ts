import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { tag } = await req.json().catch(() => ({}));
  if (!tag) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await sb.from('tag_follows').upsert({ user_id: u.user.id, tag: tag.toLowerCase() });
  return NextResponse.json({ ok: true });
}
