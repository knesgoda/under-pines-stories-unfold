/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 50)
  const cursor = searchParams.get('cursor')

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]

  const { data: { user }, error: uErr } = await supabase.auth.getUser(token)
  if (uErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const before = cursor ?? new Date().toISOString()

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, type, post_id, comment_id, actor_id, created_at, read_at, meta')
    .eq('user_id', user.id)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[notifications:list]', error)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  const actorIds = Array.from(new Set(rows?.map(r => r.actor_id) ?? []))
  let actors: Record<string, any> = {}
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', actorIds)
    actors = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  }

  const items = (rows ?? []).map(r => ({
    id: r.id,
    type: r.type,
    postId: r.post_id,
    commentId: r.comment_id,
    createdAt: r.created_at,
    readAt: r.read_at,
    meta: r.meta ?? {},
    actor: actors[r.actor_id] ?? { id: r.actor_id, username: 'unknown' },
  }))

  const nextCursor = items.length ? items[items.length - 1].createdAt : null
  return NextResponse.json({ items, nextCursor })
}
