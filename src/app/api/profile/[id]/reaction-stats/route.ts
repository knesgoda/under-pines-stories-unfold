import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: me } = await sb.auth.getUser()
  let targetId = params.id
  if (params.id === 'me') {
    if (!me?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    targetId = me.user.id
  }

  const [{ data: used }, { data: received }, { data: reactors }] = await Promise.all([
    sb.rpc('user_emoji_usage', { p_user: targetId }),
    sb.rpc('user_emoji_received', { p_user: targetId }),
    sb.rpc('user_top_reactors', { p_user: targetId, p_limit: 12 })
  ])

  let reactorProfiles: Record<string, any> = {}
  if (reactors?.length) {
    const ids = reactors.map((r: any) => r.reactor_id)
    const { data: profs } = await sb.from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', ids)
    for (const p of (profs || [])) reactorProfiles[p.id] = p
  }

  return NextResponse.json({
    used: used || [],
    received: received || [],
    topReactors: (reactors || []).map((r: any) => ({ count: r.total, user: reactorProfiles[r.reactor_id] || { id: r.reactor_id } }))
  })
}
