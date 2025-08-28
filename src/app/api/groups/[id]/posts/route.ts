import { NextResponse } from 'next/server'; import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { text, media } = await req.json().catch(()=>({}));
  const sb = createClient(); const { data: u } = await sb.auth.getUser();
  if (!u?.user || !text) return NextResponse.json({ error:'unauthorized' }, { status:401 });

  // must be active member
  const { data: m } = await sb.from('group_members').select('state').eq('group_id', params.id).eq('user_id', u.user.id).maybeSingle();
  if (m?.state !== 'active') return NextResponse.json({ error:'forbidden' }, { status:403 });

  const { data, error } = await sb.from('posts').insert({
    author_id: u.user.id, body: text, media: media||[], status: 'published', group_id: params.id
  }).select('id').single();
  if (error) return NextResponse.json({ error:'create_failed' }, { status:500 });
  await fetch(new URL('/api/game/claim/action', process.env.NEXT_PUBLIC_APP_ORIGIN), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'post', targetType:'post', targetId: data.id })
  });
  return NextResponse.json({ postId: data.id });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sp=new URL(req.url).searchParams; const before=sp.get('cursor')||new Date().toISOString(); const limit=Math.min(parseInt(sp.get('limit')||'20',10),50);
  const sb=createClient(); const { data:u }=await sb.auth.getUser(); if(!u?.user) return NextResponse.json({ error:'unauthorized'},{status:401});

  // visibility gate
  const { data: g } = await sb.from('groups').select('visibility').eq('id', params.id).maybeSingle();
  if (g?.visibility !== 'public') {
    const { data: m } = await sb.from('group_members').select('state').eq('group_id', params.id).eq('user_id', u.user.id).maybeSingle();
    if (m?.state !== 'active') return NextResponse.json({ error:'forbidden' }, { status: 403 });
  }

  const { data, error } = await sb
    .from('posts')
    .select('id, author_id, body, media, created_at, like_count, comment_count')
    .eq('group_id', params.id)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error:'list_failed' }, { status:500 });
  return NextResponse.json({ items: data||[], nextCursor: data?.length ? data[data.length-1].created_at : null });
}
