import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const { toUserId, itemSlug, qty } = await req.json().catch(()=>({}));
  if(!toUserId || !itemSlug || !qty) return NextResponse.json({ error:'bad_request' },{status:400});
  const sb = createClient(); const { data:u } = await sb.auth.getUser();
  if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  const { data, error } = await sb.rpc('game_gift', { p_from: u.user.id, p_to: toUserId, p_item: itemSlug, p_qty: qty });
  if (error || data !== true) return NextResponse.json({ error:'gift_failed' },{status:400});
  return NextResponse.json({ ok: true });
}
