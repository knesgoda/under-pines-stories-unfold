import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = createClient(); const { data: u } = await sb.auth.getUser(); if (!u?.user) return NextResponse.json({ error:'unauthorized' }, { status:401 });
  // if public → active, else → requested
  const { data: g } = await sb.from('groups').select('visibility').eq('id', params.id).maybeSingle();
  const state = g?.visibility === 'public' ? 'active' : 'requested';
  await sb.from('group_members').upsert({ group_id: params.id, user_id: u.user.id, state });
  return NextResponse.json({ state });
}
