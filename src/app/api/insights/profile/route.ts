import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';
export async function GET(){
  const sb=createClient(); const { data:u }=await sb.auth.getUser(); if(!u?.user) return NextResponse.json({ error:'unauthorized' },{status:401});
  const uid=u.user.id;
  const [{ count: posts }, { count: followers }] = await Promise.all([
    sb.from('posts').select('id', { count:'exact', head:true }).eq('author_id', uid).eq('status','published'),
    sb.from('follows').select('followee_id', { count:'exact', head:true }).eq('followee_id', uid),
  ]);
  return NextResponse.json({ posts: posts||0, followers: followers||0 });
}
