/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, body, parentId } = await req.json()
  if (!body || body.length === 0 || body.length > 1000) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, body, parent_id: parentId ?? null, author_id: user.id })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify post author and parent comment author
  try {
    const excerpt = body.slice(0, 120)
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()
    if (post?.author_id) {
      await supabase.rpc('create_notification', {
        p_user: post.author_id,
        p_actor: user.id,
        p_type: 'post_comment',
        p_post: postId,
        p_comment: data.id,
        p_meta: { excerpt }
      })
    }
    if (parentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentId)
        .single()
      const parentAuthor = parent?.author_id
      if (parentAuthor && parentAuthor !== post?.author_id) {
        await supabase.rpc('create_notification', {
          p_user: parentAuthor,
          p_actor: user.id,
          p_type: 'comment_reply',
          p_post: postId,
          p_comment: data.id,
          p_meta: { excerpt }
        })
      }
    }
  } catch (e) {
    console.error('[comments:notify]', e)
  }

  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const authHeader = req.headers.get('authorization')
  const token = authHeader ? authHeader.split('Bearer ')[1] : undefined
  let viewer: string | undefined
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    viewer = user?.id
  }

  const { data, error } = await supabase.rpc('get_post_comments', {
    p_viewer: viewer ?? null,
    p_post: postId,
    p_before: cursor ?? new Date().toISOString(),
    p_limit: limit,
    p_preview_replies: 2
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const items = data ?? []
  const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null
  return NextResponse.json({ items, nextCursor })
}
