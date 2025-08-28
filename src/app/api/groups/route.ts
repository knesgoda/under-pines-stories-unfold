import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { slug, name, description = '', visibility = 'public' } = await req.json().catch(() => ({}));
  if (!slug || !name) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const sb = createClient(); const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: g, error } = await sb.from('groups')
    .insert({ slug: slug.toLowerCase(), name: name.trim(), description, visibility })
    .select('id').single();
  if (error) return NextResponse.json({ error: 'create_failed' }, { status: 500 });

  await sb.from('group_members').insert({ group_id: g.id, user_id: u.user.id, role: 'owner', state: 'active' });
  return NextResponse.json({ groupId: g.id });
}
