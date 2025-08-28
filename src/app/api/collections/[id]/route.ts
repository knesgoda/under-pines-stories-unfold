// app/api/collections/[id]/route.ts
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

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // list posts in collection with basic pagination (cursor optional later)
  const { data, error } = await sb
    .from('collection_posts')
    .select('post_id, created_at, collections!inner(id, owner_id, is_private)')
    .eq('collection_id', ctx.params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const { name, isPrivate } = await req.json().catch(() => ({}));
  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const updates: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof isPrivate === 'boolean') updates.is_private = isPrivate;

  if (!Object.keys(updates).length) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { error } = await sb.from('collections').update(updates).eq('id', ctx.params.id);
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

