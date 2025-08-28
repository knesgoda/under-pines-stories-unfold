import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const { action, targetType, targetId } = await req.json().catch(()=>({}));
  if(!action) return NextResponse.json({ error:'bad_request' },{ status:400 });
  const sb = createClient(); const { data:u } = await sb.auth.getUser();
  if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  const { data, error } = await sb.rpc('game_award_action', {
    p_user: u.user.id, p_action: action, p_target_type: targetType || 'none', p_target: targetId || null
  });
  if (error) return NextResponse.json({ error:'failed' },{ status:500 });
  return NextResponse.json({ awarded: data || [] });
}
