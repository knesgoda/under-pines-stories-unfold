import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(){
  const sb = createClient(); const { data:u } = await sb.auth.getUser();
  if(!u?.user) return NextResponse.json({ error:'unauthorized' }, { status: 401 });
  const { data, error } = await sb.rpc('game_claim_daily', { p_user: u.user.id });
  if (error) return NextResponse.json({ error:'already_or_failed' }, { status: 400 });
  return NextResponse.json({ awarded: data || [] });
}
