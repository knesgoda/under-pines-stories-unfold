import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function GET(req: Request, { params }:{params:{id:string}}){
  const sp=new URL(req.url).searchParams; const days=Math.min(parseInt(sp.get('days')||'14',10),90);
  const sb=createClient(); const { data:u }=await sb.auth.getUser(); if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  // must own the post
  const { data:p } = await sb.from('posts').select('author_id').eq('id', params.id).maybeSingle();
  if(!p || p.author_id!==u.user.id) return NextResponse.json({ error:'forbidden' },{status:403});
  const { data } = await sb.rpc('post_insights', { p_post: params.id, p_days: days });
  return NextResponse.json({ series: data || [] });
}
