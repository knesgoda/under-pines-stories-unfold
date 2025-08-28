import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = createClient(); const { data: u } = await sb.auth.getUser(); if (!u?.user) return NextResponse.json({ error:'unauthorized' }, { status:401 });
  await sb.from('group_members').delete().eq('group_id', params.id).eq('user_id', u.user.id);
  return NextResponse.json({ ok:true });
}
