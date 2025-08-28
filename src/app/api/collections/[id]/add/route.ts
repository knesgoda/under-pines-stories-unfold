// app/api/collections/[id]/add/route.ts
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

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const { postId } = await req.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await sb.from('collection_posts').insert({ collection_id: ctx.params.id, post_id: postId });
  if (error) return NextResponse.json({ error: 'add_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

