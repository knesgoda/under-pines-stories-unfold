import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(req: Request){
  const { postId, question, options, multi=false } = await req.json().catch(()=>({}));
  if(!postId || !question || !Array.isArray(options) || options.length<2) return NextResponse.json({ error:'bad_request' },{status:400});
  const sb=createClient(); const { data:u }=await sb.auth.getUser(); if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  // only author can attach a poll to their post
  const { data: p } = await sb.from('posts').select('author_id').eq('id', postId).maybeSingle();
  if(!p || p.author_id!==u.user.id) return NextResponse.json({ error:'forbidden' },{status:403});

  const { data: poll, error } = await sb.from('polls').insert({ post_id: postId, question, multi }).select('id').single();
  if (error) return NextResponse.json({ error:'create_failed' }, { status: 500 });
  const rows = (options as string[]).slice(0,8).map((text, i) => ({ poll_id: poll.id, text: text.trim(), ord: i }));
  await sb.from('poll_options').insert(rows);
  return NextResponse.json({ pollId: poll.id });
}
