import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function POST(req: Request){
  const { postId, context='feed' } = await req.json().catch(()=>({}));
  if(!postId) return NextResponse.json({ ok:true }); // no-op
  const sb=createClient(); const { data:u }=await sb.auth.getUser();
  const viewer = u?.user?.id ?? null;
  await sb.from('post_impressions').upsert({ post_id: postId, viewer_id: viewer, seen_on: new Date().toISOString().slice(0,10), context });
  return NextResponse.json({ ok: true });
}
