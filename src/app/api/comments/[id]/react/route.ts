import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['👍','🔥','😂','😢','🤗','🤬','🙄'])

export async function GET(_req: Request, { params }:{ params:{ id:string } }) {
  const sb = createClient()
  const { data } = await sb.rpc('comment_reaction_summary', { p_comment: params.id })
  return NextResponse.json({ summary: data || [] })
}

export async function POST(req: Request, { params }:{ params:{ id:string } }) {
  const { emoji } = await req.json().catch(()=>({}))
  if (!ALLOWED.has(emoji)) return NextResponse.json({ error:'bad_reaction' }, { status:400 })

  const sb = createClient()
  const { data:u } = await sb.auth.getUser()
  if (!u?.user) return NextResponse.json({ error:'unauthorized' }, { status:401 })

  const { error } = await sb.from('comment_reactions').upsert({
    comment_id: params.id, user_id: u.user.id, emoji
  })
  if (error) return NextResponse.json({ error:'react_failed' }, { status:500 })

  const { data: summary } = await sb.rpc('comment_reaction_summary', { p_comment: params.id })
  return NextResponse.json({ ok:true, summary: summary || [] })
}

export async function DELETE(_req: Request, { params }:{ params:{ id:string } }) {
  const sb = createClient()
  const { data:u } = await sb.auth.getUser()
  if (!u?.user) return NextResponse.json({ error:'unauthorized' }, { status:401 })

  await sb.from('comment_reactions').delete().eq('comment_id', params.id).eq('user_id', u.user.id)
  const { data: summary } = await sb.rpc('comment_reaction_summary', { p_comment: params.id })
  return NextResponse.json({ ok:true, summary: summary || [] })
}
