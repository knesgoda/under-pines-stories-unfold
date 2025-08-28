import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const sp = new URL(req.url).searchParams
  const emoji = sp.get('emoji') as any
  if (!emoji) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { data } = await sb.rpc('reactors_by_comment_emoji', { p_comment: params.id, p_emoji: emoji, p_limit: 100 })

  let reactorProfiles: Record<string, any> = {}
  if (data?.length) {
    const ids = Array.from(new Set(data.map((r: any) => r.user_id)))
    const { data: profs } = await sb.from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', ids)
    for (const p of (profs || [])) reactorProfiles[p.id] = p
  }

  return NextResponse.json({
    items: (data || []).map((r: any) => ({ reacted_at: r.reacted_at, user: reactorProfiles[r.user_id] || { id: r.user_id } }))
  })
}
