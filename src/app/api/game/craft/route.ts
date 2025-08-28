import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const { recipe, times = 1 } = await req.json().catch(()=>({}));
  if(!recipe) return NextResponse.json({ error:'bad_request' },{status:400});
  const sb = createClient(); const { data:u } = await sb.auth.getUser();
  if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  const { data, error } = await sb.rpc('game_craft', { p_user: u.user.id, p_recipe_slug: recipe, p_times: times });
  if (error) return NextResponse.json({ error:'craft_failed' },{status:400});
  return NextResponse.json({ created: data || [] });
}
