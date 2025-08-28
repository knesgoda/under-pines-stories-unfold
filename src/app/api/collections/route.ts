// app/api/collections/route.ts
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
  const { name, isPrivate } = await req.json().catch(() => ({}));
  if (!name || typeof name !== 'string' || name.length > 80) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const sb = supabase();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb.from('collections')
    .insert({ owner_id: u.user.id, name: name.trim(), is_private: !!isPrivate })
    .select('id, name, is_private').single();

  if (error) return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  return NextResponse.json({ collection: data });
}

