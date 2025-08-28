import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(req: Request, { params }:{params:{postId:string}}){
  const { optionIds } = await req.json().catch(()=>({}));
  const sb=createClient(); const { data:u }=await sb.auth.getUser(); if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});

  const { data: pol } = await sb.from('polls').select('id,multi').eq('post_id', params.postId).maybeSingle();
  if(!pol) return NextResponse.json({ error:'not_found' },{status:404});

  const opts = Array.isArray(optionIds) ? optionIds.slice(0, pol.multi ? 8 : 1) : [];
  if(!opts.length) return NextResponse.json({ error:'bad_request' },{status:400});

  // replace vote (idempotent)
  await sb.from('poll_votes').delete().eq('poll_id', pol.id).eq('user_id', u.user.id);
  await sb.from('poll_votes').insert(opts.map((oid:string)=>({ poll_id: pol.id, option_id: oid, user_id: u.user.id })));
  const { data: results } = await sb.rpc('poll_results', { p_poll: pol.id });
  return NextResponse.json({ results: results||[] });
}
