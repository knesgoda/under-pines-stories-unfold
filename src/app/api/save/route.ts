// app/api/save/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function supabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookies().get(n)?.value, set() {}, remove() {} } }
  );
}

export async function POST(req: Request) {
  const { postId } = await req.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await sb.from('saved_posts').upsert({ user_id: u.user.id, post_id: postId });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const postId = body?.postId;
  if (!postId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await sb.from('saved_posts').delete().eq('user_id', u.user.id).eq('post_id', postId);
  if (error) return NextResponse.json({ error: 'unsave_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

