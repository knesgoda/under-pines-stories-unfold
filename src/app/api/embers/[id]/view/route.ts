import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // ignore failure silently to keep the UI snappy
  await sb.from('ember_views').upsert({ ember_id: params.id, viewer_id: u.user.id });
  return NextResponse.json({ ok: true });
}
